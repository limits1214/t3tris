use time::OffsetDateTime;

use crate::{
    colon,
    constant::{TOPIC_LOBBY, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{ServerToClientWsMsg, User},
    ws_world::{
        model::{AuthStatus, WsData, WsWorldLobbyUser, WsWorldUser},
        pubsub::WsPubSub,
    },
};

/// 로비입장
/// 로그인해야됨
pub fn lobby_enter(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    data.lobby.users.insert(
        ws_id.to_string(),
        WsWorldLobbyUser {
            ws_id: ws_id.to_string(),
        },
    );

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyEntered.to_json(),
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

    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(ws_id).cloned()
    else {
        dbg!();
        return;
    };
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                ws_id: "Sytem".to_string(),
                user_id: Some("Sytem".to_string()),
                nick_name: Some("Sytem".to_string()),
            },
            msg: format!("{nick_name} 로비 입장"),
        }
        .to_json(),
    );
}

/// 로비 나가기
/// 로그인 해야됨
pub fn lobby_leave(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    data.lobby.users.remove(ws_id);

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyLeaved.to_json(),
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

    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(ws_id).cloned()
    else {
        dbg!();
        return;
    };
    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                ws_id: "Sytem".to_string(),
                user_id: Some("Sytem".to_string()),
                nick_name: Some("Sytem".to_string()),
            },
            msg: format!("{nick_name} 로비 퇴장"),
        }
        .to_json(),
    );
}

/// 로비 채팅
/// 로그인 해야됨
pub fn lobby_chat(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str, msg: &str) {
    let Some(WsWorldUser {
        ws_id,
        auth: AuthStatus::Authenticated { user_id, nick_name },
        state,
    }) = data.users.get(ws_id).cloned()
    else {
        dbg!();
        return;
    };

    pubsub.publish(
        TOPIC_LOBBY,
        &ServerToClientWsMsg::LobbyChat {
            timestamp: OffsetDateTime::now_utc(),
            user: User {
                ws_id: ws_id,
                user_id: Some(user_id),
                nick_name: Some(nick_name),
            },
            msg: msg.to_string(),
        }
        .to_json(),
    );
}
