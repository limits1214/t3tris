use time::OffsetDateTime;

use crate::{
    colon,
    constant::{TOPIC_LOBBY, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{ServerToClientWsMsg, User},
    ws_world::{
        connections::WsConnections,
        model::{WsData, WsWorldUser},
        pubsub::WsPubSub,
    },
};

/// 로비입장
/// 로그인해야됨
pub fn lobby_enter(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    // data.lobby.users.insert(
    //     ws_id.to_string(),
    //     WsWorldLobbyUser {
    //         ws_id: ws_id.to_string(),
    //     },
    // );

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyEntered.to_json(),
    );

    let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.rooms);
    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );

    let Some(WsWorldUser { nick_name, .. }) = data.users.get(ws_id).cloned() else {
        dbg!();
        return;
    };
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                user_id: "Sytem".to_string(),
                nick_name: "Sytem".to_string(),
            },
            msg: format!("{nick_name} 로비 입장"),
        }
        .to_json(),
    );
}

/// 로비 나가기
/// 로그인 해야됨
pub fn lobby_leave(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    // data.lobby.users.remove(ws_id);

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyLeaved.to_json(),
    );

    let pub_lobby = crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.rooms);
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );

    let Some(WsWorldUser { nick_name, .. }) = data.users.get(ws_id).cloned() else {
        dbg!();
        return;
    };
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                user_id: "Sytem".to_string(),
                nick_name: "Sytem".to_string(),
            },
            msg: format!("{nick_name} 로비 퇴장"),
        }
        .to_json(),
    );
}

/// 로비 채팅
/// 로그인 해야됨
pub fn lobby_chat(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: &str,
    msg: &str,
) {
    let Some(user) = connections.get_user_by_ws_id(&ws_id, data).cloned() else {
        let msg = "lobby_chat not authenticated".to_string();
        pubsub.publish(
            &colon!(TOPIC_WS_ID, ws_id),
            &ServerToClientWsMsg::Echo { msg: msg.clone() }.to_json(),
        );
        dbg!(msg);
        return;
    };

    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                user_id: user.user_id,
                nick_name: user.nick_name,
            },
            msg: msg.to_string(),
        }
        .to_json(),
    );
}
