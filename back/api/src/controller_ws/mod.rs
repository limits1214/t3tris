use axum::Router;

use crate::{
    app::state::ArcAppState,
    controller_ws::{room::room_ws_router, test::test_ws_router},
};

pub mod room;
pub mod test;

pub async fn init_controller_ws_router(arc_app_state: ArcAppState) -> Router<ArcAppState> {
    Router::new()
        .merge(test_ws_router(arc_app_state.clone()))
        .merge(room_ws_router(arc_app_state.clone()))
        .with_state(arc_app_state.clone())
}
