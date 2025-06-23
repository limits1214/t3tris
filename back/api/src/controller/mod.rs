use axum::Router;

use crate::{
    app::state::ArcApiAppState,
    controller::{auth::auth_router, test::test_router, user::user_router},
};

pub mod auth;
pub mod test;
pub mod user;

pub async fn init_controller_router(arc_app_state: ArcApiAppState) -> Router<ArcApiAppState> {
    Router::new()
        .merge(test_router(arc_app_state.clone()))
        .merge(auth_router(arc_app_state.clone()))
        .merge(user_router(arc_app_state.clone()))
        .with_state(arc_app_state.clone())
}
