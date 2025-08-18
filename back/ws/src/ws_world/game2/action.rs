use crate::ws_world::{
    command::GameActionType,
    connections::WsConnections,
    model::{GameId, WsData, WsId, WsWorldGameStatus, WsWorldGameType},
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

    match action {
        GameActionType::MoveLeft => {
            tetris.action_move_left();
        }
        GameActionType::MoveRight => {
            tetris.action_move_right();
        }
        GameActionType::RotateLeft => {
            tetris.action_rotate_left();
        }
        GameActionType::RotateRight => {
            tetris.action_rotate_right();
        }
        GameActionType::HardDrop => {
            // tetris.action_hard_drop();
            // let (clear_len, score) = tetris.place_falling();
            // // tetris.spawn_next();
            // if let Ok(success) = tetris.spawn_next() {
            //     if !success {
            //         tetris.is_board_end = true;
            //         tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
            //             kind: BoardEndKind::SpawnImpossible,
            //             elapsed: tetris.elapsed,
            //         });
            //     }
            // }

            tetris.action_hard_drop();

            // match game.game_type {
            //     WsWorldGameType::Multi40Line => {
            //         if tetris.clear_line >= 40 {
            //             tetris.is_board_end = true;
            //             tetris.line_40_clear = true;

            //             tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
            //                 kind: BoardEndKind::Line40Clear,
            //                 elapsed: tetris.elapsed,
            //             });
            //         }
            //     }
            //     WsWorldGameType::MultiBattle => {
            //         if !tetris.garbage_add(clear_len as u8) {
            //             tetris.is_board_end = true;
            //             tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
            //                 kind: BoardEndKind::SpawnImpossible,
            //                 elapsed: tetris.elapsed,
            //             });
            //         }
            //         if let Some(score) = score {
            //             let attack_line = attack_line(score);
            //             if let Some(attack_line) = attack_line {
            //                 let targets = other_tetris
            //                     .iter()
            //                     .filter(|(f, g)| **f != ws_id && !g.is_board_end)
            //                     .map(|t| t.0)
            //                     .cloned()
            //                     .collect::<Vec<_>>();

            //                 if let Some(target) = targets.choose(&mut rand::rng()) {
            //                     if let Some((_, target_game)) =
            //                         other_tetris.iter_mut().find(|f| f.0 == target)
            //                     {
            //                         target_game.garbage_queueing(attack_line, ws_id.to_string());
            //                     }
            //                 }
            //             }
            //         }
            //     }
            //     _ => {}
            // }
        }
        GameActionType::SoftDrop => {
            tetris.action_soft_drop();
        }
        GameActionType::Hold => {
            tetris.action_hold();

            // if !tetris.action_hold() {
            //     tetris.is_board_end = true;
            //     tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
            //         kind: BoardEndKind::SpawnImpossible,
            //         elapsed: tetris.elapsed,
            //     });
            // }
        }
        GameActionType::Step => {
            tetris.step();
        }
        GameActionType::LineClear => {
            // tetris.
            tetris.line_clear();
        }
        GameActionType::Placing => {
            tetris.placing();
        }
        GameActionType::RemoveFalling => {
            tetris.remove_falling();
        }
        GameActionType::ShiftNext { next } => {
            tetris.shift_next();
        }
        GameActionType::PushNext { next } => {
            tetris.push_next(next);
        }
        GameActionType::Setup { next, hold } => {
            tetris.setup(next, hold);
        }
        GameActionType::Spawn { spawn } => {
            tetris.spawn(spawn);
        }
        GameActionType::AddHold { hold } => {
            tetris.add_hold(hold);
        }
        GameActionType::SetInfo { level, score, line } => {
            tetris.set_info(level, score, line);
        }
        GameActionType::ScoreEffect { kind, combo } => {
            tetris.score_effect(kind, combo);
        }
    };
}
