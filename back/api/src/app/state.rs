use std::sync::Arc;

use axum::extract::FromRef;
use common::app_state::CommonAppState;
use sqlx::PgPool;

#[derive(Debug, Clone)]
pub struct ApiAppState {
    pub common: CommonAppState,
}
impl ApiAppState {
    pub async fn new() -> Self {
        let common = CommonAppState::new().await;
        Self { common }
    }
}

pub struct ArcApiAppState(pub Arc<ApiAppState>);

impl ArcApiAppState {
    pub async fn new() -> Self {
        Self(Arc::new(ApiAppState::new().await))
    }
}
impl Clone for ArcApiAppState {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}
impl FromRef<ArcApiAppState> for CommonAppState {
    fn from_ref(input: &ArcApiAppState) -> Self {
        input.0.common.clone()
    }
}
impl FromRef<ArcApiAppState> for PgPool {
    fn from_ref(input: &ArcApiAppState) -> Self {
        input.0.common.db_pool.clone()
    }
}

impl FromRef<ArcApiAppState> for bb8::Pool<bb8_redis::RedisConnectionManager> {
    fn from_ref(input: &ArcApiAppState) -> Self {
        input.0.common.redis_pool.clone()
    }
}
impl FromRef<ArcApiAppState> for redis::Client {
    fn from_ref(input: &ArcApiAppState) -> Self {
        input.0.common.redis_client.clone()
    }
}
