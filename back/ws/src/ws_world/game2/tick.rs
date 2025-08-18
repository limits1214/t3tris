use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use crate::{
    constant::{TOPIC_LOBBY, TOPIC_ROOM_ID},
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        connections::WsConnections,
        game2::{
            model::{TetrisGameActionType, level_to_gravity_tick},
            tetris::TetrisGame,
        },
        model::{
            RoomId, WsData, WsWorldGame, WsWorldGameStatus, WsWorldGameType, WsWorldRoom,
            WsWorldRoomStatus,
        },
        pubsub::WsPubSub,
        util::gen_lobby_publish_msg,
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

        if game.status == WsWorldGameStatus::Wait {
            if game.elapsed > Duration::from_millis(10) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerThree;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::GameStartTimer {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        time: 3,
                    }
                    .to_json(),
                );
            }
        } else if game.status == WsWorldGameStatus::BeforeGameStartTimerThree {
            if game.elapsed > Duration::from_secs(1) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerTwo;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::GameStartTimer {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        time: 2,
                    }
                    .to_json(),
                );
            }
        } else if game.status == WsWorldGameStatus::BeforeGameStartTimerTwo {
            if game.elapsed > Duration::from_secs(2) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerOne;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::GameStartTimer {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        time: 1,
                    }
                    .to_json(),
                );
            }
        } else if game.status == WsWorldGameStatus::BeforeGameStartTimerOne {
            if game.elapsed > Duration::from_secs(3) {
                game.status = WsWorldGameStatus::GameStart;
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::GameStartTimer {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        time: 0,
                    }
                    .to_json(),
                );
            }
        } else {
            //
            game_loop(connections, &mut data.rooms, game, pubsub);
        }
    });
}

fn game_loop(
    connections: &WsConnections,
    rooms: &mut HashMap<RoomId, WsWorldRoom>,
    game: &mut WsWorldGame,
    pubsub: &mut WsPubSub,
) {
    for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
        if tetris.is_started {
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

            if tetris.step_tick >= level_to_gravity_tick(tetris.level) {
                tetris.step_tick = 0;
                // tetris.push_action_buffer(TetrisGameActionType::DoStep);
                // match tetris.step() {
                //     Ok(_) => {
                //         tetris.push_action_buffer(TetrisGameActionType::Step);
                //     }
                //     Err(err) => match err {
                //         tetris_lib::StepError::Blocked(_) | tetris_lib::StepError::OutOfBounds => {
                //             if !tetris.is_placing_delay {
                //                 tetris.is_placing_delay = true;
                //                 tetris.placing_delay_tick = 0;
                //                 tetris.placing_reset_cnt = 15;
                //             }
                //         }
                //         tetris_lib::StepError::InvalidShape => {}
                //     },
                // }
            }
        } else {
            tetris.is_started = true;
            tetris.is_board_end = false;
            // tetris.tick = 0;
            // tetris.step_tick = 999;
            // tetris.setup();
            // let next_tetr = tetris.shift_next();
            // if let Some(next_tetr) = next_tetr {
            //     tetris.spawn(next_tetr);
            //     tetris.push_next();
            //     tetris.push_action_buffer(TetrisGameActionType::GameStart);
            // }
            tetris.push_action_buffer(TetrisGameActionType::GameStart);
        }
    }

    // action 보낼거 있는지 체크후 send
    let mut tetries_push_info = HashMap::new();
    for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
        tetries_push_info.insert(tetris.ws_id.clone().to_string(), tetris.get_action_buffer());
    }
    if !tetries_push_info.is_empty() {
        if tetries_push_info.iter().any(|(_, v)| !v.is_empty()) {
            pubsub.publish(
                &topic!(TOPIC_ROOM_ID, game.room_id),
                ServerToClientWsMsg::GameAction2 {
                    game_id: game.game_id.to_string(),
                    room_id: game.room_id.to_string(),
                    action: tetries_push_info,
                },
            );
        }
    }

    // 게임 종료
    let is_game_end = game.tetries.iter_mut().all(|(_, game)| game.is_board_end);
    if is_game_end {
        game_end(connections, rooms, game, pubsub);
    }
}

fn game_end(
    connections: &WsConnections,
    rooms: &mut HashMap<RoomId, WsWorldRoom>,
    game: &mut WsWorldGame,
    pubsub: &mut WsPubSub,
) {
    game.status = WsWorldGameStatus::GameEnd;
    game.is_deleted = true;

    match game.game_type {
        WsWorldGameType::MultiScore => {
            let mut res = game
                .tetries
                .iter()
                .map(|(_, t)| {
                    (
                        t.ws_id.clone(),
                        t.nick_name.clone(),
                        t.score,
                        t.elapsed,
                        t.clear_line,
                    )
                })
                .collect::<Vec<_>>();
            res.sort_by(|a, b| b.2.cmp(&a.2));
            game.result = Some(serde_json::json!(res));
        }
        WsWorldGameType::Multi40Line => {
            let mut res = game
                .tetries
                .iter()
                .map(|(_, t)| {
                    (
                        t.ws_id.clone(),
                        t.nick_name.clone(),
                        t.score,
                        t.elapsed,
                        t.line_40_clear,
                        t.clear_line,
                    )
                })
                .collect::<Vec<_>>();
            res.sort_by(|a, b| (!a.4).cmp(&(!b.4)).then(b.3.cmp(&a.3)));
            game.result = Some(serde_json::json!(res));
        }
        WsWorldGameType::MultiBattle => {
            let mut res = game
                .tetries
                .iter()
                .map(|(_, t)| {
                    (
                        t.ws_id.clone(),
                        t.nick_name.clone(),
                        t.score,
                        t.elapsed,
                        t.battle_win,
                        t.clear_line,
                    )
                })
                .collect::<Vec<_>>();
            res.sort_by(|a, b| (!a.4).cmp(&(!b.4)).then(b.3.cmp(&a.3)));
            game.result = Some(serde_json::json!(res));
        }
        _ => {}
    }

    if let Some(room) = rooms.get_mut(&game.room_id) {
        room.room_status = WsWorldRoomStatus::Waiting;
        room.room_users
            .iter_mut()
            .for_each(|(_, user)| user.is_game_ready = true);
    }

    // 게임 결과 send
    pubsub.publish(
        &topic!(TOPIC_ROOM_ID, game.room_id),
        &ServerToClientWsMsg::GameEnd {
            game_id: game.game_id.to_string(),
            room_id: game.room_id.to_string(),
            result: game.result.clone().unwrap_or_default(),
            game_type: game.game_type.to_string(),
        }
        .to_json(),
    );

    // room 상태 업데이트
    if let Some(pub_room) =
        crate::ws_world::util::gen_room_publish_msg(connections, rooms, &game.room_id)
    {
        pubsub.publish(
            &topic!(TOPIC_ROOM_ID, &game.room_id),
            &ServerToClientWsMsg::RoomUpdated { room: pub_room }.to_json(),
        );
    };

    // 로비에 게임 상태 변경 퍼블리시
    let pub_lobby = gen_lobby_publish_msg(connections, rooms);
    pubsub.publish(
        &topic!(TOPIC_LOBBY),
        ServerToClientWsMsg::LobbyUpdated {
            rooms: pub_lobby.rooms,
            users: pub_lobby.users,
            chats: vec![],
        },
    );
}
