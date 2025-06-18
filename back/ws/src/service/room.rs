use crate::model::{
    WsRecvCtx,
    room::{RoomChats, RoomEvents, RoomInfo, RoomUser},
    ws_msg::ServerToClientWsMsg,
};
use nanoid::nanoid;
use redis::AsyncCommands;
use time::OffsetDateTime;

/// 방생성
pub async fn room_create(ctx: &mut WsRecvCtx<'_>, room_name: &str) -> anyhow::Result<()> {
    // roominfo  생성
    let room_id = nanoid!();
    let user = RoomUser {
        user_id: ctx.user_id.to_string(),
        ws_id: ctx.ws_id.to_string(),
        nick_name: ctx.nick_name.to_string(),
    };
    let room_info = RoomInfo {
        room_id: room_id.clone(),
        room_name: room_name.to_string(),
        host_user: user.clone(),
        users: vec![user],
        is_deleted: false,
    };

    // roomevents 생성
    let room_event_create = RoomEvents::CreateRoom {
        timestamp: OffsetDateTime::now_utc(),
        create_ws_id: ctx.ws_id.to_string(),
    };

    let room_event_enter = RoomEvents::UserEnter {
        timestamp: OffsetDateTime::now_utc(),
        ws_id: ctx.ws_id.to_string(),
        user_id: ctx.user_id.to_string(),
        nick_name: ctx.nick_name.to_string(),
    };

    // struct -> string 변환
    let room_info_str = serde_json::to_string(&room_info)?;
    let room_event_create_str = serde_json::to_string(&room_event_create)?;
    let room_event_enter_str = serde_json::to_string(&room_event_enter)?;

    // redis
    let mut rconn = ctx.rclient.get_multiplexed_async_connection().await?;
    redis::pipe()
        .set::<String, String>(format!("room:{room_id}:info"), room_info_str)
        .rpush::<String, String>(format!("room:{room_id}:events"), room_event_create_str)
        .rpush::<String, String>(format!("room:{room_id}:events"), room_event_enter_str)
        .query_async::<()>(&mut rconn)
        .await?;

    //
    crate::service::ws::subscribe_topic(ctx, &format!("room:{room_id}")).await?;
    crate::service::ws::subscribe_topic(ctx, &format!("room:{room_id}:ws_id:{}", ctx.ws_id))
        .await?;
    // ctx.ws_topic.subscribe(&format!("room:{room_id}"));
    // ctx.ws_topic
    // .subscribe(&format!("room:{room_id}:ws_id:{}", ctx.ws_id));

    let pubmsg = ServerToClientWsMsg::RoomEnter {
        room_info: room_info,
    };
    let pubmsg_str = serde_json::to_string(&pubmsg)?;
    crate::util::redis::publish(ctx.rpool, &format!("ws_id:{}", ctx.ws_id), &pubmsg_str).await?;
    Ok(())
}

pub async fn room_chat(ctx: &mut WsRecvCtx<'_>, room_id: &str, msg: &str) -> anyhow::Result<()> {
    let mut prconn = ctx.rpool.get().await?;

    let room_event_chat = RoomEvents::UserChat {
        timestamp: OffsetDateTime::now_utc(),
        nick_name: ctx.nick_name.to_string(),
        user_id: ctx.user_id.to_string(),
        ws_id: ctx.ws_id.to_string(),
        msg: msg.to_string(),
    };
    let room_event_chat_str = serde_json::to_string(&room_event_chat)?;

    prconn
        .rpush::<String, String, ()>(format!("room:{room_id}:events"), room_event_chat_str)
        .await?;

    let room_chats = RoomChats {
        timestamp: OffsetDateTime::now_utc(),
        nick_name: ctx.nick_name.to_string(),
        user_id: ctx.user_id.to_string(),
        ws_id: ctx.ws_id.to_string(),
        msg: msg.to_string(),
    };
    let room_chats_str = serde_json::to_string(&room_chats)?;
    prconn
        .rpush::<String, String, ()>(format!("room:{room_id}:chats"), room_chats_str.clone())
        .await?;

    let server_msg_room_chat = ServerToClientWsMsg::RoomChat {
        timestamp: room_chats.timestamp,
        nick_name: room_chats.nick_name,
        user_id: room_chats.user_id,
        ws_id: room_chats.ws_id,
        msg: room_chats.msg,
    };
    let server_msg_room_chat_str = serde_json::to_string(&server_msg_room_chat)?;
    crate::util::redis::publish(
        ctx.rpool,
        &format!("room:{room_id}"),
        &server_msg_room_chat_str,
    )
    .await?;
    Ok(())
}

