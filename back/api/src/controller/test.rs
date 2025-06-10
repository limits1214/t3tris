use axum::{response::IntoResponse, routing::get, Json, Router};
use serde_json::json;

use crate::app::state::ArcAppState;

pub fn test_router(_state: ArcAppState) -> Router<ArcAppState> {
    Router::new().route("/api/test/greet", get(greet))
}
pub async fn greet() -> impl IntoResponse {
    tracing::info!("greet!!");
    Json(json!({
        "msg": "greet! z"
    }))
}
