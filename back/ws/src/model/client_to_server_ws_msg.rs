use serde::{Deserialize, Serialize};
use tetris_lib::Tetrimino;

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
        // input: GameActionInput,
        action: GameActionType,
    },
    #[serde(rename_all = "camelCase")]
    GameSync { game_id: String, room_id: String },
    #[serde(rename_all = "camelCase")]
    GameBoardSync { game_id: String, room_id: String },
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
    MoveLeft,
    MoveRight,
    RotateLeft,
    RotateRight,
    HardDrop,
    SoftDrop,
    Hold,
    Step,
    LineClear,
    Placing,
    RemoveFalling,
    ShiftNext {
        next: Tetrimino,
    },
    PushNext {
        next: Tetrimino,
    },
    Setup {
        next: Vec<Tetrimino>,
        hold: Option<Tetrimino>,
    },
    Spawn {
        spawn: Tetrimino,
    },
    AddHold {
        hold: Tetrimino,
    },
    SetInfo {
        level: Option<u32>,
        score: Option<u32>,
        line: Option<u32>,
    },
    ScoreEffect {
        kind: String,
        combo: u32,
    },
}

impl From<GameActionType> for crate::ws_world::command::GameActionType {
    fn from(value: GameActionType) -> Self {
        match value {
            GameActionType::Hold => Self::Hold,
            GameActionType::MoveLeft => Self::MoveLeft,
            GameActionType::MoveRight => Self::MoveRight,
            GameActionType::RotateLeft => Self::RotateLeft,
            GameActionType::RotateRight => Self::RotateRight,
            GameActionType::HardDrop => Self::HardDrop,
            GameActionType::SoftDrop => Self::SoftDrop,
            GameActionType::Step => Self::Step,
            GameActionType::LineClear => Self::LineClear,
            GameActionType::Placing => Self::Placing,
            GameActionType::RemoveFalling => Self::RemoveFalling,
            GameActionType::ShiftNext { next } => Self::ShiftNext { next },
            GameActionType::PushNext { next } => Self::PushNext { next },
            GameActionType::Setup { next, hold } => Self::Setup { next, hold },
            GameActionType::Spawn { spawn } => Self::Spawn { spawn },
            GameActionType::AddHold { hold } => Self::AddHold { hold },
            GameActionType::SetInfo { level, score, line } => Self::SetInfo { level, score, line },
            GameActionType::ScoreEffect { kind, combo } => Self::ScoreEffect { kind, combo },
        }
    }
}
