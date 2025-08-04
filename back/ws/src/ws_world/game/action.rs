use std::collections::HashMap;

use rand::seq::IndexedRandom;

use crate::{
    constant::TOPIC_ROOM_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        command::GameActionType,
        connections::WsConnections,
        game::tetris::{BoardEndKind, TetrisGameActionType, attack_line},
        model::{GameId, WsData, WsId, WsWorldGameStatus, WsWorldGameType},
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
    seq: Option<u32>,
) {
    // === 유저 가드
    let Some(_) = connections.get_user_by_ws_id(&ws_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] not authenticated"));
        return;
    };

    let Some(game) = data.games.get_mut(&game_id) else {
        err_publish(pubsub, &ws_id, dbg!("[game action] game not exists"));
        return;
    };

    if !matches!(game.status, WsWorldGameStatus::GameStart) {
        return;
    }

    let mut my_tetris = None;
    let mut other_tetris = Vec::new();

    for (id, tetris) in game.tetries.iter_mut() {
        if *id == ws_id {
            my_tetris = Some(tetris);
        } else {
            other_tetris.push((id, tetris));
        }
    }

    let Some(tetris) = my_tetris else {
        err_publish(pubsub, &ws_id, dbg!("[game action] tetris not exists"));
        return;
    };

    if tetris.is_board_end {
        return;
    }

    // let mut attack_line = None;
    match action {
        GameActionType::Left => {
            tetris.action_move_left(seq);
        }
        GameActionType::Right => {
            tetris.action_move_right(seq);
        }
        GameActionType::RotateLeft => {
            tetris.action_roatet_left(seq);
        }
        GameActionType::RotateRight => {
            tetris.action_rotate_right(seq);
        }
        GameActionType::HardDrop => {
            tetris.action_hard_drop();
            let (clear_len, score) = tetris.place_falling();
            // tetris.spawn_next();
            if let Ok(success) = tetris.spawn_next() {
                if !success {
                    tetris.is_board_end = true;
                    tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                        kind: BoardEndKind::SpawnImpossible,
                        elapsed: tetris.elapsed,
                    });
                }
            }

            match game.game_type {
                WsWorldGameType::Multi40Line => {
                    if tetris.clear_line >= 40 {
                        tetris.is_board_end = true;
                        tetris.line_40_clear = true;

                        tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                            kind: BoardEndKind::Line40Clear,
                            elapsed: tetris.elapsed,
                        });
                    }
                }
                WsWorldGameType::MultiBattle => {
                    if !tetris.garbage_add(clear_len as u8) {
                        tetris.is_board_end = true;
                        tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                            kind: BoardEndKind::SpawnImpossible,
                            elapsed: tetris.elapsed,
                        });
                    }
                    if let Some(score) = score {
                        let attack_line = attack_line(score);
                        if let Some(attack_line) = attack_line {
                            let targets = other_tetris
                                .iter()
                                .filter(|(f, g)| **f != ws_id && !g.is_board_end)
                                .map(|t| t.0)
                                .cloned()
                                .collect::<Vec<_>>();

                            if let Some(target) = targets.choose(&mut rand::rng()) {
                                if let Some((_, target_game)) =
                                    other_tetris.iter_mut().find(|f| f.0 == target)
                                {
                                    target_game.garbage_queueing(attack_line, ws_id.to_string());
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        GameActionType::SoftDrop => {
            tetris.action_soft_drop();
        }
        GameActionType::Hold => {
            // tetris.action_hold();
            // game.tetries.len();
            if !tetris.action_hold() {
                tetris.is_board_end = true;
                tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                    kind: BoardEndKind::SpawnImpossible,
                    elapsed: tetris.elapsed,
                });
            }
        }
    };

    let mut tetries_push_info = HashMap::new();
    tetries_push_info.insert(tetris.ws_id.clone().to_string(), tetris.get_action_buffer());
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, game.room_id),
        ServerToClientWsMsg::GameAction {
            game_id: game.game_id.to_string(),
            room_id: game.room_id.to_string(),
            action: tetries_push_info,
        },
    );
}
