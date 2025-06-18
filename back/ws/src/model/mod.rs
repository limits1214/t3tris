use std::collections::HashSet;

use crate::ws_topic::WsTopic;
use serde::{Deserialize, Serialize};

pub mod room;
pub mod ws_msg;

pub struct WsRecvCtx<'a> {
    pub rclient: &'a mut redis::Client,
    pub rpool: &'a mut deadpool_redis::Pool,
    pub ws_topic: &'a mut WsTopic,
    pub ws_id: &'a str,
    pub user_id: &'a str,
    pub nick_name: &'a str,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WsConnWsId {
    pub ws_id: String,
    pub user_id: String,
    pub topics: HashSet<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WsConnUserId {
    pub user_id: String,
    pub ws_ids: HashSet<String>,
}
