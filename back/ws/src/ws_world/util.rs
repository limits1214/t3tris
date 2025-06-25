use std::collections::HashMap;

use crate::{
    model::server_to_client_ws_msg::{self, LobbyUser},
    ws_world::model::{WsWorldRoom, WsWorldUser},
};

pub fn gen_room_publish_msg(
    users: &HashMap<String, WsWorldUser>,
    rooms: &HashMap<String, WsWorldRoom>,
    room_id: &str,
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
                    user_id: user.user_id,
                    nick_name: user.nick_name,
                })
        });

    let room_users =
        room.room_users
            .iter()
            .filter_map(|(_, room_user)| {
                users.get(&room_user.user_id).cloned().map(|user| {
                    server_to_client_ws_msg::RoomUser {
                        user_id: user.user_id,
                        nick_name: user.nick_name,
                        is_game_ready: room_user.is_game_ready,
                    }
                })
            })
            .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: room.room_id.clone(),
        room_name: room.room_name.clone(),
        room_host_user: host_user,
        room_users: room_users,
    })
}

pub fn gen_lobby_publish_msg(
    users: &HashMap<String, WsWorldUser>,
    rooms: &HashMap<String, WsWorldRoom>,
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
                user_id: user.user_id.clone(),
                nick_name: user.nick_name.clone(),
            })
        })
        .collect::<Vec<_>>();

    server_to_client_ws_msg::Lobby {
        rooms,
        users: lobby_users,
    }
}
