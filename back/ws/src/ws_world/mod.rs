use std::collections::HashMap;

use tokio::task::JoinHandle;

use crate::model::ws_world::{WsWorldRoom, WsWorldUser};

pub mod command;
mod pubsub;

type OneShot<T> = tokio::sync::oneshot::Sender<T>;

pub enum WsWorldCommand {
    Pubsub(Pubsub),
    Room(Room),
    Ws(Ws),
}

pub enum Ws {
    GetWsWorldInfo {
        tx: OneShot<serde_json::Value>,
    },
    CreateUser {
        // user 정보
        ws_id: String,
        user_id: String,
        nick_name: String,
        // user 가가지고 있는 ws_sender_tx
        ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    },
    DeleteUser {
        ws_id: String,
    },
}

pub enum Pubsub {
    Subscribe { ws_id: String, topic: String },
    UnSubscribe { ws_id: String, topic: String },
    Publish { topic: String, msg: String },
}

// TODO: Kick, Ban, Invite,
pub enum Room {
    Create { room: WsWorldRoom },
    // 마지막 인원은 방 제거
    Leave {},
    Enter {},
    Chat {},
}

pub struct WsWorldUserTopicHandle {
    sender: tokio::sync::mpsc::UnboundedSender<String>,
    topics: HashMap<Topic, tokio::task::JoinHandle<()>>,
}

type WsId = String;
type Topic = String;

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
                Room::Create { room } => {
                    self.rooms.push(room);
                }
                Room::Leave {} => todo!(),
                Room::Enter {} => todo!(),
                Room::Chat {} => todo!(),
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

impl WsWorld {}

mod room {
    use crate::{
        constant::TOPIC_ROOM_LIST_UPDATE,
        model::ws_msg::ServerToClientWsMsg,
        ws_world::{WsWorld, pubsub},
    };

    fn create(world: &mut WsWorld) {
        let rooms = world.rooms.clone();

        pubsub::publish(
            world,
            TOPIC_ROOM_LIST_UPDATE,
            &ServerToClientWsMsg::RoomListUpdated { rooms }.to_json(),
        );
    }
}

mod ws {
    use std::collections::HashMap;

    use crate::{
        colon,
        constant::TOPIC_WS_ID,
        model::ws_world::WsWorldUser,
        ws_world::{WsWorld, WsWorldUserTopicHandle, pubsub},
    };

    pub fn get_ws_world_info(world: &mut WsWorld) -> serde_json::Value {
        let pubsub_info = world
            .pubsub
            .iter()
            .map(|(topic, sender)| (topic, sender.receiver_count()))
            .collect::<Vec<_>>();

        let user_topic = world
            .user_topic_handle
            .iter()
            .map(|(ws_id, h)| (ws_id, h.topics.keys().collect::<Vec<_>>()))
            .collect::<Vec<_>>();
        let j = serde_json::json!({
            "users" : world.users.clone(),
            "rooms" : world.rooms.clone(),
            "pubsub": pubsub_info,
            "user_topic": user_topic
        });
        j
    }

    pub fn create_user(
        world: &mut WsWorld,
        user: WsWorldUser,
        ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    ) {
        world.users.push(user.clone());
        world.user_topic_handle.insert(
            user.ws_id.clone(),
            WsWorldUserTopicHandle {
                sender: ws_sender_tx,
                topics: HashMap::new(),
            },
        );

        pubsub::subscribe(world, &user.ws_id, &colon!(TOPIC_WS_ID, user.ws_id));
    }

    pub fn delete_user(world: &mut WsWorld, ws_id: &str) {
        if let Some(idx) = world.users.iter().position(|u| u.ws_id == ws_id) {
            world.users.remove(idx);
        } else {
            tracing::warn!("User Delete fail, not find idx");
        };

        // 중요!, 핸들 지우기
        if let Some(user_topic_handle) = world.user_topic_handle.get(ws_id) {
            let topics = user_topic_handle.topics.keys().cloned().collect::<Vec<_>>();
            for topic in topics {
                pubsub::unsubscribe(world, &ws_id, &topic);
            }
        }
        world.user_topic_handle.remove(ws_id);
    }
}
