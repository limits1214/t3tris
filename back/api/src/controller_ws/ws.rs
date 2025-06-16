use crate::{
    app::state::{ArcAppState, WsShutDown},
    entity::user::User,
    error::{AppResult, AuthError},
    extractor::{db::DbConn, redis::RedisClient},
    repository, util,
};
use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, State, WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use bb8_redis::{redis::AsyncCommands, RedisConnectionManager};
use futures::{stream::SplitStream, SinkExt, StreamExt};
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::atomic::Ordering};
use tokio::sync::mpsc::UnboundedSender;

pub fn ws_router(_state: ArcAppState) -> Router<ArcAppState> {
    Router::new().route("/ws/hahaha", get(ws_upgrade))
}

#[derive(Deserialize, Debug)]
pub struct WsQuery {
    pub access_token: String,
}

/// ws 핸들러
/// - client는 유효한 access_token을 쿼리스트링으로 보내야한다.
/// - 해당 access_token으로 사용자를 조회한다.
pub async fn ws_upgrade(
    DbConn(mut conn): DbConn,
    ws_upgrade: WebSocketUpgrade,
    State(ws_shut_down): State<WsShutDown>,
    Query(WsQuery { access_token }): Query<WsQuery>,
    RedisClient(redis_client): RedisClient,
    State(redis_pool): State<bb8::Pool<RedisConnectionManager>>,
) -> AppResult<impl IntoResponse> {
    let access_token_claim = util::jwt::decode_access_token(&access_token)?;
    let user = repository::user::select_user_by_id(&mut conn, &access_token_claim.sub)
        .await?
        .ok_or(AuthError::UserNotExists)?;

    let response = ws_upgrade.on_upgrade(move |socket| async move {
        let ws_id = nanoid!();
        ws_shut_down.connection_count.fetch_add(1, Ordering::SeqCst);
        let res = ws(
            socket,
            ws_shut_down,
            &ws_id,
            &user,
            redis_client,
            redis_pool,
        )
        .await;
        if let Err(err) = res {
            tracing::warn!("ws err: {err:?}, user: {user:?}, ws_id: {ws_id:?}");
        }
    });
    Ok(response)
}

