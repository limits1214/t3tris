use std::collections::HashMap;

use crate::{
    colon,
    constant::{TOPIC_LOBBY_VIEWER, TOPIC_WS_ID},
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    ws_world::{
        WsData, lobby,
        model::WsWorldUser,
        pubsub::{WsPubSub, WsWorldUserTopicHandle},
        room,
    },
};

pub fn get_ws_world_info(data: &mut WsData, pubsub: &mut WsPubSub) -> serde_json::Value {
    let pubsub_info = pubsub
        .pubsub
        .iter()
        .map(|(topic, sender)| (topic, sender.receiver_count()))
        .collect::<Vec<_>>();

    let user_topic = pubsub
        .user_topic_handle
        .iter()
        .map(|(ws_id, h)| (ws_id, h.topics.keys().collect::<Vec<_>>()))
        .collect::<Vec<_>>();
    let j = serde_json::json!({
        "users" : data.users.clone(),
        "rooms" : data.rooms.clone(),
        "games": data.games.clone(),
        "pubsub": pubsub_info,
        "lobby": data.lobby.clone(),
        "user_topic": user_topic
    });
    j
}

/// ws 연결시 한번만 수행
pub fn create_user(
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: &str,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
) {
    let user_ws_id = ws_id.to_string();
    data.users.insert(
        user_ws_id.clone(),
        WsWorldUser::Unauthenticated {
            ws_id: user_ws_id.clone(),
        },
    );

    pubsub.user_topic_handle.insert(
        user_ws_id.clone(),
        WsWorldUserTopicHandle {
            sender: ws_sender_tx,
            topics: HashMap::new(),
        },
    );

    // 내 채널 구독
    pubsub.subscribe(&user_ws_id, &colon!(TOPIC_WS_ID, user_ws_id));

    // 로비 뷰어 구독
    pubsub.subscribe(&ws_id, TOPIC_LOBBY_VIEWER);

    // 현재 로비 내용 받기
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

/// ws 해제시 한번만 수행
pub fn delete_user(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    let mut rooms_to_delete = vec![];

    // 해당 ws_id가 참가중인 방을 추린다.
    for (_, room) in data.rooms.iter_mut() {
        if room
            .room_users
            .iter()
            .any(|(_, room_user)| room_user.ws_id == ws_id)
        {
            rooms_to_delete.push(room.room_id.clone());
        }
    }

    // 해당 사용자 방나가기 프로세스 진행
    for room_id in rooms_to_delete {
        room::leave(data, pubsub, ws_id.to_owned(), room_id);
    }

    // 로비 나가기
    if data.lobby.users.get(ws_id).is_some() {
        lobby::lobby_leave(data, pubsub, ws_id);
    }

    pubsub.unsubscribe(&ws_id, TOPIC_LOBBY_VIEWER);
    // pubsub.unsubscribe(&ws_id, TOPIC_LOBBY_VIEWER);
    // pubsub.unsubscribe(&ws_id, TOPIC_LOBBY_PARTICIPANT);

    // 로비 구독해제
    // lobby::lobby_update_unsubscribe(pubsub, ws_id);

    // 사용자를 지운다.
    data.users.remove(ws_id);

    // 중요!, 사용자가 pubsub 사용중인 task handle 을 지워준다.
    if let Some(user_topic_handle) = pubsub.user_topic_handle.get(ws_id) {
        let topics = user_topic_handle.topics.keys().cloned().collect::<Vec<_>>();
        for topic in topics {
            pubsub.unsubscribe(&ws_id, &topic);
        }
    }
    pubsub.user_topic_handle.remove(ws_id);
}

pub fn login_user(
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: &str,
    user_id: &str,
    nick_name: &str,
) {
    data.users.insert(
        ws_id.to_string(),
        WsWorldUser::Authenticated {
            ws_id: ws_id.to_string(),
            user_id: user_id.to_string(),
            nick_name: nick_name.to_string(),
        },
    );

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::UserLogined.to_json(),
    );

    lobby::lobby_enter(data, pubsub, ws_id);
}

pub fn logout_user(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    lobby::lobby_leave(data, pubsub, ws_id);

    data.users.insert(
        ws_id.to_string(),
        WsWorldUser::Unauthenticated {
            ws_id: ws_id.to_string(),
        },
    );

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::UserLogouted.to_json(),
    );
}
