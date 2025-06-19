use crate::{
    colon,
    constant::TOPIC_WS_ID,
    model::{ws_msg::ServerToClientWsMsg, ws_world::WsRecvCtx},
    ws_world::{Pubsub, Ws, WsWorldCommand},
};

impl WsRecvCtx<'_> {
    pub fn ping(&mut self) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: colon!(TOPIC_WS_ID, self.ws_id),
                msg: ServerToClientWsMsg::Pong.to_json(),
            }));
    }

    pub fn echo(&mut self, msg: &str) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: colon!(TOPIC_WS_ID, self.ws_id),
                msg: ServerToClientWsMsg::Echo {
                    msg: msg.to_owned(),
                }
                .to_json(),
            }));
    }

    pub fn topic_echo(&mut self, topic: &str, msg: &str) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: topic.to_owned(),
                msg: ServerToClientWsMsg::TopicEcho {
                    topic: topic.to_owned(),
                    msg: msg.to_owned(),
                }
                .to_json(),
            }));
    }

    pub fn topic_subscribe(&mut self, topic: &str) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Subscribe {
                ws_id: self.ws_id.to_string(),
                topic: topic.to_string(),
            }));
    }

    pub fn topic_unsubscribe(&mut self, topic: &str) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::UnSubscribe {
                ws_id: self.ws_id.to_string(),
                topic: topic.to_string(),
            }));
    }

    pub fn create_ws_user(&mut self, ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Ws(Ws::CreateUser {
                ws_sender_tx,
                ws_id: self.ws_id.to_string(),
                user_id: self.user_id.to_string(),
                nick_name: self.nick_name.to_string(),
            }));
    }
    pub fn delete_ws_user(&mut self) {
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Ws(Ws::DeleteUser {
                ws_id: self.ws_id.to_string(),
            }));
    }
}
