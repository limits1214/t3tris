use nanoid::nanoid;
use time::OffsetDateTime;

use crate::{
    colon,
    constant::{TOPIC_ROOM_ID, TOPIC_ROOM_LIST_UPDATE, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{self, ServerToClientWsMsg},
    ws_world::{
        WsData,
        model::{WsWorldRoom, WsWorldRoomEvent},
        pubsub::WsPubSub,
    },
};

pub fn create(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_name: String) {
    // 방생생하면
    // rooms에 추가
    // enter

    let room = WsWorldRoom {
        room_id: nanoid!(),
        room_name,
        room_host_ws_id: Some(ws_id.clone()),
        room_ws_ids: vec![],
        room_events: vec![WsWorldRoomEvent::CreateRoom {
            timestamp: OffsetDateTime::now_utc(),
            create_ws_id: ws_id.clone(),
        }],
        is_deleted: false,
    };
    data.rooms.push(room.clone());

    enter(data, pubsub, ws_id, room.room_id);
}

pub fn enter(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    let Some(user) = data.users.iter().find(|u| u.ws_id == ws_id).cloned() else {
        dbg!();
        return;
    };
    let Some(room_idx) = data.rooms.iter().position(|u| u.room_id == room_id) else {
        dbg!();
        return;
    };
    if let Some(room) = data.rooms.get_mut(room_idx) {
        //만약 이미 존재하는 ws_id면 취소
        let exists = room.room_ws_ids.iter().find(|r_ws_id| *r_ws_id == &ws_id);
        if exists.is_some() {
            tracing::warn!("room enter ws_id duplicated, room_id: {room_id:?}, ws_id: {ws_id:?}");
            return;
        }

        // enter room
        room.room_ws_ids.push(ws_id.clone());

        // event push
        room.room_events.push(WsWorldRoomEvent::UserEnter {
            timestamp: OffsetDateTime::now_utc(),
            ws_id: user.ws_id.clone(),
            user_id: user.user_id.clone(),
            nick_name: user.nick_name.clone(),
        });
        // event push
        room.room_events.push(WsWorldRoomEvent::SystemChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: format!("{} 방 입장", user.nick_name),
        });
    }

    // 방, 방개인 토픽 구독
    pubsub.subscribe(&ws_id, &colon!(TOPIC_ROOM_ID, room_id));
    pubsub.subscribe(&ws_id, &colon!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ws_id));
    // 개인 토픽에 현재 방 퍼블리시
    let Some(stc_room) = crate::ws_world::util::gen_json_room(data, &room_id) else {
        dbg!();
        return;
    };
    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::RoomUpdated { room: stc_room }.to_json(),
    );

    // 방에 방입장 시스템챗 퍼블리시
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: format!("{} 방 입장", user.nick_name),
            user: server_to_client_ws_msg::User {
                user_id: "System".to_owned(),
                ws_id: "System".to_owned(),
                nick_name: "System".to_owned(),
            },
        }
        .to_json(),
    );

    // 방목록 토픽에게 방목록 퍼블리시
    let stc_room_list = crate::ws_world::util::gen_json_room_list(data);
    pubsub.publish(
        TOPIC_ROOM_LIST_UPDATE,
        &ServerToClientWsMsg::RoomListUpdated {
            rooms: stc_room_list,
        }
        .to_json(),
    );
}

