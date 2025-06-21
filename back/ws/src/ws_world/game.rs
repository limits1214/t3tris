use std::time::{Duration, Instant};

use crate::{
    colon,
    constant::TOPIC_ROOM_ID,
    model::server_to_client_ws_msg::ServerToClientWsMsg,
    ws_world::{
        WsData,
        model::{WsWorldGameStatus, WsWorldRoomStatus},
        pubsub::WsPubSub,
    },
};

pub fn tick(data: &mut WsData, pubsub: &mut WsPubSub) {
    let mut available_game = data
        .games
        .iter_mut()
        .filter(|g| !g.is_deleted)
        .collect::<Vec<_>>();

    available_game.iter_mut().for_each(|game| {
        let before_now = game.now;
        game.now = Instant::now();
        game.elapsed = game.now - game.started;
        game.delta = game.now - before_now;
    });

    available_game.iter_mut().for_each(|game| {
        if game.status == WsWorldGameStatus::BeforeGameStartTimerThree {
            if game.elapsed > Duration::from_secs(1) {
                game.status = WsWorldGameStatus::BeforeGameStartTimerTwo;
                pubsub.publish(
                    &colon!(TOPIC_ROOM_ID, game.room_id),
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
                    &colon!(TOPIC_ROOM_ID, game.room_id),
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
                    &colon!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::Echo {
                        msg: format!("GameStart"),
                    }
                    .to_json(),
                );
            }
        } else {
            if game.elapsed > Duration::from_secs(5) {
                game.status = WsWorldGameStatus::GameEnd;

                if let Some(room) = data.rooms.iter_mut().find(|r| r.room_id == game.room_id) {
                    room.room_status = WsWorldRoomStatus::Waiting;
                    room.room_users
                        .iter_mut()
                        .for_each(|u| u.is_game_ready = false);
                }

                if let Some(stc_room) =
                    crate::ws_world::util::gen_json_room_2(&data.users, &data.rooms, &game.room_id)
                {
                    pubsub.publish(
                        &colon!(TOPIC_ROOM_ID, &game.room_id),
                        &ServerToClientWsMsg::RoomUpdated { room: stc_room }.to_json(),
                    );
                };

                game.is_deleted = true;
                pubsub.publish(
                    &colon!(TOPIC_ROOM_ID, game.room_id),
                    &ServerToClientWsMsg::Echo {
                        msg: format!("GameEnd"),
                    }
                    .to_json(),
                );
            }
        }
    });
}
