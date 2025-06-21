use crate::ws_world::model::OneShot;

pub enum WsWorldCommand {
    Pubsub(Pubsub),
    Room(Room),
    Ws(Ws),
    Game(Game),
}

pub enum Game {
    Tick,
}

pub enum Ws {
    GetWsWorldInfo {
        tx: OneShot<serde_json::Value>,
    },
    CreateUser {
        // user 정보
        ws_id: String,
        user_id: String,
        nick_name: String,
        // user 가가지고 있는 ws_sender_tx
        ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    },
    DeleteUser {
        ws_id: String,
    },
}

pub enum Pubsub {
    Subscribe { ws_id: String, topic: String },
    UnSubscribe { ws_id: String, topic: String },
    Publish { topic: String, msg: String },
}

// TODO: Kick, Ban, Invite,
pub enum Room {
    Create {
        ws_id: String,
        room_name: String,
    },
    // 마지막 인원은 방 제거
    Leave {
        ws_id: String,
        room_id: String,
    },
    Enter {
        ws_id: String,
        room_id: String,
    },
    Chat {
        ws_id: String,
        room_id: String,
        msg: String,
    },
    RoomListSubscribe {
        ws_id: String,
    },
    RoomListUnSubscribe {
        ws_id: String,
    },
    GameReady {
        ws_id: String,
        room_id: String,
    },
    GameUnReady {
        ws_id: String,
        room_id: String,
    },
    GameStart {
        ws_id: String,
        room_id: String,
    },
}
