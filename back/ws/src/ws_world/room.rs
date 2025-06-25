use std::{collections::HashMap, time::Instant};

use nanoid::nanoid;
use time::OffsetDateTime;

use crate::{
    colon,
    constant::{TOPIC_LOBBY, TOPIC_ROOM_ID, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{self, ServerToClientWsMsg},
    ws_world::{
        WsData,
        model::{
            AuthStatus, WsWorldGame, WsWorldGameStatus, WsWorldRoom, WsWorldRoomEvent,
            WsWorldRoomStatus, WsWorldRoomUser, WsWorldUser,
        },
        pubsub::WsPubSub,
    },
};

pub fn create(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_name: String) {
    // 방생생하면
    // rooms에 추가
    // enter

    let room_id = nanoid!();
    let room = WsWorldRoom {
        room_id: room_id.clone(),
        room_name,
        room_host_ws_id: Some(ws_id.clone()),
        room_users: HashMap::new(),
        room_events: vec![WsWorldRoomEvent::CreateRoom {
            timestamp: OffsetDateTime::now_utc(),
            create_ws_id: ws_id.clone(),
        }],
        is_deleted: false,
        room_status: WsWorldRoomStatus::Waiting,
    };
    data.rooms.insert(room_id.clone(), room);

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::RoomCreated {
            room_id: room_id.clone(),
        }
        .to_json(),
    );

    // enter(data, pubsub, ws_id, room_id);

    let pub_lobby =
        crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );
}

pub fn enter(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    // 로그인 팝업 푸시
    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(&ws_id)
    else {
        dbg!();
        return;
    };
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };

    //만약 이미 존재하는 ws_id면 취소
    if room
        .room_users
        .iter()
        .any(|(_, room_user)| room_user.ws_id == *ws_id)
    {
        tracing::warn!("room enter ws_id duplicated, room_id: {room_id:?}, ws_id: {ws_id:?}");
        return;
    }

    // enter room
    room.room_users.insert(
        ws_id.clone(),
        WsWorldRoomUser {
            ws_id: ws_id.clone(),
            is_game_ready: false,
        },
    );

    // pubsub.unsubscribe(&ws_id, TOPIC_LOBBY);

    // 방, 방개인 토픽 구독
    pubsub.subscribe(&ws_id, &colon!(TOPIC_ROOM_ID, room_id));
    pubsub.subscribe(&ws_id, &colon!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ws_id));

    // roon enter publish
    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::RoomEntered {
            room_id: room_id.clone(),
        }
        .to_json(),
    );

    // 방에 퍼블리시
    if let Some(pub_room) =
        crate::ws_world::util::gen_room_publish_msg(&data.users, &data.rooms, &room_id)
    {
        pubsub.publish(
            &colon!(TOPIC_WS_ID, ws_id),
            &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
        );
    }

    // 방에 방입장 시스템챗 퍼블리시
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: format!("{} 방 입장", nick_name),
            user: server_to_client_ws_msg::User {
                ws_id: "System".to_owned(),
                user_id: Some("System".to_owned()),
                nick_name: Some("System".to_owned()),
            },
        }
        .to_json(),
    );

    let pub_lobby =
        crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
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
    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(&ws_id)
    else {
        dbg!();
        return;
    };
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };

    //방 나가기
    room.room_users.remove(ws_id);

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::RoomLeaved {
            room_id: room_id.clone(),
        }
        .to_json(),
    );

    // 방에 방퇴장 시스템챗 퍼블리시
    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            user: server_to_client_ws_msg::User {
                user_id: Some("System".to_owned()),
                ws_id: "System".to_owned(),
                nick_name: Some("System".to_owned()),
            },
            msg: format!("{} 방 퇴장", nick_name),
        }
        .to_json(),
    );

    let mut new_host_ws_id = None;
    if room.room_users.is_empty() {
        // 본인이 마지막이면 방파괴

        // room.is_deleted = true;
    } else {
        match &room.room_host_ws_id {
            // 본인이 마지막이 아닌데 호스트라면
            Some(host_ws_id) if host_ws_id == ws_id => {
                // 호스트 체인지
                new_host_ws_id = room
                    .room_users
                    .iter()
                    .next()
                    .map(|(_, room_user)| room_user.ws_id.clone());

                room.room_host_ws_id = new_host_ws_id.clone();
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

    // pubsub.subscribe(&ws_id, TOPIC_LOBBY);

    // 방에 퍼블리시
    if let Some(stc_room) =
        crate::ws_world::util::gen_room_publish_msg(&data.users, &data.rooms, &room_id)
    {
        pubsub.publish(
            &colon!(TOPIC_ROOM_ID, room_id),
            &ServerToClientWsMsg::RoomUpdated { room: stc_room }.to_json(),
        );
    }

    // new host
    if let Some(new_host_ws_id) = &new_host_ws_id {
        if let Some(WsWorldUser {
            ws_id,
            auth: AuthStatus::Authenticated { user_id, nick_name },
            state,
        }) = data.users.get(new_host_ws_id)
        {
            pubsub.publish(
                &colon!(TOPIC_ROOM_ID, room_id),
                &ServerToClientWsMsg::RoomChat {
                    timestamp: OffsetDateTime::now_utc(),
                    user: server_to_client_ws_msg::User {
                        user_id: Some("System".to_owned()),
                        ws_id: "System".to_owned(),
                        nick_name: Some("System".to_owned()),
                    },
                    msg: format!("새로운 방장 {}", nick_name),
                }
                .to_json(),
            );
        }
    }

    let pub_lobby =
        crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );
}

pub fn chat(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String, msg: String) {
    // todo 로그인 팝업
    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(&ws_id)
    else {
        dbg!();
        return;
    };
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };

    pubsub.publish(
        &colon!(TOPIC_ROOM_ID, room_id),
        &ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: msg,
            user: server_to_client_ws_msg::User {
                ws_id: ws_id.clone(),
                user_id: Some(user_id.clone()),
                nick_name: Some(nick_name.clone()),
            },
        }
        .to_json(),
    );
}

