use crate::dto::response::ApiResponse;
use crate::error::AppError;
use axum::{Json, response::IntoResponse};

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        // const TAG: &str = "[AppError]";
        let error_format = self.error_format();
        let stt = error_format.status_code();
        (stt, Json(ApiResponse::error(error_format.into()))).into_response()
    }
}
