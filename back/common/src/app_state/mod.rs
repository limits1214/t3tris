use sqlx::PgPool;
mod init;
use crate::app_state::init::{init_db_pool, init_dead_pool_redis, init_redis_client};

#[derive(Debug)]
pub struct CommonAppState {
    pub redis_pool: deadpool_redis::Pool,
    pub redis_client: redis::Client,
    pub db_pool: PgPool,
}
impl CommonAppState {
    pub async fn new() -> Self {
        let redis_client = init_redis_client();
        let db_pool = init_db_pool().await;
        let redis_pool = init_dead_pool_redis();

        Self {
            redis_pool,
            redis_client,
            db_pool,
        }
    }
}