// 나갈때
// 본인이 마지막 사람이다. => 방파괴
// 마지막 사람은 아니면서
//  호스트이다 => ws_id에 첫번째 호스트로 올림
//  호스트가 아니다 => 걍 나가셈
pub fn leave(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    let Some(user) = data.users.iter().find(|u| u.ws_id == ws_id).cloned() else {
        dbg!();
        return;
    };

    let Some(room) = data.rooms.iter_mut().find(|u| u.room_id == room_id) else {
        dbg!();
        return;
    };
    let Some(room_idx) = room.room_ws_ids.iter().position(|u| *u == ws_id) else {
        dbg!();
        return;
    };

    //방 나가기
    room.room_ws_ids.remove(room_idx);
    // eventpush
    room.room_events.push(WsWorldRoomEvent::UserLeave {
        timestamp: OffsetDateTime::now_utc(),
        ws_id: user.ws_id.clone(),
        user_id: user.user_id.clone(),
        nick_name: user.nick_name.clone(),
    });
    // eventpush
    room.room_events.push(WsWorldRoomEvent::SystemChat {
        timestamp: OffsetDateTime::now_utc(),
        msg: format!("{} 방 퇴장", user.nick_name),
    });
    // 방에 방퇴장 시스템챗 퍼블리시
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            user: server_to_client_ws_msg::User {
                user_id: "System".to_owned(),
                ws_id: "System".to_owned(),
                nick_name: "System".to_owned(),
            },
            msg: format!("{} 방 퇴장", user.nick_name),
        }
        .to_json(),
    );

    let mut new_host = None;
    if room.room_ws_ids.is_empty() {
        // 본인이 마지막이면 방파괴
        room.room_events.push(WsWorldRoomEvent::DestroyedRoom {
            timestamp: OffsetDateTime::now_utc(),
        });
        room.is_deleted = true;
    } else {
        match &room.room_host_ws_id {
            // 본인이 마지막이 아닌데 호스트라면
            Some(host_ws_id) if *host_ws_id == ws_id => {
                // 호스트 체인지
                new_host = room.room_ws_ids.first().cloned();
                room.room_events.push(WsWorldRoomEvent::HostChange {
                    timestamp: OffsetDateTime::now_utc(),
                    before_ws_id: room.room_host_ws_id.clone(),
                    after_ws_id: new_host.clone(),
                });
                room.room_host_ws_id = new_host.clone();
            }
            // 본인이 마지막도 아니고, 호스트도 아님
            _ => {
                // 나가
            }
        }
    }

    // 해당 방, 방개인 구독 해제
    pubsub.unsubscribe(&ws_id, &colon!(TOPIC_ROOM_ID, room_id));
    pubsub.unsubscribe(
        &ws_id.clone(),
        &colon!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ws_id),
    );

    // 방에 퍼블리시
    let Some(stc_room) = crate::ws_world::util::gen_json_room(data, &room_id) else {
        return;
    };
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomUpdated { room: stc_room }.to_json(),
    );

    // new host
    if let Some(new_host) = new_host {
        if let Some(user) = data.users.iter().find(|u| u.ws_id == new_host) {
            pubsub.publish(
                &colon!(TOPIC_ROOM_ID, room_id),
                &ServerToClientWsMsg::RoomChat {
                    timestamp: OffsetDateTime::now_utc(),
                    user: server_to_client_ws_msg::User {
                        user_id: "System".to_owned(),
                        ws_id: "System".to_owned(),
                        nick_name: "System".to_owned(),
                    },
                    msg: format!("새로운 방장 {}", user.nick_name),
                }
                .to_json(),
            );
        };
    }

    // 방목록 토픽에게 방목록 퍼블리시
    let stc_room_list = crate::ws_world::util::gen_json_room_list(data);
    pubsub.publish(
        TOPIC_ROOM_LIST_UPDATE,
        &ServerToClientWsMsg::RoomListUpdated {
            rooms: stc_room_list,
        }
        .to_json(),
    );
}

pub fn chat(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String, msg: String) {
    let Some(user) = data.users.iter().find(|u| u.ws_id == ws_id).cloned() else {
        dbg!();
        return;
    };

    // 채팅
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: msg,
            user: server_to_client_ws_msg::User {
                user_id: user.user_id.clone(),
                ws_id: user.ws_id.clone(),
                nick_name: user.nick_name.clone(),
            },
        }
        .to_json(),
    );
}

pub fn room_list_subscribe(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String) {
    pubsub.subscribe(&ws_id, TOPIC_ROOM_LIST_UPDATE);

    // 방목록 토픽에게 방목록 퍼블리시
    let stc_room_list = crate::ws_world::util::gen_json_room_list(data);
    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::RoomListUpdated {
            rooms: stc_room_list,
        }
        .to_json(),
    );
}

pub fn room_list_unsubscribe(pubsub: &mut WsPubSub, ws_id: String) {
    pubsub.unsubscribe(&ws_id, TOPIC_ROOM_LIST_UPDATE);
}
