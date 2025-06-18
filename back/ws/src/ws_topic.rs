use std::collections::HashMap;

use bb8_redis::{RedisConnectionManager, redis::AsyncCommands};
use futures::StreamExt;
use tokio::sync::mpsc::UnboundedSender;

pub struct WsTopic {
    topics: HashMap<String, tokio::task::JoinHandle<()>>,
    sender_tx: UnboundedSender<String>,
    redis_client: redis::Client,
    redis_pool: bb8::Pool<RedisConnectionManager>,
}

impl WsTopic {
    pub fn new(
        sender_tx: UnboundedSender<String>,
        redis_client: redis::Client,
        redis_pool: bb8::Pool<RedisConnectionManager>,
    ) -> Self {
        Self {
            topics: HashMap::new(),
            sender_tx,
            redis_client,
            redis_pool,
        }
    }

    pub fn subscribe(&mut self, topic: &str) {
        // TODO: len limit
        if self.topics.len() > 10 {
            tracing::warn!("topics limits is over, subscribe ignored");
            return;
        }
        if self.topics.get(topic).is_some() {
            tracing::info!("topic: {topic:?} is exists, ignored");
            return;
        }

        let redis_client_clone = self.redis_client.clone();
        let sender_tx_clone = self.sender_tx.clone();
        let topic_clone = topic.to_string();
        self.topics.insert(
            topic.to_string(),
            tokio::spawn(async move {
                let res = task(&topic_clone, sender_tx_clone, redis_client_clone).await;
                if let Err(err) = res {
                    tracing::warn!("topic subscribe task err: {err:?}");
                }
                async fn task(
                    topic: &str,
                    sender: UnboundedSender<String>,
                    redis_client: redis::Client,
                ) -> anyhow::Result<()> {
                    let mut pubsub_conn = redis_client.get_async_pubsub().await?;
                    pubsub_conn.subscribe(topic).await?;
                    let mut pubsub_on_message = pubsub_conn.on_message();
                    loop {
                        match pubsub_on_message.next().await {
                            Some(msg) => {
                                let payload = msg.get_payload::<String>()?;
                                if let Err(err) = sender.send(payload) {
                                    tracing::warn!("topic sender err: {err:?}");
                                    break;
                                }
                            }
                            None => {
                                break;
                            }
                        }
                    }

                    Ok(())
                }
            }),
        );
    }

    // pub async fn publish(&mut self, topic: &str, message: &str) -> anyhow::Result<()> {
    //     crate::util::redis::publish(&mut self.redis_pool, topic, message).await?;
    //     Ok(())
    // }

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
}
