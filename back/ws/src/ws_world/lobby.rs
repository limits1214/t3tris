use time::OffsetDateTime;

use crate::{
    colon,
    constant::{TOPIC_LOBBY_PARTICIPANT, TOPIC_LOBBY_VIEWER, TOPIC_WS_ID},
    model::server_to_client_ws_msg::{ServerToClientWsMsg, User},
    ws_world::{
        model::{WsData, WsWorldLobbyUser, WsWorldUser},
        pubsub::WsPubSub,
    },
};

// pub fn lobby_viewer_subscribe(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
//     pubsub.subscribe(&ws_id, TOPIC_LOBBY_VIEWER);
// }

/// 로비 구독하기,
/// 로그인안해도 됨
// pub fn lobby_update_subscribe(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
//     pubsub.subscribe(&ws_id, TOPIC_LOBBY_UPDATE);

//     let pub_lobby =
//         crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
//     pubsub.publish(
//         &colon!(TOPIC_WS_ID, ws_id),
//         &ServerToClientWsMsg::LobbyUpdated {
//             rooms: pub_lobby.rooms,
//             users: pub_lobby.users,
//             chats: vec![],
//         }
//         .to_json(),
//     );
// }

/// 로비 구독 해제하기
/// 로그인 안해도됨
// pub fn lobby_update_unsubscribe(pubsub: &mut WsPubSub, ws_id: &str) {
//     pubsub.unsubscribe(&ws_id, TOPIC_LOBBY_UPDATE);
// }

/// 로비입장
/// 로그인해야됨
pub fn lobby_enter(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    pubsub.unsubscribe(ws_id, TOPIC_LOBBY_VIEWER);
    pubsub.subscribe(ws_id, TOPIC_LOBBY_PARTICIPANT);

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
    pubsub.publish_vec(
        &[TOPIC_LOBBY_VIEWER, TOPIC_LOBBY_PARTICIPANT],
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );

    let Some(WsWorldUser::Authenticated { nick_name, .. }) = data.users.get(ws_id).cloned() else {
        dbg!();
        return;
    };
    pubsub.publish_vec(
        &[TOPIC_LOBBY_VIEWER, TOPIC_LOBBY_PARTICIPANT],
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
    pubsub.unsubscribe(ws_id, TOPIC_LOBBY_PARTICIPANT);
    pubsub.subscribe(ws_id, TOPIC_LOBBY_VIEWER);

    data.lobby.users.remove(ws_id);

    pubsub.publish(
        &colon!(TOPIC_WS_ID, ws_id),
        &ServerToClientWsMsg::LobbyLeaved.to_json(),
    );

    let pub_lobby =
        crate::ws_world::util::gen_lobby_publish_msg(&data.users, &data.lobby, &data.rooms);
    pubsub.publish_vec(
        &[TOPIC_LOBBY_VIEWER, TOPIC_LOBBY_PARTICIPANT],
        &ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        }
        .to_json(),
    );

    let Some(WsWorldUser::Authenticated { nick_name, .. }) = data.users.get(ws_id).cloned() else {
        dbg!();
        return;
    };
    pubsub.publish_vec(
        &[TOPIC_LOBBY_VIEWER, TOPIC_LOBBY_PARTICIPANT],
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
    let Some(WsWorldUser::Authenticated {
        ws_id,
        user_id,
        nick_name,
    }) = data.users.get(ws_id).cloned()
    else {
        dbg!();
        return;
    };

    pubsub.publish_vec(
        &[TOPIC_LOBBY_VIEWER, TOPIC_LOBBY_PARTICIPANT],
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
