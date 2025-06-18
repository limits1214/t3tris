use bb8_redis::redis::AsyncCommands;
use common::extractor::redis::RedisPool;

pub async fn publish(rpool: &mut RedisPool, topic: &str, message: &str) -> anyhow::Result<()> {
    let mut publish_conn = rpool.get_owned().await?;
    publish_conn
        .publish::<String, String, ()>(topic.to_string(), message.to_string())
        .await?;
    Ok(())
}
