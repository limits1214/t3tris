use bb8_redis::RedisConnectionManager;
use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::util;

pub async fn init_redis_pool() -> bb8::Pool<RedisConnectionManager> {
    let redis_manager = RedisConnectionManager::new(format!(
        "{}",
        util::config::get_config_settings_redis().redis_url
    ))
    .unwrap();
    let redis_pool = bb8::Pool::builder().build(redis_manager).await.unwrap();

    redis_pool
}

pub fn init_redis_client() -> redis::Client {
    let client =
        redis::Client::open(util::config::get_config_settings_redis().redis_url.clone()).unwrap();
    client
}

pub async fn init_db_pool() -> PgPool {
    let settings = util::config::get_config_settings_db();
    //TODO: settings 에서 받아오게
    let dp_pool_max_connections_cnt = 5;
    //TODO: settings 에서 받아오게
    let dp_pool_acquire_timeout_sec = std::time::Duration::from_secs(3);
    let database_url = settings.database_url.clone();
    PgPoolOptions::new()
        .max_connections(dp_pool_max_connections_cnt)
        .acquire_timeout(dp_pool_acquire_timeout_sec)
        .connect(&database_url)
        .await
        .expect("can't connect to database")
}
