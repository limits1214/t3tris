use crate::model::{WsRecvCtx, ws_msg::ClientToServerWsMsg};
use anyhow::Context;
use axum::extract::ws::Message;
use std::ops::ControlFlow;

pub async fn process_clinet_msg(
    msg: Option<Result<Message, axum::Error>>,
    ctx: &mut WsRecvCtx<'_>,
) -> anyhow::Result<ControlFlow<()>> {
    use crate::model::ws_msg::ClientToServerWsMsg::*;
    match msg {
        Some(Ok(Message::Text(text))) => {
            tracing::debug!("ws_in_text: {text:?}");

            match serde_json::from_str::<ClientToServerWsMsg>(&text)? {
                Ping => {
                    crate::service::ws::ping(ctx)
                        .await
                        .with_context(|| "Ping")?;
                }
                Echo { msg } => {
                    crate::service::ws::echo(ctx, msg)
                        .await
                        .with_context(|| "Echo")?;
                }
                TopicEcho { topic, msg } => {
                    crate::service::ws::topic_echo(ctx, &topic, msg)
                        .await
                        .with_context(|| format!("TopicEcho, topic: {topic}"))?;
                }
                SubscribeTopic { topic } => {
                    crate::service::ws::subscribe_topic(ctx, &topic)
                        .await
                        .with_context(|| format!("SubscribeTopic, topic: {topic}"))?;
                }
                UnSubscribeTopic { topic } => {
                    crate::service::ws::unsubscribe_topic(ctx, &topic)
                        .await
                        .with_context(|| format!("UnSubscribeTopic, topic: {topic}"))?;
                }
                RoomCreate { room_name } => {
                    crate::service::room::room_create(ctx, &room_name)
                        .await
                        .with_context(|| "RoomCreate")?;
                }
                RoomChat { room_id, msg } => {
                    crate::service::room::room_chat(ctx, &room_id, &msg)
                        .await
                        .with_context(|| "RoomChat")?;
                }
                RoomEnter { room_id } => {
                    crate::service::room::room_enter(ctx, &room_id)
                        .await
                        .with_context(|| format!("RoomEnter, room_id: {room_id}"))?;
                }
                RoomLeave { room_id } => {
                    crate::service::room::room_leave(ctx, &room_id)
                        .await
                        .with_context(|| format!("RoomLeave, room_id: {room_id}"))?;
                }
                RoomListFetch => {
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
