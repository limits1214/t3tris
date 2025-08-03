use sqlx::FromRow;
use time::OffsetDateTime;
#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub struct GameRoomBackup {
    pub id: i32,
    pub room_id: String,
    pub game_id: String,
    pub ws_ids: serde_json::Value,
    pub user_ids: serde_json::Value,
    pub data: serde_json::Value,
    pub created_at: OffsetDateTime,
    pub created_by: Option<String>,
    pub updated_at: OffsetDateTime,
    pub updated_by: Option<String>,
    pub is_deleted: bool,
}
