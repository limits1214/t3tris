use std::collections::HashMap;

use crate::{
    constant::TOPIC_WS_ID,
    model::server_to_client_ws_msg::{self, LobbyUser, ServerToClientWsMsg},
    topic,
    ws_world::{
        model::{RoomId, UserId, WsId, WsWorldRoom, WsWorldUser},
        pubsub::WsPubSub,
    },
};

pub fn gen_room_publish_msg(
    users: &HashMap<UserId, WsWorldUser>,
    rooms: &HashMap<RoomId, WsWorldRoom>,
    room_id: &RoomId,
) -> Option<server_to_client_ws_msg::Room> {
    let Some(room) = rooms.get(room_id) else {
        dbg!("gen_room_publish_msg no room");
        return None;
    };

    let host_user = room
        .room_host_user_id
        .clone()
        .and_then(|room_host_user_id| {
            users
                .get(&room_host_user_id)
                .cloned()
                .map(|user| server_to_client_ws_msg::User {
                    user_id: user.user_id.to_string(),
                    nick_name: user.nick_name,
                })
        });

    let room_users =
        room.room_users
            .iter()
            .filter_map(|(_, room_user)| {
                users.get(&room_user.user_id).cloned().map(|user| {
                    server_to_client_ws_msg::RoomUser {
                        user_id: user.user_id.to_string(),
                        nick_name: user.nick_name,
                        is_game_ready: room_user.is_game_ready,
                    }
                })
            })
            .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: room.room_id.to_string(),
        room_name: room.room_name.clone(),
        room_host_user: host_user,
        room_users: room_users,
    })
}

pub fn gen_lobby_publish_msg(
    users: &HashMap<UserId, WsWorldUser>,
    rooms: &HashMap<RoomId, WsWorldRoom>,
) -> server_to_client_ws_msg::Lobby {
    let rooms = rooms
        .clone()
        .iter()
        .filter(|(_, room)| !room.is_deleted)
        .filter_map(|(_, room)| gen_room_publish_msg(&users, &rooms, &room.room_id))
        .collect::<Vec<_>>();

    let lobby_users = users
        .iter()
        .filter_map(|(_, user)| {
            Some(LobbyUser {
                user_id: user.user_id.to_string(),
                nick_name: user.nick_name.clone(),
            })
        })
        .collect::<Vec<_>>();

    server_to_client_ws_msg::Lobby {
        rooms,
        users: lobby_users,
    }
}
pub fn err_publish(pubsub: &mut WsPubSub, ws_id: &WsId, msg: &str) {
    err_publish_code(pubsub, ws_id, msg, "N");
}
pub fn err_publish_code(pubsub: &mut WsPubSub, ws_id: &WsId, msg: &str, code: &str) {
    pubsub.publish(
        &topic!(TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::Err {
            msg: msg.to_owned(),
            code: code.to_owned(),
        }
        .to_json(),
    );
}
