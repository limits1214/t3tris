use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use crate::ws_world::game::tetris::TetrisGameActionType;
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
        for (_, t) in game.tetries.iter_mut() {
            t.elapsed = game.elapsed.as_millis();
        }
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
            //

            let mut tetries_push_info = HashMap::new();
            for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
                //
                if tetris.is_started {
                    if !tetris.is_game_over {
                        tetris.tick += 1;
                        tetris.step_tick += 1;

                        // combo
                        if tetris.combo_tick > 0 {
                            tetris.combo_tick -= 1;
                        } else {
                            tetris.combo_tick = 0;
                            tetris.combo = 0;
                        }

                        if tetris.is_placing_delay {
                            match tetris.try_step() {
                                Ok(_) => {}
                                Err(err) => match err {
                                    tetris_lib::StepError::OutOfBounds => {
                                        tetris.placing_delay_tick += 1;
                                        if tetris.placing_delay_tick >= PLACING_DELAY {
                                            tetris.place_falling();
                                            tetris.is_placing_delay = false;
                                        }
                                    }
                                    tetris_lib::StepError::Blocked(location) => {
                                        tetris.placing_delay_tick += 1;
                                        if tetris.placing_delay_tick >= PLACING_DELAY {
                                            tetris.place_falling();
                                            tetris.is_placing_delay = false;
                                        }
                                    }
                                    tetris_lib::StepError::InvalidShape => {
                                        //
                                    }
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
                                    tetris_lib::StepError::OutOfBounds => {
                                        if !tetris.is_placing_delay {
                                            tetris.is_placing_delay = true;
                                            tetris.placing_delay_tick = 0;
                                            tetris.placing_reset_cnt = 15;
                                        }
                                    }
                                    tetris_lib::StepError::Blocked(_) => {
                                        if !tetris.is_placing_delay {
                                            tetris.is_placing_delay = true;
                                            tetris.placing_delay_tick = 0;
                                            tetris.placing_reset_cnt = 15;
                                        }
                                    }
                                    tetris_lib::StepError::InvalidShape => {
                                        //
                                    }
                                },
                            }
                        }
                    }
                    tetries_push_info
                        .insert(tetris.ws_id.clone().to_string(), tetris.get_action_buffer());
                } else {
                    tetris.is_started = true;
                    tetris.is_game_over = false;
                    tetris.setup();
                    tetris.spawn_next();
                    tetris.tick = 0;
                    tetris.step_tick = 0;

                    tetries_push_info
                        .insert(tetris.ws_id.clone().to_string(), tetris.get_action_buffer());
                }
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

            let is_game_over = game.tetries.iter_mut().all(|(_, game)| game.is_game_over);
            if is_game_over {
                game.status = WsWorldGameStatus::GameEnd;

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
                    &ServerToClientWsMsg::Echo {
                        msg: format!("GameEnd"),
                    }
                    .to_json(),
                );
            }
        }
    });
}
