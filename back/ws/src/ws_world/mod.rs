use std::collections::HashMap;

use tokio::task::JoinHandle;

use crate::ws_world::{
    command::{Pubsub, Room, Ws, WsWorldCommand},
    model::{WsWorldRoom, WsWorldUser},
};

pub mod command;
pub mod model;
mod pubsub;
mod room;
mod util;
mod ws;

type OneShot<T> = tokio::sync::oneshot::Sender<T>;

#[derive(Debug)]
pub struct WsWorldUserTopicHandle {
    sender: tokio::sync::mpsc::UnboundedSender<String>,
    topics: HashMap<Topic, tokio::task::JoinHandle<()>>,
}

type WsId = String;
type Topic = String;

#[derive(Debug)]
pub struct WsWorld {
    users: Vec<WsWorldUser>,
    rooms: Vec<WsWorldRoom>,
    // topic broadcast 채널
    pubsub: HashMap<Topic, tokio::sync::broadcast::Sender<String>>,
    // topic broadcast 채널을 각 유저 ws sender와 연결시켜놓은 태스크 핸들
    user_topic_handle: HashMap<WsId, WsWorldUserTopicHandle>,
}

impl WsWorld {
    pub fn init() -> (
        tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
        JoinHandle<()>,
    ) {
        let (s, mut r) = tokio::sync::mpsc::unbounded_channel::<WsWorldCommand>();
        let join_handle = tokio::spawn(async move {
            let mut cleanup_timer = tokio::time::interval(std::time::Duration::from_secs(10));
            let mut world = WsWorld {
                users: vec![],
                rooms: vec![],
                pubsub: HashMap::new(),
                user_topic_handle: HashMap::new(),
            };
            loop {
                tokio::select! {
                    msg = r.recv() => {
                        if let Some(msg) = msg {
                            if let Err(err) = world.process(msg) {
                                tracing::warn!("WsWorld process err: {err:?}");
                            }
                        } else {
                            tracing::warn!("WsWorld received None msg, break!");
                            break;
                        }
                    }
                    _ = cleanup_timer.tick() => {
                        pubsub::pubsub_cleanup(&mut world);
                    }
                }
            }
        });
        (s, join_handle)
    }

    fn process(&mut self, msg: WsWorldCommand) -> anyhow::Result<()> {
        match msg {
            WsWorldCommand::Ws(ws) => match ws {
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
                    ws::create_user(self, user, ws_sender_tx);
                }
                Ws::DeleteUser { ws_id } => {
                    ws::delete_user(self, &ws_id);
                }
                Ws::GetWsWorldInfo { tx } => {
                    let info_str = ws::get_ws_world_info(self);
                    let _ = tx.send(info_str);
                }
            },
            WsWorldCommand::Room(room) => match room {
                Room::Create { room_name, ws_id } => {
                    room::create(self, ws_id, room_name);
                }
                Room::Leave { ws_id, room_id } => {
                    room::leave(self, ws_id, room_id);
                }
                Room::Enter { ws_id, room_id } => {
                    room::enter(self, ws_id, room_id);
                }
                Room::Chat {
                    ws_id,
                    room_id,
                    msg,
                } => {
                    room::chat(self, ws_id, room_id, msg);
                }
                Room::RoomListSubscribe { ws_id } => {
                    room::room_list_subscribe(self, ws_id);
                }
                Room::RoomListUnSubscribe { ws_id } => {
                    room::room_list_unsubscribe(self, ws_id);
                }
            },
            WsWorldCommand::Pubsub(pubsub) => match pubsub {
                Pubsub::Subscribe { ws_id, topic } => pubsub::subscribe(self, &ws_id, &topic),
                Pubsub::UnSubscribe { ws_id, topic } => pubsub::unsubscribe(self, &ws_id, &topic),
                Pubsub::Publish { topic, msg } => pubsub::publish(self, &topic, &msg),
            },
        }

        Ok(())
    }
}
