use anyhow::anyhow;
use axum::{
    extract::Path,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};

use crate::app::state::ArcApiAppState;
use common::{
    entity::user::{Provider, UserRole, UserStatus},
    error::AppError,
    extractor::{check_access_token::CheckAccessToken, db::DbConn},
    repository::{self, user::InsertUserArg},
};
use nanoid::nanoid;
use serde_json::json;
use time::Duration;

pub fn test_router(_state: ArcApiAppState) -> Router<ArcApiAppState> {
    Router::new()
        .route("/api/test/greet", get(greet))
        .route("/api/auth/testcookie", get(test_http_only_cookie))
        .route("/api/auth/testcall", get(test_call))
        .route("/api/test/checkaccesstoken", get(check_access_token))
        .route(
            "/api/test/optioncheckaccesstoken",
            get(option_check_access_token),
        )
        .route("/api/test/user/{userId}", get(get_user))
        .route("/api/test/user", post(insert_user))
        .route("/api/test/error", get(test_error))
}

pub async fn greet() -> impl IntoResponse {
    tracing::info!("greet!!");
    Json(json!({
        "msg": "greet! z"
    }))
}

pub async fn test_http_only_cookie(jar: CookieJar) -> impl IntoResponse {
    let cookie = Cookie::build(("TEST", "AABBCC"))
        .path("/")
        .http_only(true)
        .max_age(Duration::seconds(60));
    let jar = jar.add(cookie);
    (jar, Json(json!({"test": "test"})))
}

pub async fn test_call(jar: CookieJar) -> impl IntoResponse {
    let c = jar.get("TEST");
    let a = if let Some(cc) = c {
        format!("yes {}", cc.value())
    } else {
        format!("no")
    };
    tracing::info!("res: {}", a);
    Json(json!({"res": a}))
}

pub async fn check_access_token(CheckAccessToken(claim): CheckAccessToken) -> impl IntoResponse {
    tracing::info!("check_access_token claim: {claim:?}");
    Json(json!({
        "msg": "ok"
    }))
}

pub async fn option_check_access_token(claim: Option<CheckAccessToken>) -> impl IntoResponse {
    tracing::info!("option_check_access_token claim: {claim:?}");
    Json(json!({
        "msg": "ok"
    }))
}

pub async fn get_user(
    Path(user_id): Path<String>,
    DbConn(mut conn): DbConn,
) -> Result<impl IntoResponse, AppError> {
    let user = repository::user::select_user_by_id(&mut conn, &user_id).await?;
    tracing::info!("user: {user:?}");
    Ok(())
}

pub async fn insert_user(DbConn(mut conn): DbConn) -> Result<impl IntoResponse, AppError> {
    tracing::info!("test insert");
    let res = repository::user::insert_user(
        &mut conn,
        InsertUserArg {
            id: &nanoid!(),
            nick_name: "nick_name",
            avatar_url: None,
            email: None,
            password: None,
            user_stt: &UserStatus::Guest,
            user_role: &UserRole::User,
            provider: &Provider::Guest,
            provider_user_id: None,
        },
    )
    .await?;

    tracing::info!("res: {res:?}");
    Ok(())
}

pub async fn test_error() -> Result<impl IntoResponse, AppError> {
    async fn service() -> anyhow::Result<()> {
        Err(anyhow!("TestError"))?
        // Err(TestError::Test)?
    }
    service().await?;
    Err(anyhow!("TestError"))?;
    Ok(())
}
