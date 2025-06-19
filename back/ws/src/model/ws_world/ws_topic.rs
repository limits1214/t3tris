use crate::ws_world::{Pubsub, WsWorldCommand};
use std::collections::HashMap;

pub struct WsTopic {
    topics: HashMap<String, tokio::task::JoinHandle<()>>,
    sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
}
impl WsTopic {
    pub fn new(
        sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
        ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    ) -> Self {
        Self {
            topics: HashMap::new(),
            sender_tx,
            ws_world_command_tx,
        }
    }

    pub async fn subscribe(&mut self, topic: &str) -> anyhow::Result<()> {
        let (ret_tx, ret_rx) =
            tokio::sync::oneshot::channel::<tokio::sync::broadcast::Receiver<String>>();
        // self.ws_world_command_tx
        //     .send(WsWorldCommand::Pubsub(Pubsub::Subscribe {
        //         topic: topic.to_string(),
        //         tx: ret_tx,
        //     }))?;
        let mut receiver = ret_rx.await?;

        let sender_tx = self.sender_tx.clone();
        self.topics.insert(
            topic.to_string(),
            tokio::spawn(async move {
                loop {
                    match receiver.recv().await {
                        Ok(msg) => {
                            if let Err(err) = sender_tx.send(msg) {
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

        Ok(())
    }

    pub fn unsubscribe(&mut self, topic: &str) {
        if let Some(handle) = self.topics.remove(topic) {
            handle.abort();
        }
    }
    pub fn unsubscribe_all(&mut self) {
        for (_k, v) in &self.topics {
            v.abort();
        }
    }

    pub fn publish(&mut self, topic: &str, msg: &str) -> anyhow::Result<()> {
        self.ws_world_command_tx
            .send(WsWorldCommand::Pubsub(Pubsub::Publish {
                topic: topic.to_string(),
                msg: msg.to_string(),
            }));
        Ok(())
    }
}
