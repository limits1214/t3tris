use std::collections::HashMap;

use crate::{
    model::server_to_client_ws_msg::{self, LobbyUser},
    ws_world::model::{AuthStatus, WsWorldLobby, WsWorldRoom, WsWorldUser},
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

    let host_user = room.room_host_ws_id.clone().and_then(|room_host_ws_id| {
        users.get(&room_host_ws_id).map(|user| match &user.auth {
            AuthStatus::Authenticated { user_id, nick_name } => server_to_client_ws_msg::User {
                ws_id: user.ws_id.clone(),
                user_id: Some(user_id.clone()),
                nick_name: Some(nick_name.clone()),
            },
            AuthStatus::Unauthenticated => server_to_client_ws_msg::User {
                ws_id: user.ws_id.clone(),
                user_id: None,
                nick_name: None,
            },
        })
    });

    let room_users = room
        .room_users
        .iter()
        .filter_map(|(_, room_user)| {
            users
                .get(&room_user.ws_id)
                .and_then(|user| match &user.auth {
                    AuthStatus::Authenticated { user_id, nick_name } => {
                        Some(server_to_client_ws_msg::RoomUser {
                            ws_id: user.ws_id.clone(),
                            user_id: user_id.clone(),
                            nick_name: nick_name.clone(),
                            is_game_ready: room_user.is_game_ready,
                        })
                    }
                    AuthStatus::Unauthenticated { .. } => None,
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
    lobby: &WsWorldLobby,
    rooms: &HashMap<String, WsWorldRoom>,
) -> server_to_client_ws_msg::Lobby {
    let rooms = rooms
        .clone()
        .iter()
        .filter(|(_, room)| !room.is_deleted)
        .filter_map(|(_, room)| gen_room_publish_msg(&users, &rooms, &room.room_id))
        .collect::<Vec<_>>();

    let lobby_users = lobby
        .users
        .iter()
        .filter_map(|(_, lobby_user)| {
            users
                .get(&lobby_user.ws_id)
                .and_then(|user| match &user.auth {
                    AuthStatus::Authenticated { user_id, nick_name } => Some(LobbyUser {
                        ws_id: user.ws_id.to_string(),
                        user_id: user_id.to_string(),
                        nick_name: nick_name.to_string(),
                    }),
                    AuthStatus::Unauthenticated { .. } => None,
                })
        })
        .collect::<Vec<_>>();

    server_to_client_ws_msg::Lobby {
        rooms,
        users: lobby_users,
    }
}
