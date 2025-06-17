use bb8_redis::redis::AsyncCommands;
use common::extractor::redis::RedisPool;
use time::OffsetDateTime;

pub async fn create_ws_conn_user(
    rpool: &mut RedisPool,
    ws_id: &str,
    user_id: &str,
) -> anyhow::Result<()> {
    let mut rconn = rpool.get_owned().await?;
    //create ws_conn
    rconn
        .set::<String, String, ()>(
            format!("ws_conn:ws_id:{ws_id}:user_id"),
            user_id.to_string(),
        )
        .await?;
    rconn
        .set::<String, String, ()>(
            format!("ws_conn:user_id:{user_id}:ws_id"),
            ws_id.to_string(),
        )
        .await?;
    rconn
        .set::<String, String, ()>(
            format!("ws_conn:ws_id:{ws_id}:connected_at"),
            OffsetDateTime::now_utc().to_string(),
        )
        .await?;

    Ok(())
}

pub async fn delete_ws_conn_user(
    rpool: &mut RedisPool,
    ws_id: &str,
    user_id: &str,
) -> anyhow::Result<()> {
    let mut rconn = rpool.get_owned().await?;
    let _ = rconn
        .del::<String, ()>(format!("ws_conn:ws_id:{ws_id}:user_id"))
        .await;
    let _ = rconn
        .del::<String, ()>(format!("ws_conn:user_id:{user_id}:ws_id"))
        .await;
    let _ = rconn
        .del::<String, ()>(format!("ws_conn:ws_id:{ws_id}:connected_at"))
        .await;
    Ok(())
}
