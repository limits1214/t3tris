use sqlx::FromRow;
use time::OffsetDateTime;
#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub expires_at: OffsetDateTime,
    pub created_at: OffsetDateTime,
    pub created_by: Option<String>,
    pub updated_at: OffsetDateTime,
    pub updated_by: Option<String>,
    pub is_deleted: bool,
}
