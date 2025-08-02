use std::time::{Duration, Instant};

use crate::{
    constant::TOPIC_WS_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        WsData,
        connections::{WsConnAuth, WsConnections, WsWorldUser},
        lobby,
        model::{UserId, WsId},
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
        "rooms" : data.rooms.clone(),
        "games": data.games.clone(),
        "pubsub": pubsub_info,
        "connections": connections.clone(),
        "user_topic": user_topic
    });
    j
}

/// ws 연결시 한번만 수행
pub fn init_ws(
    connections: &mut WsConnections,
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    ws_close_tx: tokio::sync::watch::Sender<()>,
) {
    // === 커넥션 생성하기
    connections.conn_create(ws_id.clone(), ws_close_tx);

    // === pubsub 생성하기
    pubsub.create_topic_handle(ws_id.clone(), ws_sender_tx);

    // === 개인 구독
    pubsub.subscribe(&ws_id, &topic!(TOPIC_WS_ID, ws_id));
}

/// ws 해제시 한번만 수행
/// create_connection 의 반대로 수행
pub fn cleanup_ws(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    // === 현재 커넥션이 로그인 유저라면 정리 진행
    if let Some(user) = connections.get_user_by_ws_id(&ws_id).cloned() {
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

        // === user ws map 제거
        connections.del_user_ws_id(&ws_id, &user.user_id);
    }

    // === pubsub 제거 및 구독중인 모든 토픽 abort
    pubsub.delete_topic_handle(&ws_id);

    // === 커넥션 제거
    connections.conn_remove(&ws_id);
}

/// 로그인
pub fn login_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    user_id: UserId,
    nick_name: String,
) {
    // === 이미 로그인했다면 가드, 유저가 없어야한다.
    let None = connections.get_user_by_ws_id(&ws_id).cloned() else {
        err_publish(pubsub, &ws_id, dbg!("[login_user] already authenticated"));
        return;
    };

    // === 커넥션 auth state 업데이트
    if let Some(conn) = connections.conn_get_mut(&ws_id) {
        conn.auth = WsConnAuth::Authenticated {
            user: WsWorldUser {
                user_id: user_id.clone(),
                nick_name: nick_name.clone(),
            },
        };

        connections.add_user_ws_id(&ws_id, &user_id);
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::UserLogined {
            user_id: user_id.into(),
            nick_name: nick_name.into(),
            ws_id: ws_id.clone().into(),
        },
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

/// 로그아웃
pub fn logout_user(
    connections: &mut WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    // === 유저가 있다면 이미 로그인 되어있는상태고, 없다면 로그인 안되어 있는상태 가드
    let Some(user) = connections.get_user_by_ws_id(&ws_id).cloned() else {
        err_publish(pubsub, &ws_id, dbg!("[logout_user] not authenticated"));
        return;
    };
    // === 로비 나가기
    lobby::lobby_leave(connections, data, pubsub, ws_id.clone());

    // === 커넥션 auth state 업데이트
    if let Some(mut conn) = connections.conn_remove(&ws_id) {
        conn.auth = WsConnAuth::Unauthenticated;
        connections.conn_insert(ws_id.clone(), conn);

        connections.del_user_ws_id(&ws_id, &user.user_id);
    }

    // === 개인 메시지 발행
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::UserLogouted {
            user_id: user.user_id.into(),
        },
    );
}

// ping 기록
pub fn last_ping(
    connections: &mut WsConnections,
    _data: &mut WsData,
    _pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    if let Some(conn) = connections.conn_get_mut(&ws_id) {
        conn.last_ping = Instant::now();
    }
}

// ping 검증
pub fn ping_validation(
    connections: &mut WsConnections,
    _data: &mut WsData,
    _pubsub: &mut WsPubSub,
) {
    let now = Instant::now();
    let timeout = Duration::from_secs(65);
    for (ws_id, conn) in connections.conn_iter() {
        let elapsed = now - conn.last_ping;
        if elapsed > timeout {
            let _ = conn.ws_close_tx.send(());
            tracing::info!(
                "[ping_validation] ws_id: {ws_id:?}, timeout!, elapsed: {elapsed:?} close send"
            );
        }
    }
}
