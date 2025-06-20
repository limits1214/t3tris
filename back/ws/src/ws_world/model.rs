use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoom {
    pub room_id: String,
    pub room_name: String,
    pub room_host_ws_id: Option<String>,
    pub room_ws_ids: Vec<String>,
    pub room_events: Vec<WsWorldRoomEvent>,
    pub is_deleted: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoomChat {
    timestamp: OffsetDateTime,
    nick_name: String,
    user_id: String,
    ws_id: String,
    msg: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsWorldRoomEvent {
    CreateRoom {
        timestamp: OffsetDateTime,
        create_ws_id: String,
    },
    DestroyedRoom {
        timestamp: OffsetDateTime,
    },
    UserEnter {
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    UserLeave {
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    SystemChat {
        timestamp: OffsetDateTime,

        msg: String,
    },
    UserChat {
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    HostChange {
        timestamp: OffsetDateTime,
        before_ws_id: Option<String>,
        after_ws_id: Option<String>,
    },
}
