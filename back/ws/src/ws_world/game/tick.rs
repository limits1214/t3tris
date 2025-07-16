use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use rand::seq::IndexedRandom;

use crate::ws_world::{
    game::tetris::{BoardEndKind, GarbageQueueKind, TetrisGameActionType, attack_line},
    model::WsWorldGameType,
};
use crate::{
    constant::TOPIC_ROOM_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        WsData,
        connections::WsConnections,
        game::tetris::{PLACING_DELAY, level_to_gravity_tick},
        model::{WsWorldGameStatus, WsWorldRoomStatus},
        pubsub::WsPubSub,
    },
};
pub fn tick(connections: &WsConnections, data: &mut WsData, pubsub: &mut WsPubSub) {
    let mut available_game = data
        .games
        .iter_mut()
        .filter(|(_, game)| !game.is_deleted)
        .collect::<Vec<_>>();

    available_game.iter_mut().for_each(|(_, game)| {
        let before_now = game.now;
        game.now = Instant::now();
        game.elapsed = game.now - game.started;
        game.delta = game.now - before_now;
    });

    available_game.iter_mut().for_each(|(_, game)| {
        if game.status == WsWorldGameStatus::BeforeGameStartTimerThree {
            if game.elapsed > Duration::from_secs(1) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerTwo;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::Echo {
                        msg: format!("BeforeGameStartTimerTwo"),
                    }
                    .to_json(),
                );
            }
        } else if game.status == WsWorldGameStatus::BeforeGameStartTimerTwo {
            if game.elapsed > Duration::from_secs(2) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerOne;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::Echo {
                        msg: format!("BeforeGameStartTimerOne"),
                    }
                    .to_json(),
                );
            }
        } else if game.status == WsWorldGameStatus::BeforeGameStartTimerOne {
            if game.elapsed > Duration::from_secs(3) {
                game.status = WsWorldGameStatus::GameStart;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::Echo {
                        msg: format!("GameStart"),
                    }
                    .to_json(),
                );
            }
        } else {

            let mut attack_list = vec![];
            for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
                if tetris.is_started {
                    if !tetris.is_board_end {
                        tetris.elapsed = game.elapsed.as_millis() - 3000;

                        // tick
                        tetris.tick += 1;

                        // step tick
                        tetris.step_tick += 1;

                        // combo tick
                        if tetris.combo_tick > 0 {
                            tetris.combo_tick -= 1;
                        } else {
                            tetris.combo_tick = 0;
                            tetris.combo = 0;
                        }

                        // garbage queue->ready tick
                        if matches!(game.game_type, WsWorldGameType::MultiBattle) {
                            let mut garbage_ready = false;
                            for gq in tetris.garbage_queue.iter_mut() {
                                if matches!(gq.kind, GarbageQueueKind::Queued)
                                    && tetris.tick > gq.tick + 180
                                {
                                    gq.kind = GarbageQueueKind::Ready;
                                    garbage_ready = true;
                                }
                            }
                            if garbage_ready {
                                tetris.push_action_buffer(TetrisGameActionType::Garbage {
                                    queue: tetris.garbage_queue.clone().into(),
                                });
                            }
                        }

                        if tetris.is_placing_delay {
                            match tetris.board.try_step() {
                                Ok(_) => {}
                                Err(err) => match err {
                                    tetris_lib::StepError::Blocked(_)
                                    | tetris_lib::StepError::OutOfBounds => {
                                        tetris.placing_delay_tick += 1;
                                        if tetris.placing_delay_tick >= PLACING_DELAY {
                                            tetris.is_placing_delay = false;

                                            let (clear_len, score) = tetris.place_falling();

                                            // tetris.spawn_next();
                                            if let Ok(success) = tetris.spawn_next() {
                                                if !success {
                                                    tetris.is_board_end = true;
                                                    tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                                                        kind: BoardEndKind::SpawnImpossible,
                                                        elapsed: tetris.elapsed ,
                                                    });
                                                }
                                            }
                                            match game.game_type {
                                                WsWorldGameType::MultiBattle => {
                                                    if !tetris.garbage_add(clear_len as u8) {
                                                        tetris.is_board_end = true;
                                                        tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                                                            kind: BoardEndKind::SpawnImpossible,
                                                            elapsed: tetris.elapsed ,
                                                        });
                                                    }
                                                    if let Some(score) = score {
                                                        let attack = attack_line(score);
                                                        if let Some(attack) = attack {
                                                            attack_list.push((
                                                                tetris.ws_id.clone(),
                                                                attack,
                                                            ));
                                                        }
                                                    }
                                                }
                                                WsWorldGameType::Multi40Line => {
                                                    if tetris.clear_line >= 40 {
                                                        tetris.is_board_end = true;
                                                        tetris.line_40_clear = true;

                                                        tetris.push_action_buffer(
                                                            TetrisGameActionType::BoardEnd {
                                                                kind: BoardEndKind::Line40Clear,
                                                                elapsed: tetris.elapsed ,
                                                            },
                                                        );
                                                    }
                                                }
                                                _ => {}
                                            }
                                        }
                                    }
                                    tetris_lib::StepError::InvalidShape => {}
                                },
                            }
                        }

                        if tetris.step_tick >= level_to_gravity_tick(tetris.level) {
                            tetris.step_tick = 0;
                            match tetris.step() {
                                Ok(_) => {
                                    tetris.push_action_buffer(TetrisGameActionType::Step);
                                }
                                Err(err) => match err {
                                    tetris_lib::StepError::Blocked(_)
                                    | tetris_lib::StepError::OutOfBounds => {
                                        if !tetris.is_placing_delay {
                                            tetris.is_placing_delay = true;
                                            tetris.placing_delay_tick = 0;
                                            tetris.placing_reset_cnt = 15;
                                        }
                                    }
                                    tetris_lib::StepError::InvalidShape => {}
                                },
                            }
                        }

                        // if tetris.is_board_end {
                        //     tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                        //         kind: BoardEndKind::SpawnImpossible,
                        //         elapsed: tetris.elapsed - 3000,
                        //     });
                        // }
                    }
                } else {
                    tetris.is_started = true;
                    tetris.is_board_end = false;
                    tetris.tick = 0;
                    tetris.step_tick = 0;
                    tetris.setup();
                    _ = tetris.spawn_next();
                }
            }

            // battle last check
            if matches!(game.game_type, WsWorldGameType::MultiBattle) {
                let mut not_end_boards = game
                    .tetries
                    .iter_mut()
                    .filter(|f| !f.1.is_board_end)
                    .collect::<Vec<_>>();
                if not_end_boards.len() == 1 {
                    let (_, tetris) = not_end_boards.get_mut(0).unwrap();
                    tetris.is_board_end = true;
                    tetris.battle_win = true;
                    tetris.push_action_buffer(TetrisGameActionType::BoardEnd {
                        kind: BoardEndKind::BattleWinner,
                        elapsed: tetris.elapsed,
                    });
                }
            }

            // attack
            if matches!(game.game_type, WsWorldGameType::MultiBattle) {
                for (ws_id, attack_line) in attack_list {
                    let targets = game
                        .tetries
                        .iter()
                        .filter(|(f, g)| **f != ws_id && !g.is_board_end)
                        .map(|t| t.0)
                        .cloned()
                        .collect::<Vec<_>>();

                    if let Some(target) = targets.choose(&mut rand::rng()) {
                        if let Some(game) = game.tetries.get_mut(&target) {
                            game.garbage_queueing(attack_line, ws_id.to_string());
                        }
                    }
                }
            }

            let mut tetries_push_info = HashMap::new();
            for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
                tetries_push_info
                    .insert(tetris.ws_id.clone().to_string(), tetris.get_action_buffer());
            }

            if !tetries_push_info.is_empty() {
                if tetries_push_info.iter().any(|(_, v)| !v.is_empty()) {
                    pubsub.publish(
                        &topic!(TOPIC_ROOM_ID, game.room_id),
                        ServerToClientWsMsg::GameAction {
                            game_id: game.game_id.to_string(),
                            room_id: game.room_id.to_string(),
                            action: tetries_push_info,
                        },
                    );
                }
            }

            let is_game_end = game.tetries.iter_mut().all(|(_, game)| game.is_board_end);
            if is_game_end {
                game.status = WsWorldGameStatus::GameEnd;

                match game.game_type {
                    WsWorldGameType::MultiScore => {
                        let mut res = game.tetries.iter().map(|(_, t)| {
                            (t.ws_id.clone(), t.score)
                        } ).collect::<Vec<_>>();
                        res.sort_by_key(|s|s.1);
                        game.result = Some(serde_json::json!(res));
                    },
                    WsWorldGameType::Multi40Line => {
                        let mut res = game.tetries.iter().map(|(_, t)| {
                            (t.ws_id.clone(), t.elapsed, t.line_40_clear)
                        } ).collect::<Vec<_>>();
                        res.sort_by_key(|s|s.1);
                        game.result = Some(serde_json::json!(res));
                    },
                    WsWorldGameType::MultiBattle => {
                        let mut res = game.tetries.iter().map(|(_, t)| {
                            (t.ws_id.clone(), t.elapsed, t.battle_win)
                        } ).collect::<Vec<_>>();
                        res.sort_by_key(|s|s.1);

                        game.result = Some(serde_json::json!(res));
                    },
                    _ => {}
                }

                if let Some(room) = data.rooms.get_mut(&game.room_id) {
                    room.room_status = WsWorldRoomStatus::Waiting;
                    room.room_users
                        .iter_mut()
                        .for_each(|(_, user)| user.is_game_ready = true);
                }

                if let Some(pub_room) = crate::ws_world::util::gen_room_publish_msg(
                    connections,
                    &data.rooms,
                    &game.room_id,
                ) {
                    pubsub.publish(
                        &topic!(TOPIC_ROOM_ID, &game.room_id),
                        &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
                    );
                };

                game.is_deleted = true;


                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::GameEnd {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        result: game.result.clone().unwrap_or_default(),
                    }
                    .to_json(),
                );
            }
        }
    });
}
