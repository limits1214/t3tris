use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

pub type OneShot<T> = tokio::sync::oneshot::Sender<T>;

pub type Topic = String;
pub type RoomId = String;
pub type GameId = String;
pub type UserId = String;
pub type WsId = String;

#[derive(Debug)]
pub struct WsData {
    pub users: HashMap<UserId, WsWorldUser>,
    pub rooms: HashMap<RoomId, WsWorldRoom>,
    pub games: HashMap<GameId, WsWorldGame>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldUser {
    pub user_id: String,
    pub nick_name: String,
    // pub ws_ids: HashSet<WsId>,
    pub state: WsWorldUserState,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsWorldUserState {
    Idle,
    InLobby,
    InRoom { room_id: String },
    Playing { room_id: String },
    Spectating { room_id: String },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoom {
    pub room_id: String,
    pub room_name: String,
    pub room_host_user_id: Option<UserId>,
    pub room_users: HashMap<UserId, WsWorldRoomUser>,
    pub room_events: Vec<WsWorldRoomEvent>,
    pub is_deleted: bool,
    pub room_status: WsWorldRoomStatus,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoomUser {
    pub user_id: UserId,
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
