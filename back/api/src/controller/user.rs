use axum::{routing::get, Json, Router};
use common::{
    dto::response::{user::UserInfoResponse, ApiResponse},
    entity::user::User,
    error::{AppResult, AuthError},
    extractor::{check_access_token::CheckAccessToken, db::DbConn},
    repository,
};
use sqlx::PgConnection;

use crate::app::state::ArcApiAppState;

pub fn user_router(_state: ArcApiAppState) -> Router<ArcApiAppState> {
    Router::new().route("/api/user/info", get(user_info))
}

pub async fn user_info(
    DbConn(mut conn): DbConn,
    CheckAccessToken(claim): CheckAccessToken,
) -> AppResult<Json<ApiResponse<UserInfoResponse>>> {
    async fn service(conn: &mut PgConnection, user_id: &str) -> AppResult<User> {
        let user = repository::user::select_user_by_id(conn, user_id)
            .await?
            .ok_or(AuthError::UserNotExists)?;
        Ok(user)
    }
    let user = service(&mut conn, &claim.sub).await?;
    let ret = UserInfoResponse {
        nick_name: user.nick_name,
        user_id: user.id,
        avatar_url: user.avatar_url,
        email: user.email,
        provider: user.provider.as_ref().to_owned(),
        created_at: user.created_at,
    };
    Ok(Json(ApiResponse::ok(ret)))
}
