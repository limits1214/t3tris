use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

/// server -> client
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum ServerToClientWsMsg {
    // === 기본동작 ===
    #[serde(rename_all = "camelCase")]
    Pong,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
    // === 룸관련 ===
    #[serde(rename_all = "camelCase")]
    RoomChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        user: User,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    RoomUpdated { room: Room },
    #[serde(rename_all = "camelCase")]
    RoomListUpdated { rooms: Vec<Room> },
}
impl ServerToClientWsMsg {
    pub fn to_json(&self) -> String {
        match serde_json::to_string(&self) {
            Ok(s) => s,
            Err(e) => {
                tracing::error!("Failed to serialize ServerToClientWsMsg: {e:?}");
                "{}".to_string()
            }
        }
    }
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
    pub is_game_ready: bool,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Room {
    pub room_id: String,
    pub room_name: String,
    pub room_host_user: Option<User>,
    pub room_users: Vec<RoomUser>,
}
