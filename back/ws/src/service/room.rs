use crate::{
    colon,
    constant::{
        KEY_EVENTS, KEY_INFO, KEY_ROOM, TOPIC_ROOM_ID, TOPIC_ROOM_LIST_UPDATE, TOPIC_WS_ID,
    },
    model::{
        WsRecvCtx,
        room::{RoomChat, RoomEvents, RoomInfo, RoomUser},
        ws_msg::ServerToClientWsMsg,
    },
};
use nanoid::nanoid;
use redis::AsyncCommands;
use time::OffsetDateTime;

/// 방생성
pub async fn process_room_create(ctx: &mut WsRecvCtx<'_>, room_name: &str) -> anyhow::Result<()> {
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
        .set::<String, String>(colon!(KEY_ROOM, room_id, KEY_INFO), room_info_str)
        .rpush::<String, String>(colon!(KEY_ROOM, room_id, KEY_EVENTS), room_event_create_str)
        .rpush::<String, String>(colon!(KEY_ROOM, room_id, KEY_EVENTS), room_event_enter_str)
        .query_async::<()>(&mut rconn)
        .await?;

    crate::service::ws::subscribe_topic(ctx, &colon!(TOPIC_ROOM_ID, &room_id)).await?;
    crate::service::ws::subscribe_topic(
        ctx,
        &colon!(TOPIC_ROOM_ID, &room_id, TOPIC_WS_ID, ctx.ws_id),
    )
    .await?;

    let room_chat_list = query_room_chat_list(ctx, &room_id).await?;
    let pubmsg = ServerToClientWsMsg::RoomEnter {
        room_info: room_info,
        chats: room_chat_list,
    };
    let pubmsg_str = serde_json::to_string(&pubmsg)?;
    crate::util::redis::publish(ctx.rpool, &colon!(TOPIC_WS_ID, ctx.ws_id), &pubmsg_str).await?;

    // 방목록 퍼블리시
    let rooms = query_room_list(ctx).await?;
    publish_topic_room_list_update(ctx, TOPIC_ROOM_LIST_UPDATE, rooms).await?;
    Ok(())
}

pub async fn proess_room_chat(
    ctx: &mut WsRecvCtx<'_>,
    room_id: &str,
    msg: &str,
) -> anyhow::Result<()> {
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

    let room_chats = RoomChat {
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
        &colon!(TOPIC_ROOM_ID, room_id),
        &server_msg_room_chat_str,
    )
    .await?;
    Ok(())
}

pub async fn process_room_enter(ctx: &mut WsRecvCtx<'_>, room_id: &str) -> anyhow::Result<()> {
    //만약 ws_id가 같으면 입장 x
    let room_info = query_room(ctx, room_id).await?;
    if let Some(room_info) = room_info {
        let ru = room_info.users.iter().find(|u| u.ws_id == ctx.ws_id);
        if ru.is_some() {
            tracing::warn!("이미 존재하는 ws_id");
            return Ok(());
        }
    }

    crate::service::ws::subscribe_topic(ctx, &colon!(TOPIC_ROOM_ID, room_id)).await?;
    crate::service::ws::subscribe_topic(
        ctx,
        &colon!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ctx.ws_id),
    )
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
    let server_ws_room_update = ServerToClientWsMsg::RoomUpdated {
        room_info: room_info,
    };
    let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
    crate::util::redis::publish(
        ctx.rpool,
        &colon!(TOPIC_ROOM_ID, room_id),
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

    // 방목록 퍼블리시
    let rooms = query_room_list(ctx).await?;
    publish_topic_room_list_update(ctx, TOPIC_ROOM_LIST_UPDATE, rooms).await?;
    Ok(())
}

