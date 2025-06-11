use askama::Template;
use axum::{response::IntoResponse, routing::get, Json, Router};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use serde_json::json;
use time::Duration;

use crate::{app::state::ArcAppState, into_response::html_template::HtmlTemplate};

pub fn auth_router(_state: ArcAppState) -> Router<ArcAppState> {
    Router::new()
        // .route("/auth", get(auth_page))
        .route("/api/auth/testcookie", get(test_http_only_cookie))
        .route("/api/auth/testcall", get(test_call))
}

#[derive(Template)]
#[template(path = "pages/auth.html")]
pub struct AuthPageTemplate;

pub async fn auth_page() -> impl IntoResponse {
    tracing::info!("auth_page!!");
    HtmlTemplate(AuthPageTemplate)
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
    (Json(json!({"res": a})))
}
