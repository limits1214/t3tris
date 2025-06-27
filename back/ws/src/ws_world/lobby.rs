use time::OffsetDateTime;

use crate::{
    constant::{TOPIC_LOBBY, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{ServerToClientWsMsg, User},
    topic,
    ws_world::{
        connections::{WsConnections, WsWorldUser},
        model::{WsData, WsId},
        pubsub::WsPubSub,
        util::err_publish,
    },
};

pub fn lobby_subscribe(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(connections, &data.rooms);
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );

    pubsub.subscribe(&ws_id, &topic!(TOPIC_LOBBY));
}

pub fn lobby_unsubscribe(
    _connections: &WsConnections,
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    pubsub.unsubscribe(&ws_id, &topic!(TOPIC_LOBBY));
}

/// 로비입장
/// 로그인해야됨
pub fn lobby_enter(
    connections: &WsConnections,
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::LobbyEntered.to_json(),
    );

    // let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(connections, &data.rooms);
    // pubsub.publish(
    //     &topic!(TOPIC_LOBBY),
    //     ServerToClientWsMsg::LobbyUpdated {
    //         rooms: pub_lobby.rooms,
    //         users: pub_lobby.users,
    //         chats: vec![],
    //     },
    // );

    if let Some(WsWorldUser { nick_name, .. }) = connections.get_user_by_ws_id(&ws_id).cloned() {
        pubsub.publish(
            &topic!(TOPIC_LOBBY),
            ServerToClientWsMsg::LobbyChat {
                timestamp: OffsetDateTime::now_utc(),
                user: User {
                    user_id: "Sytem".to_string(),
                    nick_name: "Sytem".to_string(),
                    ws_id: "System".to_owned(),
                },
                msg: format!("{nick_name} 로비 입장"),
            },
        );
    };
}

/// 로비 나가기
/// 로그인 해야됨
pub fn lobby_leave(
    connections: &WsConnections,
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
) {
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::LobbyLeaved.to_json(),
    );

    // let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(connections, &data.rooms);
    // pubsub.publish(
    //     &topic!(TOPIC_LOBBY),
    //     ServerToClientWsMsg::LobbyUpdated {
    //         rooms: pub_lobby.rooms,
    //         users: pub_lobby.users,
    //         chats: vec![],
    //     },
    // );

    if let Some(WsWorldUser { nick_name, .. }) = connections.get_user_by_ws_id(&ws_id).cloned() {
        pubsub.publish(
            &topic!(TOPIC_LOBBY),
            ServerToClientWsMsg::LobbyChat {
                timestamp: OffsetDateTime::now_utc(),
                user: User {
                    user_id: "Sytem".to_string(),
                    nick_name: "Sytem".to_string(),
                    ws_id: "System".to_owned(),
                },
                msg: format!("{nick_name} 로비 퇴장"),
            },
        );
    }
}

/// 로비 채팅
/// 로그인 해야됨
pub fn lobby_chat(
    connections: &WsConnections,
    _data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    msg: &str,
) {
    let Some(user) = connections.get_user_by_ws_id(&ws_id).cloned() else {
        err_publish(pubsub, &ws_id, dbg!("[lobby_chat] not authenticated"));
        return;
    };

    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                user_id: user.user_id.into(),
                nick_name: user.nick_name,
                ws_id: ws_id.into(),
            },
            msg: msg.to_owned(),
        },
    );
}
