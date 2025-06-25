use crate::{
    constant::{TOPIC_LOBBY, TOPIC_WS_ID},
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        WsData,
        connections::{WsConnAuthStatus, WsConnections, WsWorldConnection},
        lobby,
        model::{UserId, WsId, WsWorldUser, WsWorldUserState},
        pubsub::WsPubSub,
        room,
    },
};

pub fn get_ws_world_info(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
) -> serde_json::Value {
    let pubsub_info = pubsub.get_pubsub_info();

    let user_topic = pubsub.get_user_topics();

    let j = serde_json::json!({
        "users" : data.users.clone(),
        "rooms" : data.rooms.clone(),
        "games": data.games.clone(),
        "pubsub": pubsub_info,
        "connections": connections.clone(),
        "user_topic": user_topic
    });
    j
}

/// ws 연결시 한번만 수행
pub fn create_connection(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
) {
    connections.create(ws_id.clone());

    pubsub.create_topic_handle(ws_id.clone(), ws_sender_tx);

    // 내 채널 구독
    pubsub.subscribe(&ws_id, &topic!(TOPIC_WS_ID, ws_id));

    // 현재 로비 내용 받기
    let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );
}

/// ws 해제시 한번만 수행
pub fn delete_connection(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    let user = connections.get_user_by_ws_id(&ws_id, data).cloned();

    // 로그인한 유저라면
    if let Some(user) = user {
        let mut rooms_to_delete = vec![];
        // 해당 ws_id가 참가중인 방을 추린다.
        for (_, room) in data.rooms.iter_mut() {
            if room
                .room_users
                .iter()
                .any(|(_, room_user)| room_user.user_id == user.user_id)
            {
                rooms_to_delete.push(room.room_id.clone());
            }
        }
        // 해당 사용자 방나가기 프로세스 진행
        for room_id in rooms_to_delete {
            room::leave(&connections, data, pubsub, ws_id.clone(), room_id);
        }

        // 로비 나가기
        lobby::lobby_leave(connections, data, pubsub, ws_id.clone());

        // data 에서 유저 제거
        data.users.remove(&user.user_id);
    }

    connections.remove(&ws_id);

    // 중요!, 사용자가 pubsub 사용중인 task handle 을 지워준다.
    pubsub.delete_topic_handle(&ws_id);
}

pub fn login_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    user_id: UserId,
    nick_name: String,
) {
    // 인증된 상태라면 로그인 취소
    if let Some(WsWorldConnection {
        auth_status: WsConnAuthStatus::Authenticated { .. },
        ..
    }) = connections.get(&ws_id)
    {
        let msg = "login fail, User Ws Is already authenticated".to_string();
        pubsub.publish(
            &topic!(TOPIC_WS_ID, ws_id),
            &ServerToClientWsMsg::Echo { msg: msg.clone() }.to_json(),
        );
        dbg!(msg);
        return;
    };

    let conn = connections.remove(&ws_id);
    if let Some(mut conn) = conn {
        // connection Authenticated 로 업데이트
        conn.auth_status = WsConnAuthStatus::Authenticated {
            user_id: user_id.clone(),
        };
        connections.insert(ws_id.clone(), conn);

        // data 에 user 넣어주기
        data.users.insert(
            user_id.clone(),
            WsWorldUser {
                user_id: user_id.clone(),
                nick_name: nick_name.clone(),
                state: WsWorldUserState::Idle,
            },
        );
    }

    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::UserLogined.to_json(),
    );

    lobby::lobby_enter(connections, data, pubsub, ws_id);
}

pub fn login_failed_user(pubsub: &mut WsPubSub, ws_id: String) {
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::UserLoginFailed.to_json(),
    );
}

pub fn logout_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    lobby::lobby_leave(connections, data, pubsub, ws_id.clone());

    let user_id = {
        let Some(WsWorldConnection {
            auth_status: WsConnAuthStatus::Authenticated { user_id },
            ..
        }) = connections.get(&ws_id)
        else {
            let msg = "logout fail user is not authenticated".to_string();
            pubsub.publish(
                &topic!(TOPIC_WS_ID, ws_id),
                &ServerToClientWsMsg::Echo { msg: msg.clone() }.to_json(),
            );
            dbg!(msg);
            return;
        };
        user_id.clone()
    };

    let conn = connections.remove(&ws_id);
    if let Some(mut conn) = conn {
        // connection Authenticated 로 업데이트

        conn.auth_status = WsConnAuthStatus::Unauthenticated;
        connections.insert(ws_id.clone(), conn);

        // data 에 user 제거
        data.users.remove(&user_id);
    }

    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::UserLogouted.to_json(),
    );
    //TODO
    let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );
}
