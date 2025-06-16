use std::sync::{atomic::AtomicUsize, Arc};

use axum::extract::FromRef;
use bb8_redis::RedisConnectionManager;
use sqlx::PgPool;
use tokio::sync::watch;

use crate::app::{
    db::init_db_pool,
    redis::{init_redis_client, init_redis_pool},
};

#[derive(Debug, Clone)]
pub struct AppState {
    pub redis_pool: bb8::Pool<RedisConnectionManager>,
    pub redis_client: redis::Client,
    pub db_pool: PgPool,
    pub ws_shut_down: WsShutDown,
}
impl AppState {
    pub async fn new() -> Self {
        let redis_pool = init_redis_pool().await;
        let redis_client = init_redis_client();
        let db_pool = init_db_pool().await;
        let ws_shut_down = WsShutDown::new();
        Self {
            redis_pool,
            redis_client,
            db_pool,
            ws_shut_down,
        }
    }
}

#[derive(Debug, Clone)]
pub struct WsShutDown {
    /// 현재 연결 중인 WebSocket 클라이언트 수
    pub connection_count: Arc<AtomicUsize>,

    /// graceful shutdown 시그널 (tx는 루트에서만 보유)
    pub shutdown_tx: watch::Sender<()>,

    /// 클론 가능한 shutdown 수신 채널
    pub shutdown_rx: watch::Receiver<()>,
}
impl WsShutDown {
    pub fn new() -> Self {
        let (shutdown_tx, shutdown_rx) = watch::channel(());
        Self {
            connection_count: Arc::new(AtomicUsize::new(0)),
            shutdown_tx,
            shutdown_rx,
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
impl FromRef<ArcAppState> for WsShutDown {
    fn from_ref(input: &ArcAppState) -> Self {
        input.0.ws_shut_down.clone()
    }
}
