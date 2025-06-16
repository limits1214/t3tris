use axum::Router;

use crate::{
    app::state::ArcAppState,
    controller_ws::{test::test_ws_router, ws::ws_router},
};

pub mod test;
pub mod ws;
pub async fn init_controller_ws_router(arc_app_state: ArcAppState) -> Router<ArcAppState> {
    Router::new()
        .merge(test_ws_router(arc_app_state.clone()))
        .merge(ws_router(arc_app_state.clone()))
        .with_state(arc_app_state.clone())
}
