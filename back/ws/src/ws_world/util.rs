use crate::{
    model::server_to_client_ws_msg,
    ws_world::{
        WsData,
        model::{WsWorldRoom, WsWorldUser},
    },
};

pub fn gen_json_room_2(
    users: &Vec<WsWorldUser>,
    rooms: &Vec<WsWorldRoom>,
    room_id: &str,
) -> Option<server_to_client_ws_msg::Room> {
    let w_room = rooms.iter().find(|r| r.room_id == room_id).cloned();
    let Some(w_room) = w_room else { return None };
    let host_user = if let Some(room_host_ws_id) = w_room.room_host_ws_id {
        let host_user = users.iter().find(|u| u.ws_id == room_host_ws_id).map(|u| {
            server_to_client_ws_msg::User {
                user_id: u.user_id.clone(),
                ws_id: u.ws_id.clone(),
                nick_name: u.nick_name.clone(),
            }
        });
        host_user
    } else {
        None
    };

    let users = w_room
        .room_users
        .iter()
        .filter_map(|ru| {
            let a = users.iter().find(|u| u.ws_id == *ru.ws_id);
            if let Some(a) = a {
                Some(server_to_client_ws_msg::RoomUser {
                    user_id: a.user_id.clone(),
                    ws_id: a.ws_id.clone(),
                    nick_name: a.nick_name.clone(),
                    is_game_ready: ru.is_game_ready,
                })
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: w_room.room_id,
        room_name: w_room.room_name,
        room_host_user: host_user,
        room_users: users,
    })
}

pub fn gen_json_room(data: &WsData, room_id: &str) -> Option<server_to_client_ws_msg::Room> {
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
        .room_users
        .iter()
        .filter_map(|ru| {
            let a = data.users.iter().find(|u| u.ws_id == *ru.ws_id);
            if let Some(a) = a {
                Some(server_to_client_ws_msg::RoomUser {
                    user_id: a.user_id.clone(),
                    ws_id: a.ws_id.clone(),
                    nick_name: a.nick_name.clone(),
                    is_game_ready: ru.is_game_ready,
                })
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    Some(server_to_client_ws_msg::Room {
        room_id: w_room.room_id,
        room_name: w_room.room_name,
        room_host_user: host_user,
        room_users: users,
    })
}

pub fn gen_json_room_list(data: &WsData) -> Vec<server_to_client_ws_msg::Room> {
    data.rooms
        .clone()
        .iter()
        .filter(|f| !f.is_deleted)
        .filter_map(|rs| gen_json_room(data, &rs.room_id))
        .collect::<Vec<_>>()
}
