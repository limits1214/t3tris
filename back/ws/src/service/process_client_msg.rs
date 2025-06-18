use crate::model::{WsRecvCtx, msg::ClientWsMsg};
use anyhow::Context;
use axum::extract::ws::Message;
use std::ops::ControlFlow;

pub async fn process_clinet_msg(
    msg: Option<Result<Message, axum::Error>>,
    ctx: &mut WsRecvCtx<'_>,
) -> anyhow::Result<ControlFlow<()>> {
    match msg {
        Some(Ok(Message::Text(text))) => {
            tracing::debug!("ws_in_text: {text:?}");

            match serde_json::from_str::<ClientWsMsg>(&text)? {
                ClientWsMsg::Ping => {
                    crate::service::ws::ping(ctx)
                        .await
                        .with_context(|| "Ping")?;
                }
                ClientWsMsg::Echo { msg } => {
                    crate::service::ws::echo(ctx, msg)
                        .await
                        .with_context(|| "Echo")?;
                }
                ClientWsMsg::TopicEcho { topic, msg } => {
                    crate::service::ws::topic_echo(ctx, &topic, msg)
                        .await
                        .with_context(|| format!("TopicEcho, topic: {topic}"))?;
                }
                ClientWsMsg::SubscribeTopic { topic } => {
                    crate::service::ws::subscribe_topic(ctx, &topic)
                        .await
                        .with_context(|| format!("SubscribeTopic, topic: {topic}"))?;
                }
                ClientWsMsg::UnSubscribeTopic { topic } => {
                    crate::service::ws::unsubscribe_topic(ctx, &topic)
                        .await
                        .with_context(|| format!("UnSubscribeTopic, topic: {topic}"))?;
                }
                ClientWsMsg::RoomCreate { room_name } => {
                    crate::service::room::room_create(ctx, &room_name)
                        .await
                        .with_context(|| "RoomCreate")?;
                }
                ClientWsMsg::RoomChat { room_id, msg } => {
                    crate::service::room::room_chat(ctx, &room_id, &msg)
                        .await
                        .with_context(|| "RoomChat")?;
                }
                ClientWsMsg::RoomEnter { room_id } => {
                    crate::service::room::room_enter(ctx, &room_id)
                        .await
                        .with_context(|| format!("RoomEnter, room_id: {room_id}"))?;
                }
                ClientWsMsg::RoomLeave { room_id } => {
                    crate::service::room::room_leave(ctx, &room_id)
                        .await
                        .with_context(|| format!("RoomLeave, room_id: {room_id}"))?;
                }
                ClientWsMsg::RoomListFetch => {
                    crate::service::room::room_list_fetch(ctx)
                        .await
                        .with_context(|| "RoomListFetch")?;
                }
            }
        }
        None => {
            tracing::warn!("msg is none, break!");
            return Ok(ControlFlow::Break(()));
        }
        _ => {}
    }
    Ok(ControlFlow::Continue(()))
}
