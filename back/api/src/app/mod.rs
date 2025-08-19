use crate::{
    app::state::ArcApiAppState,
    controller::init_controller_router,
    // controller_ws::init_controller_ws_router,
};
use axum::Router;
use hyper::{header, Method};
use tower_http::{
    compression::CompressionLayer, cors::CorsLayer, limit::RequestBodyLimitLayer, trace::TraceLayer,
};

pub mod config;
pub mod state;

pub async fn app_start() {
    common::util::config::config_init();
    crate::util::config::config_init();

    let _guard = common::tracing::init_tracing("back_api");

    init_axum().await;
}

async fn init_axum() {
    let arc_app_state = ArcApiAppState::new().await;
    let router_controller = init_controller_router(arc_app_state.clone()).await;
    // let router_controller_ws = init_controller_ws_router(arc_app_state.clone()).await;

    let router = Router::new()
        .merge(router_controller)
        // .merge(router_controller_ws)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        .layer(CompressionLayer::new())
        // .layer(middleware::from_fn(error_wrap_middleware))
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "http://localhost:5173".parse().unwrap(),
                    "http://192.168.25.26:5173".parse().unwrap(),
                    "http://192.168.25.28:5173".parse().unwrap(),
                    "http://localhost:4173".parse().unwrap(),
                    "https://limits1214.github.io".parse().unwrap(),
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

    let listener = init_listener(4000).await;
    axum::serve(listener, router)
        .with_graceful_shutdown(init_shutdown_signal(arc_app_state))
        .await
        .unwrap();
}

async fn init_listener(server_port: u32) -> tokio::net::TcpListener {
    let bind_ip = format!("0.0.0.0:{}", server_port);
    tracing::info!("bind_ip: {}", bind_ip);
    tokio::net::TcpListener::bind(bind_ip).await.unwrap()
}

/// 그레이스풀 셧다운
/// https://github.com/tokio-rs/axum/blob/main/examples/graceful-shutdown/src/main.rs
async fn init_shutdown_signal(_arc_app_state: ArcApiAppState) {
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
        },
        _ = terminate => {
            tracing::info!("shoutdown terminate");
        },
    }
}
