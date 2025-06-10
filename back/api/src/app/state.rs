use std::sync::Arc;

use axum::extract::FromRef;
use bb8_redis::RedisConnectionManager;

use crate::{
    app::redis::{init_redis_client, init_redis_pool},
    util,
};

#[derive(Debug, Clone)]
pub struct AppState {
    pub dynamo_client: aws_sdk_dynamodb::Client,
    pub redis_pool: bb8::Pool<RedisConnectionManager>,
    pub redis_client: redis::Client,
}
impl AppState {
    pub async fn new() -> Self {
        let dynamo_client = make_dynamo_client().await;
        let redis_pool = init_redis_pool().await;
        let redis_client = init_redis_client();
        Self {
            dynamo_client,
            redis_pool,
            redis_client,
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

async fn make_dynamo_client() -> aws_sdk_dynamodb::Client {
    let shared_config = util::config::get_aws_config();
    aws_sdk_dynamodb::Client::new(shared_config)
}
