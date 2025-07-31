pub mod tetris;
mod tick;
use std::collections::HashMap;

pub use tick::tick;

use crate::{
    constant::{TOPIC_ROOM_ID, TOPIC_WS_ID},
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        connections::WsConnections,
        model::{GameId, RoomId, WsData, WsId},
        pubsub::WsPubSub,
        util::err_publish,
    },
};

pub mod action;

pub fn sync(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    room_id: RoomId,
    game_id: GameId,
) {
    // === 유저 가드
    let Some(_) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] not authenticated"));
        return;
    };
    let Some(game) = data.games.get(&game_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] game not exists"));
        return;
    };

    let sync_data = game
        .tetries
        .iter()
        .map(|(ws_id, tetris)| (ws_id.clone().into(), tetris.game_sync_data()))
        .collect::<HashMap<_, _>>();

    // data.rooms.get(&room_id).unwrap().games;
    if let Some(room) = data.rooms.get(&room_id) {
        // room.games.iter().map(|g|)
        for x in &room.games {
            //
            data.games.get(x);
            if let Some(g) = data.games.get(x) {
                let xx = g.result.clone();
            };
        }
    }
    let room_result = data
        .rooms
        .get(&room_id)
        .map(|r| {
            return r
                .games
                .iter()
                .flat_map(|gid| {
                    return data.games.get(gid).map(|g| {
                        serde_json::json!({
                            "result": g.result.clone(),
                            "gameType": g.game_type.to_string(),
                        })
                    });
                })
                .collect::<Vec<_>>();
        })
        .unwrap_or(vec![]);

    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, game.room_id, TOPIC_WS_ID, ws_id),
        ServerToClientWsMsg::GameSync {
            game_id: game.game_id.to_string(),
            room_id: game.room_id.to_string(),
            data: sync_data,
            room_result,
        },
    );
}