/// Ws Client
///             ---> Ws Server recv_task
///                                     receiver 에서 클라메시지를 받고
///                                     *비지니스 로직* 을 처리한다.
///                                     처리후 sender 를통해 메시지를 보낸다.
///             <--- Ws Server send_task
///                                     단순히 클라이언트로 메시지를 전달한다.
///
/// topic 기준으로 subscribe, publish 하도록 한다.
/// 기본적으로 사용자에게 전달할 user topic은 자동으로 만들어진다.
///
/// ws_topic은 redis pubsub을 사용
/// redis_client는 pubsub 사용을위한 커넥션을 ws 연결동안 온전히 소유해야 한다.
/// redis_pool은 application 에 풀링하고있는 레디스 커넥션을 꺼내쓰고 반납한다. 캐시 처리나 publish에서 사용한다.
pub async fn ws(
    socket: WebSocket,
    mut shutdown: WsShutDown,
    ws_id: &str,
    user: &User,
    redis_clinet: redis::Client,
    mut redis_pool: bb8::Pool<RedisConnectionManager>,
) -> anyhow::Result<()> {
    let ws_id = ws_id.to_string();
    tracing::info!(
        "ws start, ws_id: {}, user: {:?}, connection_count: {:?}",
        ws_id,
        user,
        shutdown.connection_count
    );

    // ws 통신 소켓 생성
    let (mut sender, mut receiver) = socket.split();

    // ws_topic <-> sender 에서 통신할 채널 생성
    let (sender_tx, mut sender_rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    // ws_topic 생성
    let mut ws_topic = WsTopic::new(sender_tx, redis_clinet, redis_pool.clone());

    // 만약 sender_task가 종료되면 recv_task에게 정리하고 종료 하라고 신호를 보내는용
    let (sender_dead_tx, sender_dead_rx) = tokio::sync::watch::channel(());

    // ws client 로 부터 오는 메시지 처리
    // 어플리케이션 graceful shutdown 처리
    // sender_task 종료신호 받는 처리
    // recv task 종료전에 최종 ws 정리 로직을 수행해야한다.
    let mut recv_task = tokio::spawn(async move {
        // 기본적으로 사용자와 소통할 토픽 자동 생성
        ws_topic.subscribe(&format!("user:{ws_id}"));

        if let Err(err) = task(
            sender_dead_rx,
            &mut shutdown,
            &mut receiver,
            &mut redis_pool,
            &ws_id,
            &mut ws_topic,
        )
        .await
        {
            tracing::warn!("ws_recv_task err: {err:?}");
        }

        // 이제 ws 종료전에 정리할 로직은 여기에
        ws_topic.unsubscribe(&format!("user:{ws_id}"));
        shutdown.connection_count.fetch_sub(1, Ordering::SeqCst);
        tracing::info!("ws end,  ws_id: {}", ws_id);

        async fn task(
            mut sender_dead_rx: tokio::sync::watch::Receiver<()>,
            shutdown: &mut WsShutDown,
            receiver: &mut SplitStream<WebSocket>,
            redis_pool: &mut bb8::Pool<RedisConnectionManager>,
            ws_id: &str,
            ws_topic: &mut WsTopic,
        ) -> anyhow::Result<()> {
            async fn process_clinet_msg(
                msg: Option<Result<Message, axum::Error>>,
                redis_pool: &mut bb8::Pool<RedisConnectionManager>,
                ws_id: &str,
                ws_topic: &mut WsTopic,
            ) -> anyhow::Result<bool> {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        tracing::info!("ws_in_text: {text:?}");

                        match serde_json::from_str::<ClientWsMsg>(&text)? {
                            ClientWsMsg::Ping => {
                                let server_msg = ServerWsMsg::Pong;
                                let server_msg_str = serde_json::to_string(&server_msg)?;

                                let mut publish_conn = redis_pool.get_owned().await?;
                                publish_conn
                                    .publish::<String, String, ()>(
                                        format!("user:{ws_id}"),
                                        server_msg_str,
                                    )
                                    .await?;
                            }
                            ClientWsMsg::Echo { msg } => {
                                let server_msg = ServerWsMsg::Echo { msg: msg };
                                let server_msg_str = serde_json::to_string(&server_msg)?;

                                let mut publish_conn = redis_pool.get_owned().await?;
                                publish_conn
                                    .publish::<String, String, ()>(
                                        format!("user:{ws_id}"),
                                        server_msg_str,
                                    )
                                    .await?;
                            }
                            ClientWsMsg::SubscribeTopic { topic } => {
                                ws_topic.subscribe(&topic);
                            }
                            ClientWsMsg::UnSubscribeTopic { topic } => {
                                ws_topic.unsubscribe(&topic);
                            }
                            ClientWsMsg::TopicEcho { topic, msg } => {
                                let server_msg = ServerWsMsg::TopicEcho {
                                    topic: topic.clone(),
                                    msg,
                                };
                                let server_msg_str = serde_json::to_string(&server_msg)?;
                                ws_topic.publish(&topic, &server_msg_str).await?;
                            }
                        }
                    }
                    None => {
                        return Ok(true);
                    }
                    _ => {}
                }

                Ok(false)
            }
            loop {
                tokio::select! {
                    // client 메시지처리
                    msg = receiver.next() => {
                        let is_break_loop = process_clinet_msg(msg, redis_pool, ws_id, ws_topic).await?;
                        if is_break_loop {
                            break;
                        }
                    }
                    // application graceful shudown
                    _ = shutdown.shutdown_rx.changed() => {
                        tracing::info!("in task, shutdown rx received! break!");
                        break;
                    }
                    // sendertask abort
                    _ = sender_dead_rx.changed() => {
                        break;
                    }
                }
            }
            Ok(())
        }
        ()
    });

    // ws_topic 들로부터 오는 메시지를 ws 클라에게 단순 전달한다.
    let mut send_task = tokio::spawn(async move {
        loop {
            match sender_rx.recv().await {
                Some(msg) => {
                    if let Err(err) = sender.send(Message::Text(msg.into())).await {
                        tracing::warn!("sender task error: {err}");
                        break;
                    }
                }
                None => {
                    break;
                }
            }
        }
    });

    tokio::select! {
        _ = &mut recv_task => {
            // recv_task 가 종료되면
            // send_task 도 종료 시킨다.
            send_task.abort();
        }
        _ = &mut send_task => {
            // send_task가 종료될일은 거의 없을거다.
            tracing::warn!("send_task 종료??? 확인 필요");

            // recv_task를 abort 할수는 없다.
            // recv_task를 abort 해버리면 정리 로직이 수행되지 않을수 있다.
            // 따라서, 정리 로직이 수행되게 위해 channel을통해 recv_task 종료 신호를 준다.
            if let Err(err) = sender_dead_tx.send(()) {
                tracing::warn!("sender_dead_tx_send err: {err:?}");
            }
        }
    };

    Ok(())
}

