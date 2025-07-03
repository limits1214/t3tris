pub mod tetris;
mod tick;
use std::collections::HashMap;

pub use tick::tick;

use crate::{
    constant::TOPIC_ROOM_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        command::GameActionType,
        connections::WsConnections,
        model::{GameId, WsData, WsId},
        pubsub::WsPubSub,
        util::err_publish,
    },
};

pub fn action(
    connections: &WsConnections,
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    ws_id: WsId,
    game_id: GameId,
    action: GameActionType,
) {
    // === 유저 가드
    let Some(_) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] not authenticated"));
        return;
    };

    // tracing::info!("action!: ws_id: {ws_id:?}, game_id: {game_id:?}, action: {action:?}");
    let Some(game) = data.games.get_mut(&game_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] game not exists"));
        return;
    };

    let Some(tetris) = game.tetries.get_mut(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] tetris not exists"));
        return;
    };

    if tetris.is_game_over {
        return;
    }

    match action {
        GameActionType::Left => {
            tetris.action_move_left();
        }
        GameActionType::Right => {
            tetris.action_move_right();
        }
        GameActionType::RotateLeft => {
            tetris.action_roatet_left();
        }
        GameActionType::RotateRight => {
            tetris.action_rotate_right();
        }
        GameActionType::HardDrop => {
            tetris.action_hard_drop();
        }
        GameActionType::SoftDrop => {
            tetris.action_soft_drop();
        }
        GameActionType::Hold => {
            tetris.action_hold();
        }
    };

    let mut tetries_push_info = HashMap::new();
    // for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
    //     // if !tetris.is_game_over {
    //     let info = tetris.get_client_info();
    //     tetries_push_info.insert(tetris.ws_id.clone().to_string(), info);
    //     // }
    // }
    let info = tetris.get_client_info();
    tetries_push_info.insert(tetris.ws_id.clone().to_string(), info);
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, game.room_id),
        ServerToClientWsMsg::GameMsg {
            game_id: game.game_id.to_string(),
            room_id: game.room_id.to_string(),
            tetries: tetries_push_info,
        },
    );
}
