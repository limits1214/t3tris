use axum::Router;

use crate::{
    app::state::ArcAppState,
    controller::{auth::auth_router, test::test_router},
};

pub mod auth;
pub mod test;

pub async fn init_controller_router(arc_app_state: ArcAppState) -> Router<ArcAppState> {
    Router::new()
        .merge(test_router(arc_app_state.clone()))
        .merge(auth_router(arc_app_state.clone()))
        .with_state(arc_app_state.clone())
}
