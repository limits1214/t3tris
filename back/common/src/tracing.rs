use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_tracing(service_name: &str) -> WorkerGuard {
    // let unique_id = nanoid::nanoid!(4);
    let unique_id = "";
    let file_appender =
        tracing_appender::rolling::daily("logs", format!("{service_name}#{unique_id}.log"));
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "t3tris_api=debug,t3tris_ws=debug,t3tris_timer=debug,tower_http=debug,axum::rejection=trace,sqlx=debug".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking))
        .init();
    guard
}
