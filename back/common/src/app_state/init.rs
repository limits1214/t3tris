use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::util;

pub fn init_redis_client() -> redis::Client {
    let client =
        redis::Client::open(util::config::get_config_settings_redis().redis_url.clone()).unwrap();
    client
}

pub fn init_dead_pool_redis() -> deadpool_redis::Pool {
    let settings = util::config::get_config_settings_redis();
    let config = deadpool_redis::Config::from_url(settings.redis_url.clone());
    let pool = config
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))
        .unwrap();
    pool
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
