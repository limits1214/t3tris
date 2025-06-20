use std::collections::HashMap;

use crate::{
    colon,
    constant::TOPIC_WS_ID,
    ws_world::{WsWorld, WsWorldUserTopicHandle, model::WsWorldUser, pubsub},
};

pub fn get_ws_world_info(world: &mut WsWorld) -> serde_json::Value {
    let pubsub_info = world
        .pubsub
        .iter()
        .map(|(topic, sender)| (topic, sender.receiver_count()))
        .collect::<Vec<_>>();

    let user_topic = world
        .user_topic_handle
        .iter()
        .map(|(ws_id, h)| (ws_id, h.topics.keys().collect::<Vec<_>>()))
        .collect::<Vec<_>>();
    let j = serde_json::json!({
        "users" : world.users.clone(),
        "rooms" : world.rooms.clone(),
        "pubsub": pubsub_info,
        "user_topic": user_topic
    });
    j
}

pub fn create_user(
    world: &mut WsWorld,
    user: WsWorldUser,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
) {
    world.users.push(user.clone());
    world.user_topic_handle.insert(
        user.ws_id.clone(),
        WsWorldUserTopicHandle {
            sender: ws_sender_tx,
            topics: HashMap::new(),
        },
    );

    pubsub::subscribe(world, &user.ws_id, &colon!(TOPIC_WS_ID, user.ws_id));
}

pub fn delete_user(world: &mut WsWorld, ws_id: &str) {
    // room user delete
    let mut v = vec![];
    for r in world.rooms.iter_mut() {
        if let Some(_) = r.room_ws_ids.iter().position(|ru| ru == ws_id) {
            v.push(r.room_id.clone());
        }
    }
    for room_id in v {
        crate::ws_world::room::leave(world, ws_id.to_owned(), room_id);
    }

    //
    if let Some(idx) = world.users.iter().position(|u| u.ws_id == ws_id) {
        world.users.remove(idx);
    } else {
        tracing::warn!("User Delete fail, not find idx");
    };

    // 중요!, 핸들 지우기
    if let Some(user_topic_handle) = world.user_topic_handle.get(ws_id) {
        let topics = user_topic_handle.topics.keys().cloned().collect::<Vec<_>>();
        for topic in topics {
            pubsub::unsubscribe(world, &ws_id, &topic);
        }
    }
    world.user_topic_handle.remove(ws_id);
}
