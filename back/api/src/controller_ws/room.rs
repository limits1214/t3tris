use std::sync::Arc;

use crate::{app::state::ArcAppState, extractor::redis::RedisClient};
use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, Query, State, WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use bb8_redis::{redis::AsyncCommands, RedisConnectionManager};
use futures::{SinkExt, StreamExt};
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
/// client -> server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
enum ClientWsMsg {
    #[serde(rename_all = "camelCase")]
    Ping,
    #[serde(rename_all = "camelCase")]
    RoomUserAction { action: UserAction },
    #[serde(rename_all = "camelCase")]
    RoomEnter { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomLeave { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomChat { room_id: String, msg: String },
    // #[serde(rename_all = "camelCase")]
    // RoomCreate {
    //     detail: RoomDetail,
    // }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RoomDetail {
    pub room_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
enum UserAction {
    Left,
    Right,
    Down,
    Drop,
    CWRotate,
    CCWRotate,
}

/// server -> client
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
enum ServerWsMsg {
    #[serde(rename_all = "camelCase")]
    Pong,
    #[serde(rename_all = "camelCase")]
    RoomChat { msg: String },
}

#[derive(Debug, Serialize, Deserialize)]
struct UserSession {
    //
}

pub fn room_ws_router(_state: ArcAppState) -> Router<ArcAppState> {
    Router::new().route("/ws/room/{roomId}", get(room_ws_upgrade))
}

#[derive(Deserialize, Debug)]
pub struct RoomWsQuery {
    pub token: String,
}

pub async fn room_ws_upgrade(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    Query(RoomWsQuery { token }): Query<RoomWsQuery>,
    RedisClient(redis_client): RedisClient,
    State(redis_pool): State<bb8::Pool<RedisConnectionManager>>,
) -> impl IntoResponse {
    // TODO: validate roomId

    ws.on_upgrade(move |socket| async move {
        let res = room_ws(socket, &room_id, &token, redis_client, redis_pool).await;
        if let Err(err) = res {
            tracing::warn!("room_ws err: {err:?}, room_id: {room_id:?}, token: {token:?}");
        }
    })
}

#[derive(Debug)]
pub struct RoomJoinHandle {
    room_id: Option<String>,
    room_handle: Option<tokio::task::JoinHandle<()>>,
    room_user_handle: Option<tokio::task::JoinHandle<()>>,
}

impl RoomJoinHandle {
    pub fn new() -> Self {
        Self {
            room_id: None,
            room_handle: None,
            room_user_handle: None,
        }
    }

    pub fn is_entered(&self) -> bool {
        self.room_id.is_some()
    }

    pub async fn enter(
        &mut self,
        ws_id: &str,
        room_id: &str,
        sender: Arc<Mutex<futures::stream::SplitSink<WebSocket, Message>>>,
        redis_clinet: redis::Client,
    ) {
        let ws_id = ws_id.to_string();
        let room_id = room_id.to_string();

        self.room_id = Some(room_id.to_string());

        let send_room_redis_client = redis_clinet.clone();
        let send_room_room_id = room_id.clone();
        let send_room_sender = sender.clone();
        self.room_handle = Some(tokio::spawn(async move {
            let a: anyhow::Result<()> = async {
                let mut pubsub_conn = send_room_redis_client.get_async_pubsub().await?;
                pubsub_conn
                    .subscribe(format!("room:{send_room_room_id}"))
                    .await?;
                let mut pubsub_on_message = pubsub_conn.on_message();
                loop {
                    match pubsub_on_message.next().await {
                        Some(msg) => {
                            let payload = msg.get_payload::<String>()?;
                            {
                                let arc_room_sender = send_room_sender.clone();
                                let mut guard_arc_sender = arc_room_sender.lock().await;
                                guard_arc_sender.send(Message::Text(payload.into())).await?;
                            }
                        }
                        None => {
                            break;
                        }
                    }
                }
                Ok(())
            }
            .await;
            if let Err(err) = a {
                tracing::warn!("ws_sender_task err: {err:?}");
            }
        }));

        let send_room_user_redis_client = redis_clinet.clone();
        let send_room_user_room_id = room_id.clone();
        let send_room_user_sender = sender.clone();
        self.room_user_handle = Some(tokio::spawn(async move {
            let a: anyhow::Result<()> = async {
                let mut pubsub_conn = send_room_user_redis_client.get_async_pubsub().await?;
                pubsub_conn
                    .subscribe(format!("room:{send_room_user_room_id}:user:{ws_id}"))
                    .await?;
                let mut pubsub_on_message = pubsub_conn.on_message();
                loop {
                    match pubsub_on_message.next().await {
                        Some(msg) => {
                            let payload = msg.get_payload::<String>()?;
                            {
                                let arc_room_user_sender = send_room_user_sender.clone();
                                let mut guard_arc_sender = arc_room_user_sender.lock().await;
                                guard_arc_sender.send(Message::Text(payload.into())).await?;
                            }
                        }
                        None => {
                            break;
                        }
                    }
                }
                Ok(())
            }
            .await;
            if let Err(err) = a {
                tracing::warn!("ws_sender_task err: {err:?}");
            }
        }));
    }

    pub fn leave(&mut self) {
        self.room_id = None;
        if let Some(handle) = &self.room_handle {
            handle.abort();
            self.room_handle = None;
        };
        if let Some(handle) = &self.room_user_handle {
            handle.abort();
            self.room_user_handle = None;
        };
    }

    pub fn is_same_room(&self, room_id: &str) -> bool {
        if let Some(rid) = &self.room_id {
            if rid == room_id {
                true
            } else {
                false
            }
        } else {
            false
        }
    }
}

/// client -> server
///     recv_task
/// server -> client
///     send_user_task
/// ----
///     server -> client
///         send_room_user_task
///     server -> client
///         send_room_task
pub async fn room_ws(
    socket: WebSocket,
    room_id: &str,
    token: &str,
    redis_clinet: redis::Client,
    redis_pool: bb8::Pool<RedisConnectionManager>,
) -> anyhow::Result<()> {
    let ws_id = nanoid!();
    // let channel_name = format!("channel");
    tracing::info!(
        "room_ws start, room_id: {}, token: {}, ws_id: {}",
        room_id,
        token,
        ws_id
    );

    let (sender, mut receiver) = socket.split();
    let arc_sender = Arc::new(tokio::sync::Mutex::new(sender));

    let arc_room_join_handle = Arc::new(Mutex::new(RoomJoinHandle::new()));

    let recv_ws_id = ws_id.clone();
    let recv_arc_sender = arc_sender.clone();
    let recv_redis_client = redis_clinet.clone();
    let recv_arc_room_join_handle = arc_room_join_handle.clone();
    let mut recv_task = tokio::spawn(async move {
        let a: anyhow::Result<()> = async {
            loop {
                match receiver.next().await {
                    Some(Ok(Message::Text(text))) => {
                        // tracing::info!("ws_in_text: {text:?}");

                        match serde_json::from_str::<ClientWsMsg>(&text)? {
                            ClientWsMsg::Ping => {
                                let server_msg = ServerWsMsg::Pong;
                                let server_msg_str = serde_json::to_string(&server_msg)?;

                                let mut publish_conn = redis_pool.get_owned().await?;
                                publish_conn
                                    .publish::<String, String, ()>(
                                        format!("user:{recv_ws_id}"),
                                        server_msg_str,
                                    )
                                    .await?;
                            }
                            ClientWsMsg::RoomUserAction { action } => {
                                //
                            }
                            ClientWsMsg::RoomEnter { room_id } => {
                                tracing::info!("room ener room_id: {room_id}, ws_id: {recv_ws_id}");
                                let mut guard = recv_arc_room_join_handle.lock().await;
                                guard
                                    .enter(
                                        &recv_ws_id,
                                        &room_id,
                                        recv_arc_sender.clone(),
                                        recv_redis_client.clone(),
                                    )
                                    .await;
                            }
                            ClientWsMsg::RoomLeave { room_id } => {
                                tracing::info!(
                                    "room leave room_id: {room_id}, ws_id: {recv_ws_id}"
                                );
                                let mut guard = recv_arc_room_join_handle.lock().await;
                                guard.leave();
                            }
                            ClientWsMsg::RoomChat { msg, room_id } => {
                                let is_same_room = {
                                    let guard = recv_arc_room_join_handle.lock().await;
                                    guard.is_same_room(&room_id)
                                };
                                if is_same_room {
                                    let server_msg = ServerWsMsg::RoomChat { msg: msg };
                                    let server_msg_str = serde_json::to_string(&server_msg)?;

                                    let mut publish_conn = redis_pool.get_owned().await?;
                                    publish_conn
                                        .publish::<String, String, ()>(
                                            format!("room:{room_id}"),
                                            server_msg_str,
                                        )
                                        .await?;
                                }
                            }
                        }
                    }
                    None => {
                        break;
                    }
                    _ => {}
                }
            }
            Ok(())
        }
        .await;
        if let Err(err) = a {
            tracing::warn!("ws_recv_task err: {err:?}");
        }
    });

    let arc_user_sender = arc_sender.clone();
    let user_redis_client = redis_clinet.clone();
    let user_ws_id = ws_id.clone();
    let mut send_user_task = tokio::spawn(async move {
        let a: anyhow::Result<()> = async {
            let mut pubsub_conn = user_redis_client.get_async_pubsub().await?;
            pubsub_conn.subscribe(format!("user:{user_ws_id}")).await?;
            let mut pubsub_on_message = pubsub_conn.on_message();
            loop {
                match pubsub_on_message.next().await {
                    Some(msg) => {
                        let payload = msg.get_payload::<String>()?;
                        {
                            let arc_user_sender = arc_user_sender.clone();
                            let mut guard_arc_sender = arc_user_sender.lock().await;
                            guard_arc_sender.send(Message::Text(payload.into())).await?;
                        }
                    }
                    None => {
                        break;
                    }
                }
            }
            Ok(())
        }
        .await;
        if let Err(err) = a {
            tracing::warn!("ws_sender_task err: {err:?}");
        }
    });

    tokio::select! {
         _ = &mut recv_task => {
            send_user_task.abort();
        }
        _ = &mut send_user_task => {
            recv_task.abort();
        }
        // _ = tokio::signal::ctrl_c() => {
        //     send_user_task.abort();
        //     recv_task.abort();
        // },
    }

    {
        let mut guard = arc_room_join_handle.lock().await;
        guard.leave();
    }

    tracing::info!(
        "room_ws end, room_id: {}, token: {}, ws_id: {}",
        room_id,
        token,
        ws_id
    );
    Ok(())
}

#[test]
fn msg_test() {
    let t = ClientWsMsg::Ping;
    let s = serde_json::to_string(&t).unwrap();
    println!("s: {s:?}");
}
