use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::model::room::{RoomChat, RoomInfo};

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
    RoomEnter {
        room_info: RoomInfo,
        chats: Vec<RoomChat>,
    },
    #[serde(rename_all = "camelCase")]
    RoomChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    RoomListFetch { rooms: Vec<RoomInfo> },
    #[serde(rename_all = "camelCase")]
    RoomUpdated { room_info: RoomInfo },
    #[serde(rename_all = "camelCase")]
    RoomListUpdated { rooms: Vec<RoomInfo> },
}
