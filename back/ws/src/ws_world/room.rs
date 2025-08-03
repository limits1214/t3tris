use std::{collections::HashMap, time::Instant};

use nanoid::nanoid;
use time::OffsetDateTime;

use crate::{
    constant::{TOPIC_LOBBY, TOPIC_ROOM_ID, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{self, ServerToClientWsMsg},
    topic,
    ws_world::{
        WsData,
        connections::{WsConnections, WsWorldUser},
        game::tetris::{BoardEndKind, TetrisGame, TetrisGameActionType},
        model::{
            GameId, RoomId, WsId, WsWorldGame, WsWorldGameStatus, WsWorldGameType, WsWorldRoom,
            WsWorldRoomStatus, WsWorldRoomUser,
        },
        pubsub::WsPubSub,
        util::{err_publish, gen_lobby_publish_msg, gen_room_publish_msg},
    },
};

pub fn create(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_name: String,
) {
    // === 유저 가드
    let Some(_) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room create] not authenticated"));
        return;
    };

    // === 방 생성
    let room_id = RoomId(nanoid!());
    let room = WsWorldRoom {
        room_id: room_id.clone(),
        room_name,
        room_host_ws_id: Some(ws_id.clone()),
        room_users: HashMap::new(),
        room_events: vec![],
        is_deleted: false,
        room_status: WsWorldRoomStatus::Waiting,
        games: vec![],
        game_type: WsWorldGameType::MultiScore,
    };
    data.rooms.insert(room_id.clone(), room);

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::RoomCreated {
            room_id: room_id.into(),
        },
    );

    // === 로비 메시지 발행
    let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );
}

pub fn enter(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room enter] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room enter] room is not exists"));
        return;
    };

    // === 유저 중복 체크
    if room
        .room_users
        .iter()
        .any(|(_, room_user)| room_user.user_id == user.user_id)
    {
        err_publish(
            pubsub,
            &ws_id,
            dbg!(&format!(
                "[room enter] user is dup, user_id:{:?}",
                user.user_id
            )),
        );
    }

    // === 방, 방개인 구독
    pubsub.subscribe(&ws_id, &topic!(TOPIC_ROOM_ID, room_id));
    pubsub.subscribe(&ws_id, &topic!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ws_id));

    // === 방 진입
    room.room_users.insert(
        ws_id.clone(),
        WsWorldRoomUser {
            ws_id: ws_id.clone(),
            is_game_ready: true,
            user_id: user.user_id.clone(),
        },
    );

    // 입장시 방장 없으면 내가 방장
    if room.room_host_ws_id.is_none() {
        room.room_host_ws_id = Some(ws_id.clone());
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::RoomEntered {
            room_id: room_id.clone().into(),
        },
    );

    // === 룸 메시지 발행 - 룸상세
    if let Some(pub_room) = gen_room_publish_msg(&connections, &data.rooms, &room_id) {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, room_id),
            ServerToClientWsMsg::RoomUpdated { room: pub_room },
        );
    }

    // === 방 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, room_id),
        ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: format!("{} 방 입장", user.nick_name),
            user: server_to_client_ws_msg::User {
                user_id: "System".to_owned(),
                nick_name: "System".to_owned(),
                ws_id: "System".to_owned(),
            },
        },
    );

    // === 로비 메시지 발행
    let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );
}

