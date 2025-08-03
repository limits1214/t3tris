pub mod tetris;
mod tick;
use std::collections::HashMap;

use common::repository::game_room_backup::{InsertGameRoomBackupArg, insert_game_room_backup};
pub use tick::tick;

use crate::{
    app::state::ArcWsAppState,
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

pub fn game_cleanup(
    _connections: &WsConnections,
    data: &mut WsData,
    _pubsub: &mut WsPubSub,
    arc_app_state: ArcWsAppState,
) {
    let backup_game_ids = data
        .games
        .iter()
        .filter(|f| f.1.is_deleted && !f.1.is_backuped)
        .map(|m| m.0)
        .cloned()
        .collect::<Vec<_>>();

    for backup_game_id in &backup_game_ids {
        let db_pool = arc_app_state.0.common.db_pool.clone();
        if let Some(mut game) = data.games.get_mut(&backup_game_id) {
            let room_id = game.room_id.to_string();
            let game_id = game.game_id.to_string();
            let ws_ids = game
                .tetries
                .iter()
                .map(|m| m.1.ws_id.to_string())
                .collect::<Vec<_>>();
            let user_ids = game
                .tetries
                .iter()
                .map(|m| m.1.user_id.to_string())
                .collect::<Vec<_>>();
            let ws_ids = serde_json::to_value(&ws_ids).unwrap_or_default();
            let user_ids = serde_json::to_value(&user_ids).unwrap_or_default();
            let data = serde_json::to_value(&game).unwrap_or_default();

            tracing::info!("[game_cleanup - backup] game_id: {game_id:?} cleanup");
            game.is_backuped = true;
            tokio::spawn(async move {
                if let Ok(mut conn) = db_pool.clone().acquire().await {
                    let res = insert_game_room_backup(
                        &mut conn,
                        InsertGameRoomBackupArg {
                            room_id: &room_id,
                            game_id: &game_id,
                            ws_ids: &ws_ids,
                            user_ids: &user_ids,
                            data: &data,
                        },
                    )
                    .await;

                    if let Err(e) = res {
                        tracing::error!(
                            "[game_cleanup - backup] insert fail, e: {e:?}, game_id: {game_id:?}, data: {data:?}"
                        );
                    }
                }
            });
        }
    }

    let delete_target_game = data
        .games
        .iter()
        .filter(|(_, g)| g.is_deleted && g.is_backuped)
        .map(|(_, g)| (g.game_id.clone(), g.room_id.clone()))
        .collect::<Vec<_>>();

    for (game_id, room_id) in delete_target_game {
        if data.rooms.get(&room_id).is_none() {
            data.games.remove(&game_id);
        }
    }
}
