use std::collections::HashMap;

use tokio::task::JoinHandle;

use crate::model::ws_world::{WsWorldRoom, WsWorldUser};

pub mod command;

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
    Cleanup,
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
                Pubsub::Subscribe { ws_id, topic } => {
                    pubsub::topic_subscribe(self, &ws_id, &topic);
                }
                Pubsub::UnSubscribe { ws_id, topic } => {
                    pubsub::topic_unsubscribe(self, &ws_id, &topic);
                }
                Pubsub::Publish { topic, msg } => {
                    pubsub::topic_publish(self, &topic, &msg);
                }
                Pubsub::Cleanup => {
                    pubsub::pubsub_cleanup(self);
                }
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

        pubsub::topic_publish(
            world,
            TOPIC_ROOM_LIST_UPDATE,
            &ServerToClientWsMsg::RoomListUpdated { rooms }.to_json(),
        );
    }
}

mod pubsub {
    use crate::ws_world::WsWorld;
    pub fn pubsub_cleanup(world: &mut WsWorld) {
        let mut cleanup_topics = vec![];
        for (topic, s) in world.pubsub.iter() {
            if s.receiver_count() == 0 {
                cleanup_topics.push(topic.clone());
            }
        }
        for topic in cleanup_topics {
            world.pubsub.remove(&topic);
        }
    }

    pub fn topic_subscribe(world: &mut WsWorld, ws_id: &str, topic: &str) {
        let mut broad_receiver = if let Some(broad_sender) = world.pubsub.get(&topic.to_string()) {
            let broad_receiver = broad_sender.subscribe();
            broad_receiver
        } else {
            let (s, _) = tokio::sync::broadcast::channel::<String>(16);
            let broad_receiver = s.subscribe();
            world.pubsub.insert(topic.to_string(), s);
            broad_receiver
        };

        match world.user_topic_handle.get_mut(ws_id) {
            Some(user_topic_handle) => {
                //
                match user_topic_handle.topics.get(topic) {
                    Some(_) => {
                        tracing::info!(
                            "pubsub_subscribe, ws_id: {ws_id}, topic: {topic} is exists, subscrie ignored"
                        );
                    }
                    None => {
                        let ws_sender_tx = user_topic_handle.sender.clone();
                        user_topic_handle.topics.insert(
                            topic.to_string(),
                            tokio::spawn(async move {
                                loop {
                                    match broad_receiver.recv().await {
                                        Ok(msg) => {
                                            if let Err(err) = ws_sender_tx.send(msg) {
                                                tracing::warn!("send err:{err:?}")
                                                // break;
                                            }
                                        }
                                        Err(err) => match err {
                                            tokio::sync::broadcast::error::RecvError::Closed => {
                                                tracing::warn!("err: closed: {err:?}");
                                                break;
                                            }
                                            tokio::sync::broadcast::error::RecvError::Lagged(_) => {
                                                tracing::warn!("err: lagged: {err:?}");
                                            }
                                        },
                                    }
                                }
                            }),
                        );
                    }
                }
            }
            None => {
                tracing::info!(
                    "pubsub_subscribe, user_topic_handle ws_id: {ws_id} is empty, ignored"
                );
            }
        }
    }

    pub fn topic_unsubscribe(world: &mut WsWorld, ws_id: &str, topic: &str) {
        match world.user_topic_handle.get_mut(ws_id) {
            Some(user_topic_handle) => match user_topic_handle.topics.get(topic) {
                Some(handle) => {
                    handle.abort();
                    user_topic_handle.topics.remove(topic);
                }
                None => {
                    tracing::info!(
                        "pubsub_unsubscribe, ws_id: {ws_id}, topic: {topic} is empty, unsubscribe ignored"
                    );
                }
            },
            None => {
                tracing::info!(
                    "pubsub_unsubscribe, user_topic_handle ws_id: {ws_id} is empty, ignored"
                );
            }
        }
    }

    pub fn topic_publish(world: &mut WsWorld, topic: &str, msg: &str) {
        if let Some(broad_sender) = world.pubsub.get(topic) {
            if let Err(err) = broad_sender.send(msg.to_owned()) {
                tracing::warn!("Publish {err:?}");
            }
        } else {
            tracing::warn!("Publish tomic missing topoic:{topic}, msg: {msg:?}");
        }
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

        pubsub::topic_subscribe(world, &user.ws_id, &colon!(TOPIC_WS_ID, user.ws_id));
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
                pubsub::topic_unsubscribe(world, &ws_id, &topic);
            }
        }
        world.user_topic_handle.remove(ws_id);
    }
}