pub fn room_game_ready(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };
    let Some((_, room_user)) = room
        .room_users
        .iter_mut()
        .find(|(_, room_user)| room_user.ws_id == ws_id)
    else {
        dbg!();
        return;
    };
    if room.room_status != WsWorldRoomStatus::Waiting {
        tracing::warn!("room_game_start Waiting 인 룸에서만 조작가능");
        return;
    }
    room_user.is_game_ready = true;

    if let Some(pub_room) =
        crate::ws_world::util::gen_room_publish_msg(&data.users, &data.rooms, &room_id)
    {
        pubsub.publish(
            &colon!(TOPIC_ROOM_ID, room_id),
            &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
        );
    }
}

pub fn room_game_unready(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };
    let Some((_, room_user)) = room
        .room_users
        .iter_mut()
        .find(|(_, room_user)| room_user.ws_id == ws_id)
    else {
        dbg!();
        return;
    };
    if room.room_status != WsWorldRoomStatus::Waiting {
        tracing::warn!("room_game_start Waiting 인 룸에서만 조작가능");
        return;
    }
    room_user.is_game_ready = false;

    if let Some(pub_room) =
        crate::ws_world::util::gen_room_publish_msg(&data.users, &data.rooms, &room_id)
    {
        pubsub.publish(
            &colon!(TOPIC_ROOM_ID, room_id),
            &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
        );
    }
}

// host만 실행 가능
pub fn room_game_start(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: String, room_id: String) {
    let Some(room) = data.rooms.get_mut(&room_id) else {
        dbg!();
        return;
    };
    let Some(host_ws_id) = &room.room_host_ws_id else {
        dbg!();
        return;
    };
    if *host_ws_id != ws_id {
        tracing::warn!(
            "host 가 아닌 사용자가 start 조작, room_id:{room_id}, host_ws_id: {host_ws_id}, request_ws_id: {ws_id}"
        );
        return;
    }
    if room.room_status != WsWorldRoomStatus::Waiting {
        tracing::warn!("room_game_start Waiting 인 룸에서만 조작가능");
        return;
    }

    let is_all_ready = room
        .room_users
        .iter()
        .all(|(_, room_user)| room_user.is_game_ready);
    if !is_all_ready {
        tracing::warn!("준비안된 사용자 존재");
        return;
    }

    room.room_status = WsWorldRoomStatus::Gaming;

    let game_id = nanoid!();
    let started = Instant::now();
    let now = Instant::now();
    data.games.insert(
        game_id.clone(),
        WsWorldGame {
            game_id: game_id,
            room_id: room_id.clone(),
            started_at: OffsetDateTime::now_utc(),
            started: started,
            now: now,
            elapsed: now - started,
            delta: now - started,
            status: WsWorldGameStatus::BeforeGameStartTimerThree,
            is_deleted: false,
        },
    );

    if let Some(pub_room) =
        crate::ws_world::util::gen_room_publish_msg(&data.users, &data.rooms, &room_id)
    {
        pubsub.publish(
            &colon!(TOPIC_ROOM_ID, room_id),
            &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
        );
    }
}

pub fn room_cleanup(data: &mut WsData, pubsub: &mut WsPubSub) {
    let mut is_do_cleaning = false;
    data.rooms.iter_mut().for_each(|(_, room)| {
        // TOOD Created 이후 진입전 clean 이되버리는 현상이 발생할수도 있음
        if room.room_users.len() == 0 {
            room.is_deleted = true;
            is_do_cleaning = true;
        }
    });

    if is_do_cleaning {
        let pub_lobby =
            crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
        pubsub.publish(
            TOPIC_LOBBY,
            &ServerToClientWsMsg::LobbyUpdated {
                rooms: pub_lobby.rooms,
                users: pub_lobby.users,
                chats: vec![],
            }
            .to_json(),
        );
    }
}
