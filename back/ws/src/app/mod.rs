use std::sync::atomic::Ordering;

use axum::Router;
use hyper::{Method, header};
use tower_http::{
    compression::CompressionLayer, cors::CorsLayer, limit::RequestBodyLimitLayer, trace::TraceLayer,
};

use crate::{app::state::ArcWsAppState, controller::init_controller_ws_router, ws_world::WsWorld};

pub mod state;

pub async fn app_start() {
    common::util::config::config_init();

    let _guard = common::tracing::init_tracing("back_ws");

    init_axum().await;
}

async fn init_axum() {
    let (ws_world_command_tx, ws_wolrd_handle) = WsWorld::init();
    let arc_app_state = ArcWsAppState::new(ws_world_command_tx).await;
    let router_controller = init_controller_ws_router(arc_app_state.clone()).await;

    let router = Router::new()
        .merge(router_controller)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "http://localhost:5173".parse().unwrap(),
                    "http://192.168.25.28:5173".parse().unwrap(),
                    "http://localhost:4173".parse().unwrap(),
                ])
                .allow_credentials(true)
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::OPTIONS,
                    Method::PUT,
                    Method::DELETE,
                    Method::PATCH,
                ])
                .allow_headers([
                    header::ORIGIN,
                    header::CONTENT_TYPE,
                    header::AUTHORIZATION,
                    header::ACCEPT,
                ]),
        )
        .with_state(arc_app_state.clone());

    let listener = init_listener(4001).await;
    axum::serve(listener, router)
        .with_graceful_shutdown(init_shutdown_signal(arc_app_state))
        .await
        .unwrap();
    ws_wolrd_handle.abort();
}

async fn init_listener(server_port: u32) -> tokio::net::TcpListener {
    let bind_ip = format!("0.0.0.0:{}", server_port);
    tracing::info!("bind_ip: {}", bind_ip);
    tokio::net::TcpListener::bind(bind_ip).await.unwrap()
}

/// 그레이스풀 셧다운
/// https://github.com/tokio-rs/axum/blob/main/examples/graceful-shutdown/src/main.rs
async fn init_shutdown_signal(arc_app_state: ArcWsAppState) {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };
    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("shoutdown ctrl_c");
            let _ = arc_app_state.0.ws_shut_down.shutdown_tx.send(());
            // graceful shutdown
            wait_for_all_connections(&arc_app_state.0.ws_shut_down.connection_count).await;
        },
        _ = terminate => {
            tracing::info!("shoutdown terminate");
            let _ = arc_app_state.0.ws_shut_down.shutdown_tx.send(());
            // graceful shutdown
            wait_for_all_connections(&arc_app_state.0.ws_shut_down.connection_count).await;
        },
    }
}

async fn wait_for_all_connections(connection_count: &std::sync::atomic::AtomicUsize) {
    loop {
        let current = connection_count.load(Ordering::SeqCst);
        tracing::info!(
            "Waiting for ws connections to close... currently: {}",
            current
        );

        if current == 0 {
            break;
        }

        tokio::time::sleep(core::time::Duration::from_millis(100)).await;
    }

    tracing::info!("All WebSocket connections closed.");
}
