use serde::{Deserialize, Serialize};

/// client -> server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
pub enum ClientWsMsg {
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
    //
    //
    //
    #[serde(rename_all = "camelCase")]
    CreateRoom { room_name: String },
    #[serde(rename_all = "camelCase")]
    FetchRoom,
}

/// server -> client
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "t", content = "d")]
pub enum ServerWsMsg {
    #[serde(rename_all = "camelCase")]
    Pong,
    #[serde(rename_all = "camelCase")]
    Echo { msg: String },
    #[serde(rename_all = "camelCase")]
    TopicEcho { topic: String, msg: String },
}
