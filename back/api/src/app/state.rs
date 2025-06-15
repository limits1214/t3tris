use std::sync::Arc;

use axum::extract::FromRef;
use bb8_redis::RedisConnectionManager;
use sqlx::PgPool;

use crate::app::{
    db::init_db_pool,
    redis::{init_redis_client, init_redis_pool},
};

#[derive(Debug, Clone)]
pub struct AppState {
    pub redis_pool: bb8::Pool<RedisConnectionManager>,
    pub redis_client: redis::Client,
    pub db_pool: PgPool,
}
impl AppState {
    pub async fn new() -> Self {
        let redis_pool = init_redis_pool().await;
        let redis_client = init_redis_client();
        let db_pool = init_db_pool().await;
        Self {
            redis_pool,
            redis_client,
            db_pool,
        }
    }
}

pub struct ArcAppState(pub Arc<AppState>);
impl ArcAppState {
    pub async fn new() -> Self {
        Self(Arc::new(AppState::new().await))
    }
}
impl Clone for ArcAppState {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}
impl FromRef<ArcAppState> for bb8::Pool<bb8_redis::RedisConnectionManager> {
    fn from_ref(input: &ArcAppState) -> Self {
        input.0.redis_pool.clone()
    }
}
impl FromRef<ArcAppState> for redis::Client {
    fn from_ref(input: &ArcAppState) -> Self {
        input.0.redis_client.clone()
    }
}
impl FromRef<ArcAppState> for PgPool {
    fn from_ref(input: &ArcAppState) -> Self {
        input.0.db_pool.clone()
    }
}
