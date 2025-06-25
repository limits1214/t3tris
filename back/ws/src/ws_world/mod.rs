use crate::ws_world::{
    command::{Game, Lobby, Pubsub, Room, Ws, WsWorldCommand},
    connections::WsConnections,
    model::WsData,
    pubsub::WsPubSub,
};
use std::collections::HashMap;
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
    pub fn init() -> (
        tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
        JoinHandle<()>,
    ) {
        let (world_sender, mut world_receiver) =
            tokio::sync::mpsc::unbounded_channel::<WsWorldCommand>();
        let cloned_world_sender = world_sender.clone();
        let word_receive_task_join_handle = tokio::spawn(async move {
            let mut world = WsWorld {
                connections: WsConnections::new(),
                data: WsData {
                    users: HashMap::new(),
                    rooms: HashMap::new(),
                    games: HashMap::new(),
                },
                pubsub: WsPubSub::new(),
            };

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
                        room::room_cleanup(&mut world.data, &mut world.pubsub);
                    }
                    _ = game_ticker_timer.tick() => {
                        let _ = cloned_world_sender.send(WsWorldCommand::Game(Game::Tick));
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
            Ws::CreateUser {
                ws_id,
                ws_sender_tx,
            } => {
                ws::create_connection(connections, data, pubsub, ws_id, ws_sender_tx);
            }
            Ws::DeleteUser { ws_id } => {
                ws::delete_connection(connections, data, pubsub, ws_id);
            }
            Ws::GetWsWorldInfo { tx } => {
                let info_str = ws::get_ws_world_info(connections, data, pubsub);
                let _ = tx.send(info_str);
            }
            Ws::LoginInUser {
                ws_id,
                user_id,
                nick_name,
            } => {
                ws::login_user(connections, data, pubsub, ws_id, user_id, nick_name);
            }
            Ws::LoginFailed { ws_id } => ws::login_failed_user(pubsub, ws_id),
            Ws::LogoutUser { ws_id } => {
                ws::logout_user(connections, data, pubsub, ws_id);
            }
        },
        WsWorldCommand::Lobby(cmd) => match cmd {
            Lobby::Enter { ws_id } => {
                lobby::lobby_enter(connections, data, pubsub, &ws_id);
            }
            Lobby::Leave { ws_id } => {
                lobby::lobby_leave(connections, data, pubsub, &ws_id);
            }
            Lobby::Chat { ws_id, msg } => {
                lobby::lobby_chat(&connections, data, pubsub, &ws_id, &msg);
            }
        },
        WsWorldCommand::Room(cmd) => match cmd {
            Room::Create { room_name, ws_id } => {
                room::create(connections, data, pubsub, ws_id, room_name);
            }
            Room::Leave { ws_id, room_id } => {
                room::leave(connections, data, pubsub, ws_id, room_id);
            }
            Room::Enter { ws_id, room_id } => {
                room::enter(connections, data, pubsub, ws_id, room_id);
            }
            Room::Chat {
                ws_id,
                room_id,
                msg,
            } => {
                room::chat(connections, data, pubsub, ws_id, room_id, msg);
            }
            Room::GameReady { ws_id, room_id } => {
                room::room_game_ready(connections, data, pubsub, ws_id, room_id);
            }
            Room::GameUnReady { ws_id, room_id } => {
                room::room_game_unready(connections, data, pubsub, ws_id, room_id);
            }
            Room::GameStart { ws_id, room_id } => {
                room::room_game_start(data, pubsub, ws_id, room_id);
            }
        },
        WsWorldCommand::Game(cmd) => match cmd {
            Game::Tick => game::tick(data, pubsub),
        },
        WsWorldCommand::Pubsub(cmd) => match cmd {
            Pubsub::Subscribe { ws_id, topic } => pubsub.subscribe(&ws_id, &topic),
            Pubsub::UnSubscribe { ws_id, topic } => pubsub.unsubscribe(&ws_id, &topic),
            Pubsub::Publish { topic, msg } => pubsub.publish(&topic, &msg),
        },
    }
}
