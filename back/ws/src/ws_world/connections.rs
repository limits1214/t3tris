use crate::ws_world::model::{UserId, WsId};
use serde::{Deserialize, Serialize};
use std::collections::{
    HashMap,
    hash_map::{IntoIter, Iter},
};
use time::OffsetDateTime;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsConnections {
    connections: HashMap<WsId, WsWorldConnection>,
}
impl WsConnections {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
        }
    }
}
impl WsConnections {
    pub fn iter(&self) -> Iter<WsId, WsWorldConnection> {
        self.connections.iter()
    }

    #[allow(dead_code)]
    pub fn iter_mut(&mut self) -> std::collections::hash_map::IterMut<WsId, WsWorldConnection> {
        self.connections.iter_mut()
    }

    #[allow(dead_code)]
    pub fn into_iter(self) -> IntoIter<WsId, WsWorldConnection> {
        self.connections.into_iter()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldConnection {
    pub ws_id: WsId,
    pub auth: WsConnAuth,
    pub connected_at: OffsetDateTime,
    pub conn_state: WsConnState,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsConnState {
    Idle,
    InLobby,
    InRoom { room_id: String },
    Playing { room_id: String },
    Spectating { room_id: String },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsConnAuth {
    Unauthenticated,
    Authenticated { user: WsWorldUser },
}

impl WsConnections {
    pub fn create(&mut self, ws_id: WsId) {
        self.connections.insert(
            ws_id.clone(),
            WsWorldConnection {
                ws_id: ws_id,
                auth: WsConnAuth::Unauthenticated,
                connected_at: OffsetDateTime::now_utc(),
                conn_state: WsConnState::Idle,
            },
        );
    }

    pub fn insert(
        &mut self,
        ws_id: WsId,
        connection: WsWorldConnection,
    ) -> Option<WsWorldConnection> {
        self.connections.insert(ws_id, connection)
    }

    pub fn get(&self, ws_id: &WsId) -> Option<&WsWorldConnection> {
        self.connections.get(ws_id)
    }

    pub fn remove(&mut self, ws_id: &WsId) -> Option<WsWorldConnection> {
        self.connections.remove(ws_id)
    }

    pub fn get_user_by_ws_id<'a>(&'a self, ws_id: &'a WsId) -> Option<&'a WsWorldUser> {
        match self.get(ws_id) {
            Some(conn) => match &conn.auth {
                WsConnAuth::Unauthenticated => None,
                WsConnAuth::Authenticated { user } => Some(user),
            },
            None => None,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldUser {
    pub user_id: UserId,
    pub nick_name: String,
}
