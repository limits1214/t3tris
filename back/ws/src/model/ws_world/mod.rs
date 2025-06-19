use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use tokio::task::JoinHandle;

use crate::{model::ws_world::ws_topic::WsTopic, ws_world::WsWorldCommand};

pub mod ws_topic;

pub struct WsRecvCtx<'a> {
    pub ws_world_command_tx: &'a mut tokio::sync::mpsc::UnboundedSender<WsWorldCommand>,
    // pub ws_topic: &'a mut WsTopic,
    pub ws_id: &'a str,
    pub user_id: &'a str,
    pub nick_name: &'a str,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WsWorldUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
    // pub topics: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WsWorldRoomUser {
    pub user_id: String,
    pub ws_id: String,
    pub nick_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WsWorldRoom {
    pub room_id: String,
    pub room_name: String,
    // pub room_status: String,
    pub room_host: WsWorldRoomUser,
    pub room_users: Vec<WsWorldRoomUser>,
    pub room_event: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WsWorldRoomChat {
    timestamp: OffsetDateTime,
    nick_name: String,
    user_id: String,
    ws_id: String,
    msg: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RoomEvents {
    #[serde(rename_all = "camelCase")]
    CreateRoom {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        create_ws_id: String,
    },
    #[serde(rename_all = "camelCase")]
    DestroyedRoom {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
    },
    #[serde(rename_all = "camelCase")]
    UserEnter {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    #[serde(rename_all = "camelCase")]
    UserLeave {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    #[serde(rename_all = "camelCase")]
    SystemChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    UserChat {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        nick_name: String,
        user_id: String,
        ws_id: String,
        msg: String,
    },
    #[serde(rename_all = "camelCase")]
    HostChange {
        #[serde(with = "time::serde::rfc3339")]
        timestamp: OffsetDateTime,
        before_ws_id: Option<String>,
        after_ws_id: Option<String>,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WsWorldGame {
    //
}
