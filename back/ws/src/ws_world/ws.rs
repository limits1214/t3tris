use std::collections::HashMap;

use crate::{
    colon,
    constant::TOPIC_WS_ID,
    ws_world::{
        WsData,
        model::WsWorldUser,
        pubsub::{WsPubSub, WsWorldUserTopicHandle},
    },
};

pub fn get_ws_world_info(data: &mut WsData, pubsub: &mut WsPubSub) -> serde_json::Value {
    let pubsub_info = pubsub
        .pubsub
        .iter()
        .map(|(topic, sender)| (topic, sender.receiver_count()))
        .collect::<Vec<_>>();

    let user_topic = pubsub
        .user_topic_handle
        .iter()
        .map(|(ws_id, h)| (ws_id, h.topics.keys().collect::<Vec<_>>()))
        .collect::<Vec<_>>();
    let j = serde_json::json!({
        "users" : data.users.clone(),
        "rooms" : data.rooms.clone(),
        "games": data.games.clone(),
        "pubsub": pubsub_info,
        "user_topic": user_topic
    });
    j
}

pub fn create_user(
    data: &mut WsData,
    pubsub: &mut WsPubSub,
    user: WsWorldUser,
    ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
) {
    let user_ws_id = user.ws_id.clone();
    data.users.insert(user.ws_id.clone(), user);

    pubsub.user_topic_handle.insert(
        user_ws_id.clone(),
        WsWorldUserTopicHandle {
            sender: ws_sender_tx,
            topics: HashMap::new(),
        },
    );

    pubsub.subscribe(&user_ws_id, &colon!(TOPIC_WS_ID, user_ws_id));
}

pub fn delete_user(data: &mut WsData, pubsub: &mut WsPubSub, ws_id: &str) {
    let mut rooms_to_delete = vec![];

    // 해당 ws_id가 참가중인 방을 추린다.
    for (_, room) in data.rooms.iter_mut() {
        if room
            .room_users
            .iter()
            .any(|(_, room_user)| room_user.ws_id == ws_id)
        {
            rooms_to_delete.push(room.room_id.clone());
        }
    }

    // 해당 사용자 방나가기 프로세스 진행
    for room_id in rooms_to_delete {
        crate::ws_world::room::leave(data, pubsub, ws_id.to_owned(), room_id);
    }

    // 사용자를 지운다.
    data.users.remove(ws_id);

    // 중요!, 사용자가 pubsub 사용중인 task handle 을 지워준다.
    if let Some(user_topic_handle) = pubsub.user_topic_handle.get(ws_id) {
        let topics = user_topic_handle.topics.keys().cloned().collect::<Vec<_>>();
        for topic in topics {
            pubsub.unsubscribe(&ws_id, &topic);
        }
    }
    pubsub.user_topic_handle.remove(ws_id);
}
