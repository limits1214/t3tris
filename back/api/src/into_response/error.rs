use axum::{response::IntoResponse, Json};
use axum_extra::typed_header::TypedHeaderRejection;
use hyper::StatusCode;
use serde_json::json;

use crate::error::{ApiHandlerError, PageHandlerError};

impl IntoResponse for ApiHandlerError {
    fn into_response(self) -> axum::response::Response {
        const TAG: &str = "[ApiHandlerError]";
        let (stt, value) = match &self {
            Self::Anyhow(anyhow_err) => {
                anyhow_err.chain().enumerate().for_each(|(i, cause)| {
                    tracing::error!(
                        "{TAG} anyhow-{i}, err: {:?}, cause: {:?}",
                        anyhow_err,
                        cause
                    );
                });

                let stt = match anyhow_err.root_cause() {
                    e if e.is::<TypedHeaderRejection>() => StatusCode::BAD_REQUEST,
                    e if e.is::<jsonwebtoken::errors::Error>() => StatusCode::UNAUTHORIZED,
                    _ => StatusCode::INTERNAL_SERVER_ERROR,
                };
                (
                    stt,
                    json!({
                        "msg": anyhow_err.to_string()
                    }),
                )
            }
        };

        (stt, Json(value)).into_response()
    }
}

impl IntoResponse for PageHandlerError {
    fn into_response(self) -> axum::response::Response {
        const TAG: &str = "[PageHandlerError]";
        let (stt, value) = match &self {
            Self::Anyhow(anyhow_err) => {
                anyhow_err.chain().enumerate().for_each(|(i, cause)| {
                    tracing::error!(
                        "{TAG} anyhow-{i}, err: {:?}, cause: {:?}",
                        anyhow_err,
                        cause
                    );
                });

                let stt = match anyhow_err.root_cause() {
                    e if e.is::<TypedHeaderRejection>() => StatusCode::BAD_REQUEST,
                    e if e.is::<jsonwebtoken::errors::Error>() => StatusCode::UNAUTHORIZED,
                    _ => StatusCode::INTERNAL_SERVER_ERROR,
                };
                (
                    stt,
                    json!({
                        "msg": anyhow_err.to_string()
                    }),
                )
            }
            PageHandlerError::Template(err) => {
                tracing::error!("{TAG} template {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    json!({
                        "msg": err.to_string()
                    }),
                )
            }
        };

        (stt, Json(value)).into_response()
    }
}
