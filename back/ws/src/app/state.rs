use axum::extract::FromRef;
use common::app_state::CommonAppState;
use sqlx::PgPool;
use std::sync::{Arc, atomic::AtomicUsize};
use tokio::sync::watch;

use crate::ws_world::WsWorldCommand;

#[derive(Debug)]
pub struct WsAppState {
    pub common: CommonAppState,
    pub ws_shut_down: WsShutDown,
    pub ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
}
impl WsAppState {
    pub async fn new(
        ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    ) -> Self {
        let common = CommonAppState::new().await;
        let ws_shut_down = WsShutDown::new();

        Self {
            common,
            ws_shut_down,
            ws_world_command_tx,
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
    pub async fn new(
        ws_world_command_tx: tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    ) -> Self {
        Self(Arc::new(WsAppState::new(ws_world_command_tx).await))
    }
}
impl Clone for ArcWsAppState {
    fn clone(&self) -> Self {
        Self(self.0.clone())
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
impl FromRef<ArcWsAppState> for deadpool_redis::Pool {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.redis_pool.clone()
    }
}

impl FromRef<ArcWsAppState> for redis::Client {
    fn from_ref(input: &ArcWsAppState) -> Self {
        input.0.common.redis_client.clone()
    }
}
