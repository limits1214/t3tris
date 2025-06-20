use crate::{model::server_to_client_ws_msg, ws_world::WsData};

pub fn gen_json_room(data: &mut WsData, room_id: &str) -> Option<server_to_client_ws_msg::Room> {
    let w_room = data.rooms.iter().find(|r| r.room_id == room_id).cloned();

    let Some(w_room) = w_room else { return None };

    let host_user = if let Some(room_host_ws_id) = w_room.room_host_ws_id {
        let host_user = data
            .users
            .iter()
            .find(|u| u.ws_id == room_host_ws_id)
            .map(|u| server_to_client_ws_msg::User {
                user_id: u.user_id.clone(),
                ws_id: u.ws_id.clone(),
                nick_name: u.nick_name.clone(),
            });
        host_user
    } else {
        None
    };

    let users = w_room
        .room_ws_ids
        .iter()
        .filter_map(|r_u_id| data.users.iter().find(|u| u.ws_id == *r_u_id))
        .map(|u| server_to_client_ws_msg::User {
            user_id: u.user_id.clone(),
            ws_id: u.ws_id.clone(),
            nick_name: u.nick_name.clone(),
        })
        .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: w_room.room_id,
        room_name: w_room.room_name,
        room_host_user: host_user,
        room_users: users,
    })
}

pub fn gen_json_room_list(data: &mut WsData) -> Vec<server_to_client_ws_msg::Room> {
    data.rooms
        .clone()
        .iter()
        .filter(|f| !f.is_deleted)
        .filter_map(|rs| gen_json_room(data, &rs.room_id))
        .collect::<Vec<_>>()
}
