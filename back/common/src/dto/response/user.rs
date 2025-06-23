use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfoResponse {
    pub user_id: String,
    pub nick_name: String,
    pub avatar_url: Option<String>,
    pub email: Option<String>,
    pub provider: String,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}
