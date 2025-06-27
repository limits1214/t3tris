use crate::ws_world::{
    command::{Game, Lobby, Pubsub, Room, Ws, WsWorldCommand},
    connections::WsConnections,
    model::{GameId, RoomId, TopicId, UserId, WsData, WsId},
    pubsub::WsPubSub,
};
use tokio::task::JoinHandle;

pub mod command;
pub mod model;

mod connections;
mod game;
mod lobby;
mod pubsub;
mod room;
mod util;
mod ws;

#[derive(Debug)]
pub struct WsWorld {
    connections: WsConnections,
    data: WsData,
    pubsub: WsPubSub,
}
impl WsWorld {
    pub fn new() -> Self {
        Self {
            connections: WsConnections::new(),
            data: WsData::new(),
            pubsub: WsPubSub::new(),
        }
    }
}

impl WsWorld {
    pub fn init() -> (
        tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
        JoinHandle<()>,
    ) {
        let (world_sender, mut world_receiver) =
            tokio::sync::mpsc::unbounded_channel::<WsWorldCommand>();

        let word_receive_task_join_handle = tokio::spawn(async move {
            let mut world = WsWorld::new();

            let mut cleanup_timer = tokio::time::interval(std::time::Duration::from_secs(10));
            let mut game_ticker_timer =
                tokio::time::interval(std::time::Duration::from_millis(1000 / 60));

            loop {
                tokio::select! {
                    msg = world_receiver.recv() => {
                        if let Some(msg) = msg {
                            process(&mut world.connections, &mut world.data, &mut world.pubsub, msg)
                        } else {
                            tracing::warn!("WsWorld received None msg, break!");
                            break;
                        }
                    }
                    _ = cleanup_timer.tick() => {
                        world.pubsub.pubsub_cleanup();
                        room::room_cleanup(&world.connections, &mut world.data, &mut world.pubsub);
                    }
                    _ = game_ticker_timer.tick() => {
                        game::tick(&world.connections, &mut world.data, &mut world.pubsub);
                    }
                }
            }
        });
        (world_sender, word_receive_task_join_handle)
    }
}

fn process(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    msg: WsWorldCommand,
) {
    match msg {
        WsWorldCommand::Ws(cmd) => match cmd {
            Ws::InitWs {
                ws_id,
                ws_sender_tx,
            } => {
                ws::init_ws(connections, data, pubsub, WsId(ws_id), ws_sender_tx);
            }
            Ws::CleanupWs { ws_id } => {
                ws::cleanup_ws(connections, data, pubsub, WsId(ws_id));
            }
            Ws::GetWsWorldInfo { tx } => {
                let info_str = ws::get_ws_world_info(connections, data, pubsub);
                let _ = tx.send(info_str);
            }
            Ws::LoginUser {
                ws_id,
                user_id,
                nick_name,
            } => {
                ws::login_user(
                    connections,
                    data,
                    pubsub,
                    WsId(ws_id),
                    UserId(user_id),
                    nick_name,
                );
            }
            Ws::LoginFailed { ws_id } => ws::login_failed_user(pubsub, ws_id),
            Ws::LogoutUser { ws_id } => {
                ws::logout_user(connections, data, pubsub, WsId(ws_id));
            }
        },
        WsWorldCommand::Lobby(cmd) => match cmd {
            Lobby::Subscribe { ws_id } => {
                lobby::lobby_subscribe(connections, data, pubsub, WsId(ws_id));
            }
            Lobby::UnSubscribe { ws_id } => {
                lobby::lobby_unsubscribe(connections, data, pubsub, WsId(ws_id));
            }
            // Lobby::Enter { .. } => {
            //     lobby::lobby_enter(connections, data, pubsub, WsId(ws_id));
            // }
            // Lobby::Leave { .. } => {
            //     lobby::lobby_leave(connections, data, pubsub, WsId(ws_id));
            // }
            Lobby::Chat { ws_id, msg } => {
                lobby::lobby_chat(&connections, data, pubsub, WsId(ws_id), &msg);
            }
        },
        WsWorldCommand::Room(cmd) => match cmd {
            Room::Create { room_name, ws_id } => {
                room::create(connections, data, pubsub, WsId(ws_id), room_name);
            }
            Room::Leave { ws_id, room_id } => {
                room::leave(connections, data, pubsub, WsId(ws_id), RoomId(room_id));
            }
            Room::Enter { ws_id, room_id } => {
                room::enter(connections, data, pubsub, WsId(ws_id), RoomId(room_id));
            }
            Room::Chat {
                ws_id,
                room_id,
                msg,
            } => {
                room::chat(connections, data, pubsub, WsId(ws_id), RoomId(room_id), msg);
            }
            Room::GameReady { ws_id, room_id } => {
                room::room_game_ready(connections, data, pubsub, WsId(ws_id), RoomId(room_id));
            }
            Room::GameUnReady { ws_id, room_id } => {
                room::room_game_unready(connections, data, pubsub, WsId(ws_id), RoomId(room_id));
            }
            Room::GameStart { ws_id, room_id } => {
                room::room_game_start(&connections, data, pubsub, WsId(ws_id), RoomId(room_id));
            }
        },
        WsWorldCommand::Game(cmd) => match cmd {
            Game::Action {
                ws_id,
                game_id,
                action,
            } => {
                game::action(
                    connections,
                    data,
                    pubsub,
                    WsId(ws_id),
                    GameId(game_id),
                    action,
                );
            }
        },
        WsWorldCommand::Pubsub(cmd) => match cmd {
            Pubsub::Subscribe { ws_id, topic } => pubsub.subscribe(&WsId(ws_id), &TopicId(topic)),
            Pubsub::UnSubscribe { ws_id, topic } => {
                pubsub.unsubscribe(&WsId(ws_id), &TopicId(topic))
            }
            Pubsub::Publish { topic, msg } => pubsub.publish(&TopicId(topic), &msg),
            Pubsub::Cleanup => pubsub.pubsub_cleanup(),
        },
    }
}
