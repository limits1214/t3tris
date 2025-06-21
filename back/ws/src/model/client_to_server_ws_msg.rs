use serde::{Deserialize, Serialize};

/// client -> server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum ClientToServerWsMsg {
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
    RoomListUpdateSubscribe,
    #[serde(rename_all = "camelCase")]
    RoomListUpdateUnSubscribe,
    #[serde(rename_all = "camelCase")]
    RoomCreate { room_name: String },
    #[serde(rename_all = "camelCase")]
    RoomEnter { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomLeave { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomChat { room_id: String, msg: String },
    #[serde(rename_all = "camelCase")]
    RoomGameReady { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomGameUnReady { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomGameStart { room_id: String },
}
