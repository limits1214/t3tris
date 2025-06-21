use std::collections::HashMap;

use tokio::task::JoinHandle;

use crate::ws_world::{
    command::{Game, Pubsub, Room, Ws, WsWorldCommand},
    model::{WsData, WsWorldUser},
    pubsub::WsPubSub,
};

pub mod command;
mod game;
pub mod model;
mod pubsub;
mod room;
mod util;
mod ws;

#[derive(Debug)]
pub struct WsWorld {
    data: WsData,
    pubsub: WsPubSub,
}

impl WsWorld {
    pub fn init() -> (
        tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
        JoinHandle<()>,
    ) {
        let (s, mut r) = tokio::sync::mpsc::unbounded_channel::<WsWorldCommand>();
        let cloned_s = s.clone();
        let join_handle = tokio::spawn(async move {
            let mut cleanup_timer = tokio::time::interval(std::time::Duration::from_secs(10));
            let mut world = WsWorld {
                data: WsData {
                    users: vec![],
                    rooms: vec![],
                    games: vec![],
                },
                pubsub: WsPubSub {
                    pubsub: HashMap::new(),
                    user_topic_handle: HashMap::new(),
                },
            };
            let mut game_ticker_timer =
                tokio::time::interval(std::time::Duration::from_millis(1000 / 60));

            loop {
                tokio::select! {
                    msg = r.recv() => {
                        if let Some(msg) = msg {
                            if let Err(err) =  process(&mut world.data, &mut world.pubsub, msg) {
                                tracing::warn!("WsWorld process err: {err:?}");
                            }
                        } else {
                            tracing::warn!("WsWorld received None msg, break!");
                            break;
                        }
                    }
                    _ = cleanup_timer.tick() => {
                        world.pubsub.pubsub_cleanup();
                    }
                    _ = game_ticker_timer.tick() => {
                        let _ = cloned_s.send(WsWorldCommand::Game(Game::Tick));
                    }
                }
            }
        });
        (s, join_handle)
    }
}
fn process(data: &mut WsData, pubsub: &mut WsPubSub, msg: WsWorldCommand) -> anyhow::Result<()> {
    match msg {
        WsWorldCommand::Ws(cmd) => match cmd {
            Ws::CreateUser {
                ws_id,
                user_id,
                nick_name,
                ws_sender_tx,
            } => {
                let user = WsWorldUser {
                    user_id,
                    ws_id,
                    nick_name,
                };
                ws::create_user(data, pubsub, user, ws_sender_tx);
            }
            Ws::DeleteUser { ws_id } => {
                ws::delete_user(data, pubsub, &ws_id);
            }
            Ws::GetWsWorldInfo { tx } => {
                let info_str = ws::get_ws_world_info(data, pubsub);
                let _ = tx.send(info_str);
            }
        },
        WsWorldCommand::Room(cmd) => match cmd {
            Room::Create { room_name, ws_id } => {
                room::create(data, pubsub, ws_id, room_name);
            }
            Room::Leave { ws_id, room_id } => {
                room::leave(data, pubsub, ws_id, room_id);
            }
            Room::Enter { ws_id, room_id } => {
                room::enter(data, pubsub, ws_id, room_id);
            }
            Room::Chat {
                ws_id,
                room_id,
                msg,
            } => {
                room::chat(data, pubsub, ws_id, room_id, msg);
            }
            Room::RoomListSubscribe { ws_id } => {
                room::room_list_subscribe(data, pubsub, ws_id);
            }
            Room::RoomListUnSubscribe { ws_id } => {
                room::room_list_unsubscribe(pubsub, ws_id);
            }
            Room::GameReady { ws_id, room_id } => {
                room::room_game_ready(data, pubsub, ws_id, room_id);
            }
            Room::GameUnReady { ws_id, room_id } => {
                room::room_game_unready(data, pubsub, ws_id, room_id);
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

    Ok(())
}
