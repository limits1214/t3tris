use axum::extract::ws::Message;
use bb8_redis::{RedisConnectionManager, redis::AsyncCommands};

use crate::{
    model::ws::{ClientWsMsg, ServerWsMsg},
    ws_topic::WsTopic,
};

pub async fn process_clinet_msg(
    msg: Option<Result<Message, axum::Error>>,
    redis_pool: &mut bb8::Pool<RedisConnectionManager>,
    ws_id: &str,
    ws_topic: &mut WsTopic,
) -> anyhow::Result<bool> {
    match msg {
        Some(Ok(Message::Text(text))) => {
            tracing::debug!("ws_in_text: {text:?}");

            match serde_json::from_str::<ClientWsMsg>(&text)? {
                ClientWsMsg::Ping => {
                    let server_msg = ServerWsMsg::Pong;
                    let server_msg_str = serde_json::to_string(&server_msg)?;

                    let mut publish_conn = redis_pool.get_owned().await?;
                    publish_conn
                        .publish::<String, String, ()>(format!("user:{ws_id}"), server_msg_str)
                        .await?;
                }
                ClientWsMsg::Echo { msg } => {
                    let server_msg = ServerWsMsg::Echo { msg: msg };
                    let server_msg_str = serde_json::to_string(&server_msg)?;

                    let mut publish_conn = redis_pool.get_owned().await?;
                    publish_conn
                        .publish::<String, String, ()>(format!("user:{ws_id}"), server_msg_str)
                        .await?;
                }
                ClientWsMsg::SubscribeTopic { topic } => {
                    ws_topic.subscribe(&topic);
                }
                ClientWsMsg::UnSubscribeTopic { topic } => {
                    ws_topic.unsubscribe(&topic);
                }
                ClientWsMsg::TopicEcho { topic, msg } => {
                    let server_msg = ServerWsMsg::TopicEcho {
                        topic: topic.clone(),
                        msg,
                    };
                    let server_msg_str = serde_json::to_string(&server_msg)?;
                    ws_topic.publish(&topic, &server_msg_str).await?;
                }
                ClientWsMsg::CreateRoom { room_name } => {
                    //
                    let _a = room_name;
                    // let con = redis_pool.get_owned().await?;
                }
                ClientWsMsg::FetchRoom => {
                    //
                }
            }
        }
        None => {
            return Ok(true);
        }
        _ => {}
    }

    Ok(false)
}
