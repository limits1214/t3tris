use nanoid::nanoid;
use redis::{AsyncCommands, RedisResult};

#[allow(dead_code)]
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

#[allow(dead_code)]
pub async fn acquire_lock(
    conn: &mut redis::aio::MultiplexedConnection,
    lock_key: &str,
    ttl: std::time::Duration,
) -> RedisResult<Option<String>> {
    let lock_val = nanoid!();

    // success -> Some("OK")
    // fail -> None
    let res = redis::cmd("SET")
        .arg(lock_key)
        .arg(&lock_val)
        .arg("NX")
        .arg("PX")
        .arg(ttl.as_millis() as usize)
        .query_async::<Option<String>>(conn)
        .await?;

    if res.is_some() {
        Ok(Some(lock_val))
    } else {
        Ok(None)
    }
}

#[allow(dead_code)]
pub async fn release_lock(
    conn: &mut redis::aio::MultiplexedConnection,
    lock_key: &str,
    expected_val: &str,
) -> RedisResult<()> {
    let lua_script = r#"
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
    "#;

    redis::Script::new(lua_script)
        .key(lock_key)
        .arg(expected_val)
        .invoke_async::<()>(conn)
        .await?;

    Ok(())
}

#[tokio::test]
async fn lock() {
    let client = redis::Client::open("redis://@localhost").unwrap();
    let mut conn = client.get_multiplexed_async_connection().await.unwrap();

    let lock = loop {
        let lock = acquire_lock(&mut conn, "lock_key", std::time::Duration::from_secs(3))
            .await
            .unwrap();
        if let Some(lock) = lock {
            break lock;
        } else {
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }
    };

    // do something atomic thing

    release_lock(&mut conn, "lock_key", &lock).await.unwrap();
}
