use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct EmailSignupRequest {
    #[validate(length(min = 2, max = 16))]
    pub nick_name: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8, max = 32))]
    pub pw: String,
    #[validate(url)]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8, max = 32))]
    pub pw: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct GuestLoginRequest {
    #[validate(length(min = 2, max = 16))]
    pub nick_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthCallback {
    pub code: String,
    #[allow(dead_code)]
    pub state: String,
}
