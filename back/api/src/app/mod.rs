use crate::{
    app::state::ArcAppState, controller::init_controller_router,
    controller_ws::init_controller_ws_router,
};
use axum::Router;
use hyper::{header, Method};
use listenfd::ListenFd;
use tower_http::{
    compression::CompressionLayer, cors::CorsLayer, limit::RequestBodyLimitLayer, trace::TraceLayer,
};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod config;
pub mod db;
pub mod jwt;
pub mod redis;
pub mod state;

pub async fn app_start() {
    crate::util::config::config_init();

    let _guard = init_tracing();
    init_axum().await;
}

fn init_tracing() -> WorkerGuard {
    // let unique_id = nanoid::nanoid!(4);
    let unique_id = "";
    let file_appender =
        tracing_appender::rolling::daily("logs", format!("back-api#{unique_id}.log"));
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "t2ris_api=debug,tower_http=debug,axum::rejection=trace,sqlx=debug".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking))
        .init();
    guard
}

async fn init_axum() {
    let arc_app_state = ArcAppState::new().await;
    let router_controller = init_controller_router(arc_app_state.clone()).await;
    let router_controller_ws = init_controller_ws_router(arc_app_state.clone()).await;

    let router = Router::new()
        .merge(router_controller)
        .merge(router_controller_ws)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        .layer(CompressionLayer::new())
        // .layer(middleware::from_fn(error_wrap_middleware))
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

    let listener = init_listenfd(4000).await;
    axum::serve(listener, router)
        .with_graceful_shutdown(init_shutdown_signal(arc_app_state))
        .await
        .unwrap();
}

async fn init_listenfd(server_port: u32) -> tokio::net::TcpListener {
    // reload
    // https://github.com/tokio-rs/axum/tree/main/examples/auto-reload
    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0).unwrap() {
        Some(listener) => {
            listener.set_nonblocking(true).unwrap();
            tracing::info!("reload bind_ip: {:?}", listener.local_addr());
            tokio::net::TcpListener::from_std(listener).unwrap()
        }
        None => {
            let bind_ip = format!("0.0.0.0:{}", server_port);
            tracing::info!("bind_ip: {}", bind_ip);
            tokio::net::TcpListener::bind(bind_ip).await.unwrap()
        }
    };
    listener
}

/// 그레이스풀 셧다운
/// https://github.com/tokio-rs/axum/blob/main/examples/graceful-shutdown/src/main.rs
async fn init_shutdown_signal(arc_app_state: ArcAppState) {
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
        },
        _ = terminate => {
            tracing::info!("shoutdown terminate");
        },
    }
}
