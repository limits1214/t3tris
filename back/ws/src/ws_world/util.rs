use std::collections::HashMap;

use crate::{
    model::server_to_client_ws_msg,
    ws_world::model::{WsWorldRoom, WsWorldUser},
};

pub fn gen_room_publish_msg(
    users: &HashMap<String, WsWorldUser>,
    rooms: &HashMap<String, WsWorldRoom>,
    room_id: &str,
) -> Option<server_to_client_ws_msg::Room> {
    let Some(room) = rooms.get(room_id) else {
        dbg!();
        return None;
    };

    let host_user = if let Some(room_host_ws_id) = &room.room_host_ws_id {
        let host_user = users
            .iter()
            .find(|(_, user)| user.ws_id == *room_host_ws_id)
            .map(|(_, user)| server_to_client_ws_msg::User {
                user_id: user.user_id.clone(),
                ws_id: user.ws_id.clone(),
                nick_name: user.nick_name.clone(),
            });
        host_user
    } else {
        None
    };

    let room_users = room
        .room_users
        .iter()
        .filter_map(|(_, room_user)| {
            if let Some((_, user)) = users
                .iter()
                .find(|(_, user)| user.ws_id == *room_user.ws_id)
            {
                Some(server_to_client_ws_msg::RoomUser {
                    user_id: user.user_id.clone(),
                    ws_id: user.ws_id.clone(),
                    nick_name: user.nick_name.clone(),
                    is_game_ready: room_user.is_game_ready,
                })
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: room.room_id.clone(),
        room_name: room.room_name.clone(),
        room_host_user: host_user,
        room_users: room_users,
    })
}

pub fn gen_room_list_publish_msg(
    users: &HashMap<String, WsWorldUser>,
    rooms: &HashMap<String, WsWorldRoom>,
) -> Vec<server_to_client_ws_msg::Room> {
    rooms
        .clone()
        .iter()
        .filter(|(_, room)| !room.is_deleted)
        .filter_map(|(_, room)| gen_room_publish_msg(&users, &rooms, &room.room_id))
        .collect::<Vec<_>>()
}
