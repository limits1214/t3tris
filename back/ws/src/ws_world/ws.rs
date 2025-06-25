use crate::{
    constant::TOPIC_WS_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        WsData,
        connections::{WsConnAuthStatus, WsConnections},
        lobby,
        model::{UserId, WsId, WsWorldUser, WsWorldUserState},
        pubsub::WsPubSub,
        room,
        util::err_publish,
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
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
) {
    // === 커넥션 생성하기
    connections.create(ws_id.clone());

    // === pubsub 생성하기
    pubsub.create_topic_handle(ws_id.clone(), ws_sender_tx);

    // === 개인 구독
    pubsub.subscribe(&ws_id, &topic!(TOPIC_WS_ID, ws_id));
}

/// ws 해제시 한번만 수행
/// create_connection 의 반대로 수행
pub fn delete_connection(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    // === 현재 커넥션이 로그인 유저라면 정리 진행
    if let Some(user) = connections.get_user_by_ws_id(&ws_id, &data.users).cloned() {
        // === 방에 참가한게 있으면 leave 해주기
        let rooms_to_delete = data
            .rooms
            .iter()
            .filter(|(_, room)| {
                room.room_users
                    .iter()
                    .any(|(_, room_user)| room_user.user_id == user.user_id)
            })
            .map(|(room_id, _)| room_id)
            .cloned()
            .collect::<Vec<_>>();
        for room_id in rooms_to_delete {
            room::leave(&connections, data, pubsub, ws_id.clone(), room_id);
        }

        // === 로비 나가기
        lobby::lobby_leave(connections, data, pubsub, ws_id.clone());

        // === data 유저 제거
        data.users.remove(&user.user_id);
    }

    // === pubsub 제거 및 구독중인 모든 토픽 abort
    pubsub.delete_topic_handle(&ws_id);

    // === 커넥션 제거
    connections.remove(&ws_id);
}

/// 로그인은 요청시 N번 가능
pub fn login_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    user_id: UserId,
    nick_name: String,
) {
    // === 이미 로그인했다면 가드, 유저가 없어야한다.
    let None = connections.get_user_by_ws_id(&ws_id, &data.users).cloned() else {
        err_publish(pubsub, &ws_id, dbg!("[login_user] already authenticated"));
        return;
    };

    // === 커넥션 auth state 업데이트
    if let Some(mut conn) = connections.remove(&ws_id) {
        conn.auth_status = WsConnAuthStatus::Authenticated {
            user_id: user_id.clone(),
        };
        connections.insert(ws_id.clone(), conn);

        data.users.insert(
            user_id.clone(),
            WsWorldUser {
                user_id: user_id.clone(),
                nick_name: nick_name.clone(),
                state: WsWorldUserState::Idle,
            },
        );
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::UserLogined,
    );

    // === 로비 진입
    lobby::lobby_enter(connections, data, pubsub, ws_id);
}

pub fn login_failed_user(pubsub: &mut WsPubSub, ws_id: String) {
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::UserLoginFailed,
    );
}

/// 로그아웃 N번가능
pub fn logout_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    // === 유저가 있다면 이미 로그인 되어있는상태고, 없다면 로그인 안되어 있는상태 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id, &data.users).cloned() else {
        err_publish(pubsub, &ws_id, dbg!("[logout_user] not authenticated"));
        return;
    };
    // === 로비 나가기
    lobby::lobby_leave(connections, data, pubsub, ws_id.clone());

    // === 커넥션 auth state 업데이트
    if let Some(mut conn) = connections.remove(&ws_id) {
        conn.auth_status = WsConnAuthStatus::Unauthenticated;
        connections.insert(ws_id.clone(), conn);

        data.users.remove(&user.user_id);
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::UserLogouted,
    );
}
