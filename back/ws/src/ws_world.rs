use std::collections::HashMap;

use tokio::task::JoinHandle;

use crate::model::ws_world::{WsWorldRoom, WsWorldUser};

type OneShot<T> = tokio::sync::oneshot::Sender<T>;

pub enum WsWorldCommand {
    Pubsub(Pubsub),
    Room(Room),
    Ws(Ws),
}

pub enum Ws {
    CreateUser {
        // user 정보
        user: WsWorldUser,
        // user 가가지고 있는 ws_sender_tx
        ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    },
    DeleteUser {
        ws_id: String,
    },
    PushUserTopic {
        topic: String,
    },
    PopUserTopic {
        topic: String,
    },
}

pub enum Pubsub {
    Subscribe { ws_id: String, topic: String },
    UnSubscribe { ws_id: String, topic: String },
    Publish { topic: String, msg: String },
    Cleanup,
    PrintInfo,
}

pub enum Room {
    CreateRoom {
        room: WsWorldRoom,
    },
    GetRoom {
        room_id: String,
        tx: OneShot<Option<WsWorldRoom>>,
    },
    GetRoomList {
        tx: OneShot<Vec<WsWorldRoom>>,
    },
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
    user_topic_handle: HashMap<WsId, WsWorldUserTopicHandle>,
    pubsub: HashMap<Topic, tokio::sync::broadcast::Sender<String>>,
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
                        world.pubsub_cleanup();
                    }
                }
            }
        });
        (s, join_handle)
    }

    fn process(&mut self, msg: WsWorldCommand) -> anyhow::Result<()> {
        match msg {
            WsWorldCommand::Ws(ws) => match ws {
                Ws::CreateUser { user, ws_sender_tx } => {
                    tracing::info!("CreateUwer");
                    self.users.push(user.clone());
                    self.user_topic_handle.insert(
                        user.ws_id.clone(),
                        WsWorldUserTopicHandle {
                            sender: ws_sender_tx,
                            topics: HashMap::new(),
                        },
                    );
                }
                Ws::DeleteUser { ws_id } => {
                    tracing::info!("DeleteUser");
                    if let Some(idx) = self.users.iter().position(|u| u.ws_id == ws_id) {
                        self.users.remove(idx);
                    } else {
                        tracing::warn!("User Delete fail, not find idx");
                    };
                    if let Some(user_topic_handle) = self.user_topic_handle.get(&ws_id) {
                        let topics = user_topic_handle.topics.keys().cloned().collect::<Vec<_>>();
                        for topic in topics {
                            self.pubsub_unsubscribe(&ws_id, &topic);
                        }
                    }
                    self.user_topic_handle.remove(&ws_id);
                }
                Ws::PushUserTopic { topic } => {
                    //
                }
                Ws::PopUserTopic { topic } => {
                    //
                }
            },
            WsWorldCommand::Room(room) => match room {
                Room::CreateRoom { room } => {
                    self.rooms.push(room);
                }
                Room::GetRoom { room_id, tx } => {
                    let room = self.rooms.iter().find(|r| r.room_id == room_id).cloned();
                    tx.send(room);
                }
                Room::GetRoomList { tx } => {
                    let room_list = self.rooms.clone();
                    tx.send(room_list);
                }
            },
            WsWorldCommand::Pubsub(pubsub) => match pubsub {
                Pubsub::Subscribe { ws_id, topic } => {
                    self.pubsub_subscribe(&ws_id, &topic);
                }
                Pubsub::UnSubscribe { ws_id, topic } => {
                    self.pubsub_unsubscribe(&ws_id, &topic);
                }
                Pubsub::Publish { topic, msg } => {
                    self.pubsub_publish(&topic, &msg);
                }
                Pubsub::Cleanup => {
                    self.pubsub_cleanup();
                }
                Pubsub::PrintInfo => {
                    self.pubsub_print_info();
                }
            },
        }

        Ok(())
    }

    fn pubsub_cleanup(&mut self) {
        self.pubsub_print_info();

        let mut cleanup_topics = vec![];
        for (topic, s) in self.pubsub.iter() {
            if s.receiver_count() == 0 {
                cleanup_topics.push(topic.clone());
            }
        }
        for topic in cleanup_topics {
            self.pubsub.remove(&topic);
        }
    }

    fn pubsub_print_info(&self) {
        tracing::info!("1-----");
        for (topic, s) in self.pubsub.iter() {
            tracing::info!("topic: {topic:?}, recever_count: {}", s.receiver_count());
        }
        tracing::info!("1-----");
        tracing::info!("2-----");
        for (ws_id, user_topic_handle) in self.user_topic_handle.iter() {
            let keys = user_topic_handle.topics.keys().collect::<Vec<_>>();
            tracing::info!("ws_id: {ws_id}, topics: {:?}", keys);
        }
        // for (topic, _) in self.topics.iter() {
        //     tracing::info!("topic: {topic:?}");
        // }
        tracing::info!("2-----");
    }

    fn pubsub_subscribe(
        &mut self,
        ws_id: &str,
        topic: &str,
        // to_ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    ) {
        let mut broad_receiver = if let Some(broad_sender) = self.pubsub.get(&topic.to_string()) {
            let broad_receiver = broad_sender.subscribe();
            broad_receiver
        } else {
            let (s, _) = tokio::sync::broadcast::channel::<String>(16);
            let broad_receiver = s.subscribe();
            self.pubsub.insert(topic.to_string(), s);
            broad_receiver
        };

        match self.user_topic_handle.get_mut(ws_id) {
            Some(user_topic_handle) => {
                //
                match user_topic_handle.topics.get(topic) {
                    Some(_) => {
                        tracing::info!(
                            "pubsub_subscribe, ws_id: {ws_id}, topic: {topic} is exists, subscrie ignored"
                        );
                    }
                    None => {
                        //
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
                                        Err(err) => {
                                            tracing::warn!("err:{err:?}");
                                            break;
                                        }
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

    fn pubsub_publish(&mut self, topic: &str, msg: &str) {
        if let Some(broad_sender) = self.pubsub.get(topic) {
            if let Err(err) = broad_sender.send(msg.to_owned()) {
                tracing::warn!("Publish {err:?}");
            }
        } else {
            tracing::warn!("Publish tomic missing topoic:{topic}, msg: {msg:?}");
        }
    }

    fn pubsub_unsubscribe(&mut self, ws_id: &str, topic: &str) {
        match self.user_topic_handle.get_mut(ws_id) {
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
}
