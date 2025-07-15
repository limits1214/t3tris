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
    #[serde(rename_all = "camelCase")]
    UserLogin { access_token: String },
    #[serde(rename_all = "camelCase")]
    UserLogout,

    // === 로비 관련 ===
    #[serde(rename_all = "camelCase")]
    LobbyChat { msg: String },
    #[serde(rename_all = "camelCase")]
    LobbySubscribe,
    #[serde(rename_all = "camelCase")]
    LobbyUnSubscribe,

    // === 룸 관련 ===
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
    RoomGameTypeChange { room_id: String, game_type: String },
    #[serde(rename_all = "camelCase")]
    RoomGameStart { room_id: String },

    // === 게임관련 ===
    #[serde(rename_all = "camelCase")]
    GameAction {
        game_id: String,
        input: GameActionInput,
        action: GameActionType,
    },
    #[serde(rename_all = "camelCase")]
    GameSync { game_id: String },
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GameActionInput {
    Press,
    // Release,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GameActionType {
    Left,
    Right,
    RotateLeft,
    RotateRight,
    HardDrop,
    SoftDrop,
    Hold,
}

impl From<GameActionType> for crate::ws_world::command::GameActionType {
    fn from(value: GameActionType) -> Self {
        match value {
            GameActionType::Hold => Self::Hold,
            GameActionType::Left => Self::Left,
            GameActionType::Right => Self::Right,
            GameActionType::RotateLeft => Self::RotateLeft,
            GameActionType::RotateRight => Self::RotateRight,
            GameActionType::HardDrop => Self::HardDrop,
            GameActionType::SoftDrop => Self::SoftDrop,
        }
    }
}