/// client -> server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
enum ClientWsMsg {
    #[serde(rename_all = "camelCase")]
    Ping,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
    #[serde(rename_all = "camelCase")]
    SubscribeTopic { topic: String },
    #[serde(rename_all = "camelCase")]
    UnSubscribeTopic { topic: String },
}

/// server -> client
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
enum ServerWsMsg {
    #[serde(rename_all = "camelCase")]
    Pong,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
}

pub struct WsTopic {
    topics: HashMap<String, tokio::task::JoinHandle<()>>,
    sender_tx: UnboundedSender<String>,
    redis_client: redis::Client,
    redis_pool: bb8::Pool<RedisConnectionManager>,
}

impl WsTopic {
    pub fn new(
        sender_tx: UnboundedSender<String>,
        redis_client: redis::Client,
        redis_pool: bb8::Pool<RedisConnectionManager>,
    ) -> Self {
        Self {
            topics: HashMap::new(),
            sender_tx,
            redis_client,
            redis_pool,
        }
    }

    pub fn subscribe(&mut self, topic: &str) {
        // TODO: len limit
        if self.topics.len() > 10 {
            tracing::warn!("topics limits is over, subscribe ignored");
            return;
        }
        if self.topics.get(topic).is_some() {
            tracing::info!("topic: {topic:?} is exists, ignored");
            return;
        }

        let redis_client_clone = self.redis_client.clone();
        let sender_tx_clone = self.sender_tx.clone();
        let topic_clone = topic.to_string();
        self.topics.insert(
            topic.to_string(),
            tokio::spawn(async move {
                let res = task(&topic_clone, sender_tx_clone, redis_client_clone).await;
                if let Err(err) = res {
                    tracing::warn!("topic subscribe task err: {err:?}");
                }
                async fn task(
                    topic: &str,
                    sender: UnboundedSender<String>,
                    redis_client: redis::Client,
                ) -> anyhow::Result<()> {
                    let mut pubsub_conn = redis_client.get_async_pubsub().await?;
                    pubsub_conn.subscribe(topic).await?;
                    let mut pubsub_on_message = pubsub_conn.on_message();
                    loop {
                        match pubsub_on_message.next().await {
                            Some(msg) => {
                                let payload = msg.get_payload::<String>()?;
                                if let Err(err) = sender.send(payload) {
                                    tracing::warn!("topic sender err: {err:?}");
                                    break;
                                }
                            }
                            None => {
                                break;
                            }
                        }
                    }

                    Ok(())
                }
            }),
        );
    }

    pub async fn publish(&self, topic: &str, message: &str) -> anyhow::Result<()> {
        let mut publish_conn = self.redis_pool.get_owned().await?;
        publish_conn
            .publish::<String, String, ()>(topic.to_string(), message.to_string())
            .await?;
        Ok(())
    }

    pub fn unsubscribe(&mut self, topic: &str) {
        if let Some(handle) = self.topics.remove(topic) {
            handle.abort();
        }
    }
}
