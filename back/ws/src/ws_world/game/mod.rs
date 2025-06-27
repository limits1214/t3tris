mod tetris;
mod tick;
pub use tick::tick;

use crate::ws_world::{
    command::GameActionType,
    connections::WsConnections,
    model::{GameId, WsData, WsId},
    pubsub::WsPubSub,
    util::err_publish,
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

    match action {
        GameActionType::Left => todo!(),
        GameActionType::Right => todo!(),
        GameActionType::RotateLeft => todo!(),
        GameActionType::RotateRight => todo!(),
        GameActionType::HardDrop => todo!(),
        GameActionType::SoftDrop => todo!(),
    }
}