// 나갈때,
// 내가 나가면 인원이 0이될때, 방을 파괴한다.
// 내가 나가도 인원이 0이 안되면서 본인이 host이면, 남은 유저들중에 인덱스 0을 host를 지정하고 users 빼고 나간다
// 내가 나가도 인원이 0이 안되면서 본인이 host가 아니면 users 빼고 나간다.
pub async fn process_room_leave(ctx: &mut WsRecvCtx<'_>, room_id: &str) -> anyhow::Result<()> {
    crate::service::ws::unsubscribe_topic(ctx, &colon!(TOPIC_ROOM_ID, room_id)).await?;
    crate::service::ws::unsubscribe_topic(
        ctx,
        &colon!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ctx.ws_id),
    )
    .await?;

    let mut prconn = ctx.rpool.get().await?;

    // lock 걸기
    let lock = loop {
        tracing::info!("try acqurid lock");
        let lock = crate::util::redis::acquire_lock(
            &mut prconn,
            "lock_key",
            std::time::Duration::from_secs(3),
        )
        .await?;
        if let Some(lock) = lock {
            tracing::info!("lock: {lock}");
            break lock;
        } else {
            tracing::info!("lock sleep!");
            tokio::time::sleep(std::time::Duration::from_millis(1)).await;
        }
    };

    let room_info_str = prconn
        .get::<String, String>(format!("room:{room_id}:info"))
        .await?;
    let mut room_info = serde_json::from_str::<RoomInfo>(&room_info_str)?;
    tracing::info!("room info users len {}", room_info.users.len());
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
        let server_ws_room_update = ServerToClientWsMsg::RoomUpdated {
            room_info: room_info,
        };
        let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
        crate::util::redis::publish(
            ctx.rpool,
            &colon!(TOPIC_ROOM_ID, room_id),
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
            let server_ws_room_update = ServerToClientWsMsg::RoomUpdated {
                room_info: room_info,
            };
            let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
            crate::util::redis::publish(
                ctx.rpool,
                &colon!(TOPIC_ROOM_ID, room_id),
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
            let server_ws_room_update = ServerToClientWsMsg::RoomUpdated {
                room_info: room_info,
            };
            let server_ws_room_update_str = serde_json::to_string(&server_ws_room_update)?;
            crate::util::redis::publish(
                ctx.rpool,
                &colon!(TOPIC_ROOM_ID, room_id),
                &server_ws_room_update_str,
            )
            .await?;
        }
    }

    // lock 해제
    crate::util::redis::release_lock(&mut prconn, "lock_key", &lock).await?;
    tracing::info!("lock released!");

    // 방목록 퍼블리시
    let rooms = query_room_list(ctx).await?;
    publish_topic_room_list_update(ctx, TOPIC_ROOM_LIST_UPDATE, rooms).await?;

    Ok(())
}

pub async fn asd(ctx: &mut WsRecvCtx<'_>) {
    // let a= ctx.rpool.get().await?;
}

// 룸 리스트 조회
pub async fn process_room_list_fetch(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    let rooms = query_room_list(ctx).await?;

    let server_msg_rooms = ServerToClientWsMsg::RoomListFetch { rooms };
    let server_msg_rooms_str = serde_json::to_string(&server_msg_rooms)?;
    crate::util::redis::publish(
        ctx.rpool,
        &colon!(TOPIC_WS_ID, ctx.ws_id),
        &server_msg_rooms_str,
    )
    .await?;
    Ok(())
}

// 본인 ws_id로 현재 룸현황 보내주고
// room_list_update 구독시켜준다.
pub async fn process_room_list_update_subscribe(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    let rooms = query_room_list(ctx).await?;

    // 룸현황 본인에게 보내주기
    publish_topic_room_list_update(ctx, &colon!(TOPIC_WS_ID, ctx.ws_id), rooms).await?;

    // 룸리스트업데이트 토픽 구독
    crate::service::ws::subscribe_topic(ctx, TOPIC_ROOM_LIST_UPDATE).await?;
    Ok(())
}

pub async fn process_room_list_update_unsubscribe(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    crate::service::ws::unsubscribe_topic(ctx, TOPIC_ROOM_LIST_UPDATE).await?;
    Ok(())
}

async fn publish_topic_room_list_update(
    ctx: &mut WsRecvCtx<'_>,
    topic: &str,
    rooms: Vec<RoomInfo>,
) -> anyhow::Result<()> {
    let msg = ServerToClientWsMsg::RoomListUpdated { rooms };
    let msg_str = serde_json::to_string(&msg)?;
    crate::util::redis::publish(ctx.rpool, &topic, &msg_str).await?;
    Ok(())
}

// 룸 목록 쿼리
async fn query_room_list(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<Vec<RoomInfo>> {
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

    Ok(rooms)
}

async fn query_room(ctx: &mut WsRecvCtx<'_>, room_id: &str) -> anyhow::Result<Option<RoomInfo>> {
    let mut prconn = ctx.rpool.get().await?;
    let room_str = prconn
        .get::<String, Option<String>>(colon!(KEY_ROOM, room_id, KEY_INFO))
        .await?;
    if let Some(room_str) = room_str {
        let room_info = serde_json::from_str::<RoomInfo>(&room_str)?;
        Ok(Some(room_info))
    } else {
        Ok(None)
    }
}

async fn query_room_chat_list(
    ctx: &mut WsRecvCtx<'_>,
    room_id: &str,
) -> anyhow::Result<Vec<RoomChat>> {
    let mut prconn = ctx.rpool.get().await?;
    let chat_str_list = prconn
        .lrange::<String, Vec<String>>(colon!(KEY_ROOM, room_id, "chats"), 0, -1)
        .await?;

    let chats = chat_str_list
        .into_iter()
        .filter_map(|s| serde_json::from_str::<RoomChat>(&s).ok())
        .collect();

    Ok(chats)
}
