use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

pub type OneShot<T> = tokio::sync::oneshot::Sender<T>;
pub type WsId = String;
pub type Topic = String;
pub type RoomId = String;
pub type GameId = String;

#[derive(Debug)]
pub struct WsData {
    pub users: HashMap<WsId, WsWorldUser>,
    pub lobby: WsWorldLobby,
    pub rooms: HashMap<RoomId, WsWorldRoom>,
    pub games: HashMap<GameId, WsWorldGame>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsWorldUser {
    Unauthenticated {
        ws_id: String,
    },
    Authenticated {
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldLobby {
    pub users: HashMap<WsId, WsWorldLobbyUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsWorldLobbyUser {
    pub ws_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoom {
    pub room_id: String,
    pub room_name: String,
    pub room_host_ws_id: Option<String>,
    pub room_users: HashMap<WsId, WsWorldRoomUser>,
    pub room_events: Vec<WsWorldRoomEvent>,
    pub is_deleted: bool,
    pub room_status: WsWorldRoomStatus,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoomUser {
    pub ws_id: String,
    pub is_game_ready: bool,
}
#[derive(Debug, PartialEq, Eq, Clone, Deserialize, Serialize)]
pub enum WsWorldRoomStatus {
    Waiting,
    Gaming,
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

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct WsWorldGame {
    pub game_id: String,
    pub room_id: String,
    //
    pub started_at: OffsetDateTime,
    #[serde(skip)]
    #[serde(default = "std::time::Instant::now")]
    pub started: Instant,
    #[serde(skip)]
    #[serde(default = "std::time::Instant::now")]
    pub now: Instant,
    pub elapsed: Duration,
    pub delta: Duration,
    //
    pub status: WsWorldGameStatus,
    //
    pub is_deleted: bool,
}

#[derive(Debug, PartialEq, Eq, Clone, Deserialize, Serialize)]
pub enum WsWorldGameStatus {
    BeforeGameStartTimerThree,
    BeforeGameStartTimerTwo,
    BeforeGameStartTimerOne,
    GameStart,

    GameEnd,
}