pub fn leave(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room leave] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room leave] room is not exists"));
        return;
    };

    // === 방 유저 나가기
    room.room_users.remove(&ws_id);

    // === 방 나가는데 내가 host 였다면 마지막 user의 첫번째 host로 올려주기
    let new_host_ws_id = match &room.room_host_ws_id {
        Some(new_host_ws_id) if *new_host_ws_id == ws_id => {
            let new_host_ws_id = room
                .room_users
                .iter()
                .next()
                .map(|(_, room_user)| room_user.ws_id.clone());

            room.room_host_ws_id = new_host_ws_id.clone();

            new_host_ws_id
        }
        _ => None,
    };

    // === 만약 방장 바뀌었으면 바뀌었다고 방 메시지 발행
    if let Some(new_host_ws_id) = &new_host_ws_id {
        if let Some(WsWorldUser { nick_name, .. }) = connections.get_user_by_ws_id(new_host_ws_id) {
            pubsub.publish(
                &topic!(TOPIC_ROOM_ID, room_id),
                ServerToClientWsMsg::RoomChat {
                    timestamp: OffsetDateTime::now_utc(),
                    user: server_to_client_ws_msg::User {
                        user_id: "System".to_owned(),
                        nick_name: "System".to_owned(),
                        ws_id: "System".to_owned(),
                    },
                    msg: format!("새로운 방장 {}", nick_name),
                },
            );
        }
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::RoomLeaved {
            room_id: room_id.clone().into(),
        },
    );

    // === 방 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, room_id),
        ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            user: server_to_client_ws_msg::User {
                user_id: "System".to_owned(),
                nick_name: "System".to_owned(),
                ws_id: "System".to_owned(),
            },
            msg: format!("{} 방 퇴장", user.nick_name),
        },
    );

    // === 게임중이라면 나가기 처리
    if let Some(last_game_id) = room.games.last() {
        if let Some(game) = data.games.get_mut(last_game_id) {
            if let Some(tetris) = game.tetries.get_mut(&ws_id) {
                tetris.is_board_end = true;
                tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                    kind: BoardEndKind::Exit,
                    elapsed: tetris.elapsed,
                });
                tetris.board_reset();
            }
        }
    }

    // === 방 메시지 발행
    if let Some(stc_room) = gen_room_publish_msg(connections, &data.rooms, &room_id) {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, room_id),
            ServerToClientWsMsg::RoomUpdated { room: stc_room },
        );
    }

    // === 로비 메시지 발행
    let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );

    // === 방, 방 개인 구독 해제
    pubsub.unsubscribe(&ws_id, &topic!(TOPIC_ROOM_ID, room_id));
    pubsub.unsubscribe(&ws_id, &topic!(TOPIC_ROOM_ID, room_id, TOPIC_WS_ID, ws_id));
}

pub fn chat(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
    msg: String,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room chat] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(_) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room chat] room is not exists"));
        return;
    };

    // === 방 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, room_id),
        ServerToClientWsMsg::RoomChat {
            timestamp: OffsetDateTime::now_utc(),
            msg: msg,
            user: server_to_client_ws_msg::User {
                user_id: user.user_id.clone().into(),
                nick_name: user.nick_name.clone(),
                ws_id: ws_id.into(),
            },
        },
    );
}

pub fn room_game_ready(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] room is not exists"));
        return;
    };

    // === 방상태가 레디 박을수 있는지 체크
    if room.room_status != WsWorldRoomStatus::Waiting {
        err_publish(pubsub, &ws_id, dbg!("[room_gamey] room not waiting"));
        return;
    }

    // === 방 유저를 가져오는 가드
    let Some((_, room_user)) = room
        .room_users
        .iter_mut()
        .find(|(_, room_user)| room_user.user_id == user.user_id)
    else {
        err_publish(pubsub, &ws_id, dbg!("[room_gamey] room user not exists"));
        return;
    };

    // === 레디!
    room_user.is_game_ready = true;

    // === 방 메시지 발행
    if let Some(pub_room) = gen_room_publish_msg(connections, &data.rooms, &room_id) {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, room_id),
            ServerToClientWsMsg::RoomUpdated { room: pub_room },
        );
    }
}

pub fn room_game_unready(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] room is not exists"));
        return;
    };

    // === 방상태가 언레디 박을수 있는지 가드
    if room.room_status != WsWorldRoomStatus::Waiting {
        err_publish(pubsub, &ws_id, dbg!("[room_gamey] room not waiting"));
        return;
    }

    // === 방 유저를 가져오는 가드
    let Some((_, room_user)) = room
        .room_users
        .iter_mut()
        .find(|(_, room_user)| room_user.user_id == user.user_id)
    else {
        err_publish(pubsub, &ws_id, dbg!("[room_gamey] room user not exists"));
        return;
    };

    // === 언레디
    room_user.is_game_ready = false;

    // === 방 메시지 발행
    if let Some(pub_room) = gen_room_publish_msg(connections, &data.rooms, &room_id) {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, room_id),
            ServerToClientWsMsg::RoomUpdated { room: pub_room },
        );
    }
}

