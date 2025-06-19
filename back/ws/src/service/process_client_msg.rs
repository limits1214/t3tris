use crate::model::{ws_msg::ClientToServerWsMsg, ws_world::WsRecvCtx};
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
                    ctx.ping().with_context(|| "Ping")?;
                }
                Echo { msg } => {
                    ctx.echo(&msg).with_context(|| "Echo")?;
                }
                TopicEcho { topic, msg } => {
                    ctx.topic_echo(&topic, &msg)
                        .with_context(|| format!("TopicEcho topic: {topic}, msg: {msg}"))?;
                }
                SubscribeTopic { topic } => {
                    ctx.topic_subscribe(&topic)
                        .await
                        .with_context(|| format!("SubscribeTopic, topic: {topic}"))?;
                }
                UnSubscribeTopic { topic } => {
                    ctx.topic_unsubscribe(&topic);
                }
                RoomCreate { room_name } => {
                    // crate::service::room::process_room_create(ctx, &room_name)
                    //     .await
                    //     .with_context(|| "RoomCreate")?;
                }
                RoomChat { room_id, msg } => {
                    // crate::service::room::proess_room_chat(ctx, &room_id, &msg)
                    //     .await
                    //     .with_context(|| "RoomChat")?;
                }
                RoomEnter { room_id } => {
                    // crate::service::room::process_room_enter(ctx, &room_id)
                    //     .await
                    //     .with_context(|| format!("RoomEnter, room_id: {room_id}"))?;
                }
                RoomLeave { room_id } => {
                    // crate::service::room::process_room_leave(ctx, &room_id)
                    //     .await
                    //     .with_context(|| format!("RoomLeave, room_id: {room_id}"))?;
                }
                RoomListFetch => {
                    // crate::service::room::process_room_list_fetch(ctx)
                    //     .await
                    //     .with_context(|| "RoomListFetch")?;
                }
                RoomListUpdateSubscribe => {
                    // crate::service::room::process_room_list_update_subscribe(ctx)
                    //     .await
                    //     .with_context(|| "RoomListUpdateSubscribe")?;
                }
                RoomListUpdateUnSubscribe => {
                    // crate::service::room::process_room_list_update_unsubscribe(ctx)
                    //     .await
                    //     .with_context(|| "RoomListUpdateUnSubscribe")?;
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
