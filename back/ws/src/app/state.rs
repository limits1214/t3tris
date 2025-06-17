use axum::extract::FromRef;
use common::app_state::CommonAppState;
use sqlx::PgPool;
use std::sync::{Arc, atomic::AtomicUsize};
use tokio::sync::watch;

#[derive(Debug, Clone)]
pub struct WsAppState {
    pub common: CommonAppState,
    pub ws_shut_down: WsShutDown,
}
impl WsAppState {
    pub async fn new() -> Self {
        let common = CommonAppState::new().await;
        let ws_shut_down = WsShutDown::new();
        Self {
            common,
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

pub struct ArcWsAppState(pub Arc<WsAppState>);

impl ArcWsAppState {
    pub async fn new() -> Self {
        Self(Arc::new(WsAppState::new().await))
    }
}
impl Clone for ArcWsAppState {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}
impl FromRef<ArcWsAppState> for CommonAppState {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.clone()
    }
}
impl FromRef<ArcWsAppState> for PgPool {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.db_pool.clone()
    }
}
impl FromRef<ArcWsAppState> for WsShutDown {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.ws_shut_down.clone()
    }
}

impl FromRef<ArcWsAppState> for bb8::Pool<bb8_redis::RedisConnectionManager> {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.redis_pool.clone()
    }
}

impl FromRef<ArcWsAppState> for redis::Client {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.redis_client.clone()
    }
}
