use crate::dto::response::ApiError;
use hyper::StatusCode;
use serde_json::json;
use thiserror::Error;
use time::OffsetDateTime;
use validator::ValidationErrors;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Error, Debug)]
pub enum AppError {
    #[error(transparent)]
    Validation(#[from] ValidationErrors),

    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),

    #[error(transparent)]
    Db(#[from] sqlx::Error),

    #[error(transparent)]
    Auth(#[from] AuthError),
}

impl AppError {
    pub fn error_format(&self) -> ErrorFormat {
        match self {
            Self::Anyhow(error) => {
                error.chain().enumerate().for_each(|(i, cause)| {
                    tracing::error!("Anyhow anyhow-{i}, err: {:?}, cause: {:?}", error, cause);
                });
                ErrorFormat::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "알 수 없는 오류가 발생했습니다.",
                )
            }
            Self::Db(error) => {
                tracing::error!("Db error: {error:?}");
                ErrorFormat::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_error",
                    "데이터베이스 오류가 발생했습니다.",
                )
            }
            Self::Auth(error) => {
                tracing::error!("Auth error: {error:?}");
                let (code, msg) = match error {
                    // AuthError::TokenExpired => ("token_expired", "토큰이 만료되었습니다."),
                    // AuthError::InvalidToken => ("invalid_token", "유효하지 않은 토큰입니다."),
                    AuthError::UserStatusErr => {
                        ("invalid_user_status", "사용자 상태가 올바르지 않습니다.")
                    }
                    _ => ("auth_error", "인증 오류가 발생했습니다."),
                };

                ErrorFormat::new(StatusCode::UNAUTHORIZED, code, msg)
            }
            Self::Validation(error) => {
                tracing::error!("Validation error: {error:?}");
                let data = json!({
                    "len": error.field_errors().len()
                });
                ErrorFormat::new(StatusCode::BAD_REQUEST, "validation_failed", "message")
                    .with_data(data)
            }
        }
    }
}

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    #[error("RefreshTokenNotExists")]
    RefreshTokenNotExists,
    #[error("UserExists")]
    UserExists,
    #[error("UserNotExists")]
    UserNotExists,
    #[error("UserStatusErr")]
    UserStatusErr,
    #[error("PasswordNotExists")]
    PasswordNotExists,
    #[error("UserPasswordNotMatch")]
    UserPasswordNotMatch,
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Auth(AuthError::Jwt(err))
    }
}

#[derive(Debug)]
pub struct ErrorFormat {
    pub status_code: StatusCode,
    pub error_code: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl ErrorFormat {
    pub fn new(status_code: StatusCode, error_code: &str, message: &str) -> Self {
        Self {
            status_code,
            error_code: error_code.to_string(),
            message: message.to_string(),
            data: None,
        }
    }
    pub fn with_data(&self, data: serde_json::Value) -> Self {
        Self {
            status_code: self.status_code,
            error_code: self.error_code.clone(),
            message: self.error_code.clone(),
            data: Some(data),
        }
    }
    pub fn status_code(&self) -> StatusCode {
        self.status_code.clone()
    }
}

impl From<ErrorFormat> for ApiError {
    fn from(value: ErrorFormat) -> Self {
        Self {
            code: value.error_code,
            message: value.message,
            timestamp: OffsetDateTime::now_utc(),
            data: value.data,
        }
    }
}