pub async fn room_enter(ctx: &mut WsRecvCtx<'_>, room_id: &str) -> anyhow::Result<()> {
    // ctx.ws_topic.subscribe(&format!("room:{room_id}"));
    // ctx.ws_topic
    //     .subscribe(&format!("room:{room_id}:ws_id:{}", ctx.ws_id));
    crate::service::ws::subscribe_topic(ctx, &format!("room:{room_id}")).await?;
    crate::service::ws::subscribe_topic(ctx, &format!("room:{room_id}:ws_id:{}", ctx.ws_id))
        .await?;

    let mut prconn = ctx.rpool.get().await?;

    // 새유저
    let new_user = RoomUser {
        user_id: ctx.user_id.to_string(),
        ws_id: ctx.ws_id.to_string(),
        nick_name: ctx.nick_name.to_string(),
    };

    // 유저 추가
    let room_info_str = prconn
        .get::<String, String>(format!("room:{room_id}:info"))
        .await?;
    let mut room_info = serde_json::from_str::<RoomInfo>(&room_info_str)?;
    room_info.users.push(new_user);
    let room_info_str = serde_json::to_string(&room_info)?;
    prconn
        .set::<String, String, ()>(format!("room:{room_id}:info"), room_info_str)
        .await?;

    // 방 update publish
    let server_ws_room_update = ServerToClientWsMsg::RoomUpdate {
        room_info: room_info,
    };
    let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
    crate::util::redis::publish(
        ctx.rpool,
        &format!("room:{room_id}"),
        &server_ws_room_update_str,
    )
    .await?;

    // 유저 엔터 이벤트 추가
    let room_event_user_enter = RoomEvents::UserEnter {
        timestamp: OffsetDateTime::now_utc(),
        ws_id: ctx.ws_id.to_string(),
        user_id: ctx.user_id.to_string(),
        nick_name: ctx.nick_name.to_string(),
    };
    let room_event_user_enter_str = serde_json::to_string(&room_event_user_enter)?;
    prconn
        .rpush::<String, String, ()>(format!("room:{room_id}:events"), room_event_user_enter_str)
        .await?;
    Ok(())
}

