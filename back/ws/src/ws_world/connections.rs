use crate::ws_world::model::{UserId, WsData, WsId, WsWorldUser};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use time::OffsetDateTime;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsConnections {
    inner: HashMap<WsId, WsWorldConnection>,
}
impl WsConnections {
    pub fn new() -> Self {
        Self {
            inner: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WsWorldConnection {
    pub ws_id: String,
    pub auth_status: WsConnAuthStatus,
    pub connected_at: OffsetDateTime,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum WsConnAuthStatus {
    Unauthenticated,
    Authenticated { user_id: UserId },
}

impl WsConnections {
    //
    pub fn create(&mut self, ws_id: String) {
        self.inner.insert(
            ws_id.clone(),
            WsWorldConnection {
                ws_id: ws_id,
                auth_status: WsConnAuthStatus::Unauthenticated,
                connected_at: OffsetDateTime::now_utc(),
            },
        );
    }

    pub fn insert(
        &mut self,
        ws_id: String,
        connection: WsWorldConnection,
    ) -> Option<WsWorldConnection> {
        self.inner.insert(ws_id, connection)
    }

    pub fn get(&self, ws_id: &str) -> Option<&WsWorldConnection> {
        self.inner.get(ws_id)
    }

    pub fn remove(&mut self, ws_id: &str) -> Option<WsWorldConnection> {
        self.inner.remove(ws_id)
    }

    pub fn get_user_by_ws_id<'a>(
        &self,
        ws_id: &'a str,
        data: &'a WsData,
    ) -> Option<&'a WsWorldUser> {
        match self.get(ws_id) {
            Some(conn) => match &conn.auth_status {
                WsConnAuthStatus::Unauthenticated => None,
                WsConnAuthStatus::Authenticated { user_id } => data.users.get(user_id),
            },
            None => None,
        }
    }
}
