use bb8_redis::RedisConnectionManager;

use crate::util;

pub async fn init_redis_pool() -> bb8::Pool<RedisConnectionManager> {
    let redis_manager =
        RedisConnectionManager::new(format!("{}", util::config::get_config_redis_url())).unwrap();
    let redis_pool = bb8::Pool::builder().build(redis_manager).await.unwrap();

    redis_pool
}

pub fn init_redis_client() -> redis::Client {
    let client = redis::Client::open(util::config::get_config_redis_url()).unwrap();
    client
}
