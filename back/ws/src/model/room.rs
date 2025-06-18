use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomInfo {
    pub room_id: String,
    pub room_name: String,
    pub host_user: RoomUser,
    pub users: Vec<RoomUser>,
    pub is_deleted: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RoomUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomChat {
    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: OffsetDateTime,
    pub nick_name: String,
    pub user_id: String,
    pub ws_id: String,
    pub msg: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RoomEvents {
    #[serde(rename_all = "camelCase")]
    CreateRoom {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        create_ws_id: String,
    },
    #[serde(rename_all = "camelCase")]
    DestroyedRoom {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
    },
    #[serde(rename_all = "camelCase")]
    UserEnter {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    #[serde(rename_all = "camelCase")]
    UserLeave {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    #[serde(rename_all = "camelCase")]
    SystemChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    UserChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    HostChange {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        before_ws_id: Option<String>,
        after_ws_id: Option<String>,
    },
}