// 나갈때,
// 내가 나가면 인원이 0이될때, 방을 파괴한다.
// 내가 나가도 인원이 0이 안되면서 본인이 host이면, 남은 유저들중에 인덱스 0을 host를 지정하고 users 빼고 나간다
// 내가 나가도 인원이 0이 안되면서 본인이 host가 아니면 users 빼고 나간다.
pub async fn room_leave(ctx: &mut WsRecvCtx<'_>, room_id: &str) -> anyhow::Result<()> {
    // ctx.ws_topic.unsubscribe(&format!("room:{room_id}"));
    // ctx.ws_topic.unsubscribe(&format!("room:{room_id}:ws_id:{}", ctx.ws_id));

    crate::service::ws::unsubscribe_topic(ctx, &format!("room:{room_id}")).await?;
    crate::service::ws::unsubscribe_topic(ctx, &format!("room:{room_id}:ws_id:{}", ctx.ws_id))
        .await?;

    let mut prconn = ctx.rpool.get().await?;
    let room_info_str = prconn
        .get::<String, String>(format!("room:{room_id}:info"))
        .await?;
    let mut room_info = serde_json::from_str::<RoomInfo>(&room_info_str)?;
    if room_info.users.len() <= 1 {
        // 방파괴
        // TODO: 저장 필요하다면 rdb로 옮기기
        let room_event_user_leave = RoomEvents::UserLeave {
            timestamp: OffsetDateTime::now_utc(),
            ws_id: ctx.ws_id.to_string(),
            user_id: ctx.user_id.to_string(),
            nick_name: ctx.nick_name.to_string(),
        };
        let room_event_user_leave_str = serde_json::to_string(&room_event_user_leave)?;
        prconn
            .rpush::<String, String, ()>(
                format!("room:{room_id}:events"),
                room_event_user_leave_str,
            )
            .await?;

        let room_event_destroy = RoomEvents::DestroyedRoom {
            timestamp: OffsetDateTime::now_utc(),
        };
        let room_event_destroy_str = serde_json::to_string(&room_event_destroy)?;
        prconn
            .rpush::<String, String, ()>(format!("room:{room_id}:events"), room_event_destroy_str)
            .await?;

        let idx = room_info.users.iter().position(|ru| ru.ws_id == ctx.ws_id);
        if let Some(idx) = idx {
            room_info.users.remove(idx);
        }
        room_info.is_deleted = true;

        let room_info_str = serde_json::to_string(&room_info)?;
        prconn
            .set::<String, String, ()>(format!("room:{room_id}:info"), room_info_str)
            .await?;

        // room update ws publish
        let server_ws_room_update = ServerToClientWsMsg::RoomUpdate {
            room_info: room_info,
        };
        let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
        crate::util::redis::publish(
            ctx.rpool,
            &format!("room:{room_id}"),
            &server_ws_room_update_str,
        )
        .await?;
    } else {
        if room_info.host_user.ws_id == ctx.ws_id {
            // 남은 사용자들중에 인덱스 0 host 지정
            let idx = room_info.users.iter().position(|ru| ru.ws_id == ctx.ws_id);
            if let Some(idx) = idx {
                room_info.users.remove(idx);
            }

            if let Some(new_host) = room_info.users.first() {
                let room_event_host_change = RoomEvents::HostChange {
                    timestamp: OffsetDateTime::now_utc(),
                    before_ws_id: Some(room_info.host_user.ws_id.clone()),
                    after_ws_id: Some(ctx.ws_id.to_string()),
                };
                let room_event_host_change_str = serde_json::to_string(&room_event_host_change)?;
                prconn
                    .rpush::<String, String, ()>(
                        format!("room:{room_id}:events"),
                        room_event_host_change_str,
                    )
                    .await?;

                room_info.host_user = new_host.clone();
            } else {
                tracing::warn!("new host가 없음 문제있음");
            }

            let room_event_user_leave = RoomEvents::UserLeave {
                timestamp: OffsetDateTime::now_utc(),
                ws_id: ctx.ws_id.to_string(),
                user_id: ctx.user_id.to_string(),
                nick_name: ctx.nick_name.to_string(),
            };
            let room_event_user_leave_str = serde_json::to_string(&room_event_user_leave)?;
            prconn
                .rpush::<String, String, ()>(
                    format!("room:{room_id}:events"),
                    room_event_user_leave_str,
                )
                .await?;

            let room_info_str = serde_json::to_string(&room_info)?;
            prconn
                .set::<String, String, ()>(format!("room:{room_id}:info"), room_info_str)
                .await?;

            // room update ws publish
            let server_ws_room_update = ServerToClientWsMsg::RoomUpdate {
                room_info: room_info,
            };
            let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
            crate::util::redis::publish(
                ctx.rpool,
                &format!("room:{room_id}"),
                &server_ws_room_update_str,
            )
            .await?;
        } else {
            // 걍 나간다
            let room_event_user_leave = RoomEvents::UserLeave {
                timestamp: OffsetDateTime::now_utc(),
                ws_id: ctx.ws_id.to_string(),
                user_id: ctx.user_id.to_string(),
                nick_name: ctx.nick_name.to_string(),
            };
            let room_event_user_leave_str = serde_json::to_string(&room_event_user_leave)?;
            prconn
                .rpush::<String, String, ()>(
                    format!("room:{room_id}:events"),
                    room_event_user_leave_str,
                )
                .await?;

            let idx = room_info.users.iter().position(|ru| ru.ws_id == ctx.ws_id);
            if let Some(idx) = idx {
                room_info.users.remove(idx);
            }
            let room_info_str = serde_json::to_string(&room_info)?;
            prconn
                .set::<String, String, ()>(format!("room:{room_id}:info"), room_info_str)
                .await?;

            // room update ws publish
            let server_ws_room_update = ServerToClientWsMsg::RoomUpdate {
                room_info: room_info,
            };
            let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
            crate::util::redis::publish(
                ctx.rpool,
                &format!("room:{room_id}"),
                &server_ws_room_update_str,
            )
            .await?;
        }
    }
    Ok(())
}

pub async fn room_list_fetch(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    let mut prconn = ctx.rpool.get().await?;
    let mut keys = vec![];
    {
        let mut iter = prconn
            .scan_match::<String, String>(format!("room:*:info"))
            .await?;

        while let Some(key) = iter.next_item().await {
            keys.push(key);
        }
    }
    let mut rooms = vec![];
    for key in keys {
        let room_str = prconn.get::<String, String>(key).await?;
        let room = serde_json::from_str::<RoomInfo>(&room_str)?;
        if !room.is_deleted {
            rooms.push(room);
        }
    }

    let server_msg_rooms = ServerToClientWsMsg::RoomListFetch { rooms };
    let server_msg_rooms_str = serde_json::to_string(&server_msg_rooms)?;
    crate::util::redis::publish(
        ctx.rpool,
        &format!("ws_id:{}", ctx.ws_id),
        &server_msg_rooms_str,
    )
    .await?;
    Ok(())
}
