use redis::AsyncCommands;

pub async fn publish(
    rpool: &mut deadpool_redis::Pool,
    topic: &str,
    message: &str,
) -> anyhow::Result<()> {
    let mut rconn = rpool.get().await?;
    rconn
        .publish::<String, String, ()>(topic.to_string(), message.to_string())
        .await?;
    Ok(())
}
