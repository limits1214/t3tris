use crate::{
    app::state::{ArcWsAppState, WsShutDown},
    constant::TOPIC_WS_ID,
    model::{
        client_to_server_ws_msg::ClientToServerWsMsg::{self, *},
        server_to_client_ws_msg::ServerToClientWsMsg,
    },
    topic,
    ws_world::command::{Game, Lobby, Pubsub, Room, Ws, WsWorldCommand},
};
use axum::{
    Json, Router,
    extract::{
        Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
    routing::get,
};
use common::error::AppResult;
use futures::{SinkExt, StreamExt};
use nanoid::nanoid;
use serde::Deserialize;
use sqlx::PgPool;
use std::{ops::ControlFlow, sync::atomic::Ordering};

pub fn ws_router(_state: ArcWsAppState) -> Router<ArcWsAppState> {
    Router::new().route("/ws/haha", get(ws_upgrade)).route(
        "/ws/haha/info",
        get(async |State(s): State<ArcWsAppState>| {
            let (tx, rx) = tokio::sync::oneshot::channel::<serde_json::Value>();
            let _ =
                s.0.ws_world_command_tx
                    .send(WsWorldCommand::Ws(Ws::GetWsWorldInfo { tx }));
            Json(rx.await.unwrap())
        }),
    )
}

#[derive(Deserialize, Debug)]
pub struct WsQuery {
    pub ws_token: String,
}

/// ws 핸들러
/// - client는 유효한 ws_token을 쿼리스트링으로 보내야한다.
pub async fn ws_upgrade(
    State(db_pool): State<PgPool>,
    ws_upgrade: WebSocketUpgrade,
    State(ws_shut_down): State<WsShutDown>,
    Query(WsQuery { ws_token }): Query<WsQuery>,
    State(state): State<ArcWsAppState>,
) -> AppResult<impl IntoResponse> {
    common::util::jwt::decode_access_token(&ws_token)?;

    let response = ws_upgrade.on_upgrade(move |socket| async move {
        let ws_id = nanoid!();
        ws(
            socket,
            ws_shut_down,
            &ws_id,
            state.0.ws_world_command_tx.clone(),
            db_pool,
        )
        .await;
    });
    Ok(response)
}

/// Ws Client
///             ---> Ws Server recv_task
///                                     receiver 에서 클라메시지를 받고
///                                     비지니스 로직 을 처리한다.
///                                     처리후 sender 를통해 메시지를 보낸다.
///             <--- Ws Server send_task
///                                     단순히 클라이언트로 메시지를 전달한다.
pub async fn ws(
    socket: WebSocket,
    mut shutdown: WsShutDown,
    ws_id: &str,
    mut ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    db_pool: PgPool,
) {
    let ws_id = ws_id.to_string();
    // let user_id = user.id.to_string();
    // let user_nick_name = user.nick_name.to_string();

    // ws 통신 소켓 생성
    let (mut sender, mut receiver) = socket.split();

    // ws_topic <-> sender 에서 통신할 채널 생성
    let (topic_msg_tx, mut topic_msg_rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    // 만약 sender_task가 종료되면 recv_task에게 정리하고 종료 하라고 신호를 보내는용
    let (ws_dead_tx, mut ws_dead_rx) = tokio::sync::watch::channel(());

    // ws client 로 부터 오는 메시지 처리
    // 어플리케이션 graceful shutdown 처리
    // sender_task 종료신호 받는 처리
    // recv task 종료전에 최종 ws 정리 로직을 수행해야한다.
    let mut ws_recv_task = tokio::spawn(async move {
        shutdown.connection_count.fetch_add(1, Ordering::SeqCst);
        tracing::debug!(
            "ws start, ws_id: {}, connection_count: {:?}",
            ws_id,
            shutdown.connection_count
        );

        // ws 시작시 해야할것들
        {
            let _ = ws_world_command_tx.send(WsWorldCommand::Ws(Ws::InitWs {
                ws_id: ws_id.to_string(),
                ws_sender_tx: topic_msg_tx,
            }));
        }

        // recv 처리
        loop {
            tokio::select! {
                // client 메시지처리
                msg = receiver.next() => {
                    match process_clinet_msg(msg, &mut ws_world_command_tx,&ws_id, &db_pool) {
                        ControlFlow::Continue(_) => continue,
                       ControlFlow::Break(_) => break,
                    }
                }
                // application graceful shudown
                _ = shutdown.shutdown_rx.changed() => {
                    tracing::info!("in task, shutdown rx received! break!");
                    break;
                }
                // sendertask abort
                _ = ws_dead_rx.changed() => {
                    tracing::warn!("ws_sender_dead_rx");
                    break;
                }
            }
        }

        // ws 종료전에 정리할 로직은 여기에
        {
            let _ = ws_world_command_tx.send(WsWorldCommand::Ws(Ws::CleanupWs {
                ws_id: ws_id.to_string(),
            }));
        }

        shutdown.connection_count.fetch_sub(1, Ordering::SeqCst);
        tracing::debug!("ws end,  ws_id: {}", ws_id);
    });

    // ws_topic 들로부터 오는 메시지를 ws 클라에게 단순 전달한다.
    let mut ws_send_task = tokio::spawn(async move {
        loop {
            match topic_msg_rx.recv().await {
                Some(msg) => {
                    if let Err(err) = sender.send(Message::Text(msg.into())).await {
                        tracing::warn!("sender task error: {err}");
                        // break;
                    }
                }
                None => {
                    break;
                }
            }
        }
    });

    tokio::select! {
        _ = &mut ws_recv_task => {
            // recv_task 가 종료되면
            // send_task 도 종료 시킨다.
            ws_send_task.abort();
        }
        _ = &mut ws_send_task => {
            // send_task가 종료될일은 거의 없을거다.

            // recv_task를 abort 할수는 없다.
            // recv_task를 abort 해버리면 정리 로직이 수행되지 않을수 있다.
            // 따라서, 정리 로직이 수행되게 위해 channel을통해 recv_task 종료 신호를 준다.
            if let Err(err) = ws_dead_tx.send(()) {
                tracing::warn!("sender_dead_tx_send err: {err:?}");
            }
        }
    };
}

pub fn process_clinet_msg(
    msg: Option<Result<Message, axum::Error>>,
    ws_world_command_tx: &mut tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    ws_id: &str,
    db_pool: &PgPool,
) -> ControlFlow<()> {
    match msg {
        Some(Ok(Message::Text(text))) => {
            tracing::debug!("ws_in_text: {text:?}");
            let msg = match serde_json::from_str::<ClientToServerWsMsg>(&text) {
                Ok(msg) => msg,
                Err(err) => {
                    tracing::warn!("clinet msg wrong, err:{err:?}, msg: {text:?}");
                    return ControlFlow::Continue(());
                }
            };
            match msg {
                Ping => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Pubsub(Pubsub::Publish {
                        topic: topic!(TOPIC_WS_ID, ws_id).to_string(),
                        msg: ServerToClientWsMsg::Pong.to_json(),
                    }));
                }
                Echo { msg } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Pubsub(Pubsub::Publish {
                        topic: topic!(TOPIC_WS_ID, ws_id).to_string(),
                        msg: ServerToClientWsMsg::Echo { msg }.to_json(),
                    }));
                }
                TopicEcho { topic, msg } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Pubsub(Pubsub::Publish {
                        topic: topic.to_owned(),
                        msg: ServerToClientWsMsg::TopicEcho { topic, msg }.to_json(),
                    }));
                }
                SubscribeTopic { topic } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Pubsub(Pubsub::Subscribe {
                        ws_id: ws_id.to_string(),
                        topic,
                    }));
                }
                UnSubscribeTopic { topic } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Pubsub(Pubsub::UnSubscribe {
                        ws_id: ws_id.to_string(),
                        topic,
                    }));
                }
                UserLogin { access_token } => {
                    let ws_id = ws_id.to_string();
                    let ws_world_command_tx = ws_world_command_tx.clone();
                    let db_pool = db_pool.clone();
                    tokio::spawn(async move {
                        if let Err(err) = task(
                            db_pool,
                            access_token,
                            ws_world_command_tx.clone(),
                            ws_id.clone(),
                        )
                        .await
                        {
                            tracing::warn!("ws user login err: {err:?}");
                            let _ = ws_world_command_tx
                                .send(WsWorldCommand::Ws(Ws::LoginFailed { ws_id: ws_id }));
                        }

                        async fn task(
                            db_pool: PgPool,
                            access_token: String,
                            ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
                            ws_id: String,
                        ) -> anyhow::Result<()> {
                            let claim = common::util::jwt::decode_access_token(&access_token)?;
                            let mut conn = db_pool.acquire().await?;
                            let user =
                                common::repository::user::select_user_by_id(&mut conn, &claim.sub)
                                    .await?;
                            if let Some(user) = user {
                                let _ =
                                    ws_world_command_tx.send(WsWorldCommand::Ws(Ws::LoginUser {
                                        ws_id: ws_id,
                                        user_id: user.id,
                                        nick_name: user.nick_name,
                                    }));
                            }
                            Ok(())
                        }
                    });
                }
                UserLogout => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Ws(Ws::LogoutUser {
                        ws_id: ws_id.to_string(),
                    }));
                }

                // 로비 관련
                LobbySubscribe => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Lobby(Lobby::Subscribe {
                        ws_id: ws_id.to_string(),
                    }));
                }
                LobbyUnSubscribe => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Lobby(Lobby::UnSubscribe {
                        ws_id: ws_id.to_string(),
                    }));
                }
                // LobbyEnter => {
                //     let _ = ws_world_command_tx.send(WsWorldCommand::Lobby(Lobby::Enter {
                //         ws_id: ws_id.to_string(),
                //     }));
                // }
                // LobbyLeave => {
                //     let _ = ws_world_command_tx.send(WsWorldCommand::Lobby(Lobby::Leave {
                //         ws_id: ws_id.to_string(),
                //     }));
                // }
                LobbyChat { msg } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Lobby(Lobby::Chat {
                        ws_id: ws_id.to_string(),
                        msg,
                    }));
                }

                // 룸 관련
                RoomCreate { room_name } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::Create {
                        ws_id: ws_id.to_string(),
                        room_name,
                    }));
                }
                RoomChat { room_id, msg } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::Chat {
                        ws_id: ws_id.to_string(),
                        room_id,
                        msg,
                    }));
                }
                RoomEnter { room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::Enter {
                        ws_id: ws_id.to_string(),
                        room_id,
                    }));
                }
                RoomLeave { room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::Leave {
                        ws_id: ws_id.to_string(),
                        room_id,
                    }));
                }
                RoomGameReady { room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::GameReady {
                        ws_id: ws_id.to_string(),
                        room_id,
                    }));
                }
                RoomGameUnReady { room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::GameUnReady {
                        ws_id: ws_id.to_string(),
                        room_id,
                    }));
                }
                RoomGameStart { room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::GameStart {
                        ws_id: ws_id.to_string(),
                        room_id,
                    }));
                }
                RoomGameTypeChange { room_id, game_type } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Room(Room::GameTypeChange {
                        ws_id: ws_id.to_string(),
                        room_id,
                        game_type,
                    }));
                }
                //
                GameAction {
                    action, game_id, ..
                } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Game(Game::Action {
                        ws_id: ws_id.to_string(),
                        game_id,
                        action: action.into(),
                    }));
                }
                GameSync { game_id, room_id } => {
                    let _ = ws_world_command_tx.send(WsWorldCommand::Game(Game::Sync {
                        ws_id: ws_id.to_string(),
                        room_id,
                        game_id,
                    }));
                }
            }
        }
        None => {
            tracing::warn!("msg is none, break!");
            return ControlFlow::Break(());
        }
        _ => {}
    }
    ControlFlow::Continue(())
}
