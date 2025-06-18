use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::model::room::RoomInfo;

/// client -> server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
pub enum ClientWsMsg {
    // === 기본동작 ===
    #[serde(rename_all = "camelCase")]
    Ping,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
    #[serde(rename_all = "camelCase")]
    SubscribeTopic { topic: String },
    #[serde(rename_all = "camelCase")]
    UnSubscribeTopic { topic: String },

    // === 룸 관련 ===
    #[serde(rename_all = "camelCase")]
    RoomCreate { room_name: String },
    #[serde(rename_all = "camelCase")]
    RoomListFetch,
    #[serde(rename_all = "camelCase")]
    RoomEnter { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomLeave { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomChat { room_id: String, msg: String },
}

/// server -> client
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
pub enum ServerWsMsg {
    #[serde(rename_all = "camelCase")]
    Pong,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
    #[serde(rename_all = "camelCase")]
    RoomEnter { room_info: RoomInfo },
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
    RoomUpdate { room_info: RoomInfo },
}
