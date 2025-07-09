use std::{
    collections::HashMap,
    ops::Deref,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::ws_world::game::tetris::TetrisGame;

macro_rules! define_id_type {
    ($name: ident) => {
        #[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
        pub struct $name(pub String);
        impl Deref for $name {
            type Target = String;

            fn deref(&self) -> &Self::Target {
                &self.0
            }
        }
        impl From<String> for $name {
            fn from(value: String) -> Self {
                Self(value)
            }
        }
        impl From<$name> for String {
            fn from(value: $name) -> Self {
                value.0
            }
        }
    };
}

define_id_type!(TopicId);
define_id_type!(WsId);
define_id_type!(UserId);
define_id_type!(RoomId);
define_id_type!(GameId);

#[derive(Debug)]
pub struct WsData {
    pub rooms: HashMap<RoomId, WsWorldRoom>,
    pub games: HashMap<GameId, WsWorldGame>,
}
impl WsData {
    pub fn new() -> Self {
        Self {
            rooms: HashMap::new(),
            games: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoom {
    pub room_id: RoomId,
    pub room_name: String,
    pub room_host_ws_id: Option<WsId>,
    pub room_users: HashMap<WsId, WsWorldRoomUser>,
    pub room_events: Vec<WsWorldRoomEvent>,
    pub is_deleted: bool,
    pub room_status: WsWorldRoomStatus,
    pub games: Vec<GameId>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldRoomUser {
    pub ws_id: WsId,
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
    pub game_id: GameId,
    pub room_id: RoomId,
    //
    pub game_type: WsWorldGameType,
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
    pub tetries: HashMap<WsId, TetrisGame>,
    //
    pub status: WsWorldGameStatus,
    //
    pub is_deleted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WsWorldGameType {
    Solo,
    MultiSolo,
    LastManStanding,
}

#[derive(Debug, PartialEq, Eq, Clone, Deserialize, Serialize)]
pub enum WsWorldGameStatus {
    BeforeGameStartTimerThree,
    BeforeGameStartTimerTwo,
    BeforeGameStartTimerOne,
    GameStart,

    GameEnd,
}
