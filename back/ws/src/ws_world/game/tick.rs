use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use crate::{
    constant::TOPIC_ROOM_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    topic,
    ws_world::{
        WsData,
        connections::WsConnections,
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
            //

            let mut tetries_push_info = HashMap::new();
            for (_, (_, tetris)) in game.tetries.iter_mut().enumerate() {
                //
                if tetris.is_started {
                    if !tetris.is_game_over {
                        let step_duration = game.now - tetris.last_step;
                        if step_duration > Duration::from_millis(500) {
                            tetris.last_step = game.now;
                            tetris.step();

                            let info = tetris.get_client_info();
                            tetries_push_info.insert(tetris.ws_id.clone().to_string(), info);
                        }
                    }
                } else {
                    tetris.is_started = true;
                    tetris.is_game_over = false;
                    tetris.last_step = game.now;
                    tetris.spawn_next();

                    let info = tetris.get_client_info();
                    tetries_push_info.insert(tetris.ws_id.clone().to_string(), info);
                }
            }
            if !tetries_push_info.is_empty() {
                pubsub.publish(
                    &topic!(TOPIC_ROOM_ID, game.room_id),
                    ServerToClientWsMsg::GameMsg {
                        game_id: game.game_id.to_string(),
                        room_id: game.room_id.to_string(),
                        tetries: tetries_push_info,
                    },
                );
            }

            //
            //
            if game.elapsed > Duration::from_secs(60) {
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
