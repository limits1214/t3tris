use serde::Serialize;
use time::OffsetDateTime;

pub mod auth;
pub mod user;

#[derive(Serialize, Debug)]
pub struct ApiResponse<T> {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ApiError>,
}

#[derive(Serialize, Debug)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: OffsetDateTime,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            ok: true,
            data: Some(data),
            error: None,
        }
    }
}

impl ApiResponse<()> {
    pub fn just_ok() -> Self {
        Self {
            ok: true,
            data: None,
            error: None,
        }
    }
    #[allow(dead_code)]
    pub fn just_nok() -> Self {
        Self {
            ok: false,
            data: None,
            error: None,
        }
    }
    pub fn error(error: ApiError) -> Self {
        Self {
            ok: false,
            data: None,
            error: Some(error),
        }
    }
}