pub fn room_game_type_change(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
    game_type: String,
) {
    // === 유저 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(
            pubsub,
            &ws_id,
            dbg!("[room_game_type_change] not authenticated"),
        );
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(
            pubsub,
            &ws_id,
            dbg!("[room_game_type_change] room is not exists"),
        );
        return;
    };

    // === 방 Waiting 인지 체크
    if room.room_status != WsWorldRoomStatus::Waiting {
        err_publish(
            pubsub,
            &ws_id,
            dbg!("[room_game_type_change] room not waiting"),
        );
        return;
    }

    // === 유저 방장 체크
    if room
        .room_host_ws_id
        .as_ref()
        .filter(|host_id| *host_id == &ws_id)
        .is_none()
    {
        err_publish(
            pubsub,
            &ws_id,
            "[room_game_type_change] you're not the host",
        );
        return;
    }

    // === 게임 타입 체인지
    match serde_json::from_str::<WsWorldGameType>(&format!("\"{game_type}\"")) {
        Ok(new_game_type) => {
            room.game_type = new_game_type;
            if let Some(pub_room) = gen_room_publish_msg(connections, &data.rooms, &room_id) {
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, room_id),
                    ServerToClientWsMsg::RoomUpdated { room: pub_room },
                );
            }
            let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
            pubsub.publish(
                &topic!(TOPIC_LOBBY),
                ServerToClientWsMsg::LobbyUpdated {
                    rooms: pub_lobby.rooms,
                    users: pub_lobby.users,
                    chats: vec![],
                },
            );
        }
        Err(_) => {
            err_publish(
                pubsub,
                &ws_id,
                dbg!("[room_game_type_change] game_type string err, "),
            );
            return;
        }
    }
}

/// 방장만 실행 가능
pub fn room_game_start(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
) {
    // === 유저 가드
    let Some(_) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] not authenticated"));
        return;
    };

    // === 방 가드
    let Some(room) = data.rooms.get_mut(&room_id) else {
        err_publish(pubsub, &ws_id, dbg!("[room_game_ready] room is not exists"));
        return;
    };

    // === 방장 가드
    if room
        .room_host_ws_id
        .as_ref()
        .filter(|host_id| *host_id == &ws_id)
        .is_none()
    {
        err_publish(pubsub, &ws_id, "[room_game_ready] you're not the host");
        return;
    }

    // === 방상태가 언레디 박을수 있는지 가드
    if room.room_status != WsWorldRoomStatus::Waiting {
        err_publish(pubsub, &ws_id, dbg!("[room_gamey] room not waiting"));
        return;
    }

    // === 방 유저 전부 레디 했는지 가드
    let is_all_ready = room
        .room_users
        .iter()
        .all(|(_, room_user)| room_user.is_game_ready);
    if !is_all_ready {
        tracing::warn!("준비안된 사용자 존재");
        return;
    }

    // === 방 상태 변경
    room.room_status = WsWorldRoomStatus::Gaming;

    let mut tetries = HashMap::new();

    for (_, room_user) in &room.room_users {
        //
        let nick_name = connections
            .get_user_by_ws_id(&room_user.ws_id)
            .map(|a| a.nick_name.clone())
            .unwrap_or("X".to_string());
        tetries.insert(
            room_user.ws_id.clone(),
            TetrisGame::new(
                room_user.ws_id.clone(),
                room_user.user_id.clone(),
                nick_name,
            ),
        );
    }

    // === 게임 추가
    let game_id = GameId(nanoid!());
    room.games.push(game_id.clone());

    let started = Instant::now();
    let now = Instant::now();
    data.games.insert(
        game_id.clone(),
        WsWorldGame {
            game_type: room.game_type.clone(),
            game_id: game_id,
            room_id: room_id.clone(),
            started_at: OffsetDateTime::now_utc(),
            started: started,
            now: now,
            elapsed: now - started,
            delta: now - started,
            status: WsWorldGameStatus::Wait,
            is_deleted: false,
            tetries,
            result: None,
        },
    );

    // === 방 메시지 발행
    if let Some(pub_room) = gen_room_publish_msg(connections, &data.rooms, &room_id) {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, room_id),
            ServerToClientWsMsg::RoomUpdated { room: pub_room },
        );
    }

    // === 로비 메시지 발행
    let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );
}

// 유저 없는 방 제거
pub fn room_cleanup(connections: &WsConnections, data: &mut WsData, pubsub: &mut WsPubSub) {
    let mut is_do_cleaning = false;
    data.rooms.iter_mut().for_each(|(_, room)| {
        // TOOD Created 이후 진입전 clean 이되버리는 현상이 발생할수도 있음
        if !room.is_deleted && room.room_users.len() == 0 {
            room.is_deleted = true;
            is_do_cleaning = true;
        }
    });

    if is_do_cleaning {
        let pub_lobby = gen_lobby_publish_msg(connections, &data.rooms);
        pubsub.publish(
            &topic!(TOPIC_LOBBY),
            ServerToClientWsMsg::LobbyUpdated {
                rooms: pub_lobby.rooms,
                users: pub_lobby.users,
                chats: vec![],
            },
        );
    }
}
