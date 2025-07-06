use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::ws_world::{game::tetris::TetrisGameAction, model::WsWorldRoomStatus};

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
    Err { msg: String, code: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
    #[serde(rename_all = "camelCase")]
    UserLogined {
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    #[serde(rename_all = "camelCase")]
    UserLoginFailed,
    #[serde(rename_all = "camelCase")]
    UserLogouted { user_id: String },

    // === 로비관련 ===
    #[serde(rename_all = "camelCase")]
    LobbyEntered,
    #[serde(rename_all = "camelCase")]
    LobbyLeaved,
    #[serde(rename_all = "camelCase")]
    LobbyUpdated {
        rooms: Vec<Room>,
        users: Vec<LobbyUser>,
        chats: Vec<LobbyChat>,
    },
    #[serde(rename_all = "camelCase")]
    LobbyChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        user: User,
        msg: String,
    },

    // === 룸관련 ===
    #[serde(rename_all = "camelCase")]
    RoomCreated { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomEntered { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomLeaved { room_id: String },
    #[serde(rename_all = "camelCase")]
    RoomUpdated { room: Room },
    #[serde(rename_all = "camelCase")]
    RoomChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        user: User,
        msg: String,
    },

    // === 게임 관련 ===
    #[serde(rename_all = "camelCase")]
    GameMsg {
        game_id: String,
        room_id: String,
        tetries: HashMap<String, serde_json::Value>,
    },
    #[serde(rename_all = "camelCase")]
    GameAction {
        game_id: String,
        room_id: String,
        action: HashMap<String, Vec<TetrisGameAction>>,
    },
}
impl ServerToClientWsMsg {
    pub fn to_json(&self) -> String {
        match serde_json::to_string(&self) {
            Ok(s) => s,
            Err(e) => {
                tracing::error!("Failed to serialize ServerToClientWsMsg: {e:?}");
                "{}".to_string()
            }
        }
    }
}
impl From<&ServerToClientWsMsg> for String {
    fn from(msg: &ServerToClientWsMsg) -> Self {
        msg.to_json()
    }
}
impl From<ServerToClientWsMsg> for String {
    fn from(msg: ServerToClientWsMsg) -> Self {
        msg.to_json()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub ws_id: String,
    pub user_id: String,
    pub nick_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LobbyUser {
    pub ws_id: String,
    pub user_id: String,
    pub nick_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lobby {
    pub rooms: Vec<Room>,
    pub users: Vec<LobbyUser>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
    pub is_game_ready: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Room {
    pub room_id: String,
    pub room_name: String,
    pub room_host_user: Option<User>,
    pub room_users: Vec<RoomUser>,
    pub room_status: WsWorldRoomStatus,
    pub games: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LobbyChat {
    //
}
