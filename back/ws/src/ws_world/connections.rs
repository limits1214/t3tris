use crate::ws_world::model::{UserId, WsId};
use serde::{Deserialize, Serialize};
use std::collections::{
    HashMap, HashSet,
    hash_map::{IntoIter, Iter},
};
use time::OffsetDateTime;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsConnections {
    connections: HashMap<WsId, WsWorldConnection>,
    user_to_ws_ids: HashMap<UserId, HashSet<WsId>>,
}
impl WsConnections {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
            user_to_ws_ids: HashMap::new(),
        }
    }
}
impl WsConnections {
    pub fn conn_iter(&self) -> Iter<WsId, WsWorldConnection> {
        self.connections.iter()
    }

    #[allow(dead_code)]
    pub fn conn_iter_mut(
        &mut self,
    ) -> std::collections::hash_map::IterMut<WsId, WsWorldConnection> {
        self.connections.iter_mut()
    }

    #[allow(dead_code)]
    pub fn conn_into_iter(self) -> IntoIter<WsId, WsWorldConnection> {
        self.connections.into_iter()
    }
}
impl WsConnections {
    pub fn conn_create(&mut self, ws_id: WsId) {
        self.connections.insert(
            ws_id.clone(),
            WsWorldConnection {
                ws_id: ws_id,
                auth: WsConnAuth::Unauthenticated,
                connected_at: OffsetDateTime::now_utc(),
                state: WsConnState::Idle,
            },
        );
    }

    pub fn conn_insert(
        &mut self,
        ws_id: WsId,
        connection: WsWorldConnection,
    ) -> Option<WsWorldConnection> {
        self.connections.insert(ws_id, connection)
    }

    pub fn conn_get(&self, ws_id: &WsId) -> Option<&WsWorldConnection> {
        self.connections.get(ws_id)
    }

    pub fn conn_get_mut(&mut self, ws_id: &WsId) -> Option<&mut WsWorldConnection> {
        self.connections.get_mut(ws_id)
    }

    pub fn conn_remove(&mut self, ws_id: &WsId) -> Option<WsWorldConnection> {
        self.connections.remove(ws_id)
    }

    pub fn get_user_by_ws_id<'a>(&'a self, ws_id: &'a WsId) -> Option<&'a WsWorldUser> {
        match self.conn_get(ws_id) {
            Some(conn) => match &conn.auth {
                WsConnAuth::Unauthenticated => None,
                WsConnAuth::Authenticated { user } => Some(user),
            },
            None => None,
        }
    }
}
impl WsConnections {
    pub fn add_user_ws_id(&mut self, ws_id: &WsId, user_id: &UserId) {
        self.user_to_ws_ids
            .entry(user_id.clone())
            .or_insert_with(HashSet::new)
            .insert(ws_id.clone());
    }

    pub fn del_user_ws_id(&mut self, ws_id: &WsId, user_id: &UserId) {
        if let Some(set) = self.user_to_ws_ids.get_mut(user_id) {
            set.remove(ws_id);

            // HashSet이 비면 user_id도 제거
            if set.is_empty() {
                self.user_to_ws_ids.remove(user_id);
            }
        }
    }

    #[allow(dead_code)]
    pub fn get_user_ws_id(&self, user_id: &UserId) -> Option<&HashSet<WsId>> {
        self.user_to_ws_ids.get(user_id)
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldConnection {
    pub ws_id: WsId,
    pub auth: WsConnAuth,
    #[serde(with = "time::serde::rfc3339")]
    pub connected_at: OffsetDateTime,
    pub state: WsConnState,
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

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldUser {
    pub user_id: UserId,
    pub nick_name: String,
}
