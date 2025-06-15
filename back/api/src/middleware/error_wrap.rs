use axum::{extract::Request, middleware::Next, response::Response};
#[allow(dead_code)]
pub async fn error_wrap_middleware(request: Request, next: Next) -> Response {
    let uri = request.uri().path();
    let is_api = if uri.starts_with("/api") { true } else { false };
    let response = next.run(request).await;

    if !response.status().is_success() {
        if is_api {
            //
        }
    }

    response
}
