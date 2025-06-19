use crate::{
    colon,
    constant::TOPIC_WS_ID,
    model::{
        ws_msg::ServerToClientWsMsg,
        ws_world::{WsRecvCtx, WsWorldUser},
    },
    ws_world::{Pubsub, Ws, WsWorldCommand},
};

impl WsRecvCtx<'_> {
    pub fn ping(&mut self) -> anyhow::Result<()> {
        let server_msg = ServerToClientWsMsg::Pong;
        let server_msg_str = serde_json::to_string(&server_msg)?;
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: colon!(TOPIC_WS_ID, self.ws_id),
                msg: server_msg_str,
            }));

        // self.ws_topic
        //     .publish(&colon!(TOPIC_WS_ID, self.ws_id), &server_msg_str)?;
        Ok(())
    }

    pub fn echo(&mut self, msg: &str) -> anyhow::Result<()> {
        let server_msg = ServerToClientWsMsg::Echo {
            msg: msg.to_owned(),
        };
        let server_msg_str = serde_json::to_string(&server_msg)?;
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: colon!(TOPIC_WS_ID, self.ws_id),
                msg: server_msg_str,
            }));
        // self.ws_topic
        //     .publish(&colon!(TOPIC_WS_ID, self.ws_id), &server_msg_str)?;
        Ok(())
    }

    pub fn topic_echo(&mut self, topic: &str, msg: &str) -> anyhow::Result<()> {
        let server_msg = ServerToClientWsMsg::TopicEcho {
            topic: topic.to_owned(),
            msg: msg.to_owned(),
        };
        let server_msg_str = serde_json::to_string(&server_msg)?;
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: topic.to_string(),
                msg: server_msg_str,
            }));
        // self.ws_topic.publish(&topic, &server_msg_str)?;
        Ok(())
    }

    pub async fn topic_subscribe(&mut self, topic: &str) -> anyhow::Result<()> {
        // self.ws_topic.subscribe(topic).await?;
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Subscribe {
                ws_id: self.ws_id.to_string(),
                topic: topic.to_string(),
            }));
        Ok(())
    }

    pub fn topic_unsubscribe(&mut self, topic: &str) {
        // self.ws_topic.unsubscribe(topic);
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::UnSubscribe {
                ws_id: self.ws_id.to_string(),
                topic: topic.to_string(),
            }));
    }

    pub fn create_ws_user(&mut self) -> anyhow::Result<()> {
        let user = WsWorldUser {
            user_id: self.user_id.to_string(),
            ws_id: self.ws_id.to_string(),
            nick_name: self.nick_name.to_string(),
            // topics: vec![colon!(TOPIC_WS_ID, self.ws_id)],
        };

        // self.ws_world_command_tx
        //     .send(crate::ws_world::WsWorldCommand::Ws(Ws::CreateUser {
        //         user: user,
        //     }))?;
        Ok(())
    }
    pub fn delete_ws_user(&mut self) -> anyhow::Result<()> {
        self.ws_world_command_tx
            .send(crate::ws_world::WsWorldCommand::Ws(Ws::DeleteUser {
                ws_id: self.ws_id.to_string(),
            }))?;
        Ok(())
    }
}
