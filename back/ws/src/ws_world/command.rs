pub enum WsWorldCommand {
    Pubsub(Pubsub),
    Lobby(Lobby),
    Room(Room),
    Ws(Ws),
    Game(Game),
}

pub enum Game {
    Action {
        ws_id: String,
        game_id: String,
        action: GameActionType,
    },
    Sync {
        ws_id: String,
        room_id: String,
        game_id: String,
    },
}
#[derive(Debug)]
pub enum GameActionType {
    Left,
    Right,
    RotateLeft,
    RotateRight,
    HardDrop,
    SoftDrop,
    Hold,
}

pub enum Ws {
    GetWsWorldInfo {
        tx: tokio::sync::oneshot::Sender<serde_json::Value>,
    },
    InitWs {
        ws_id: String,
        // user 가가지고 있는 ws_sender_tx
        ws_sender_tx: tokio::sync::mpsc::UnboundedSender<String>,
    },
    CleanupWs {
        ws_id: String,
    },
    LoginUser {
        ws_id: String,
        user_id: String,
        nick_name: String,
    },
    LogoutUser {
        ws_id: String,
    },
    LoginFailed {
        ws_id: String,
    },
}

pub enum Pubsub {
    Subscribe { ws_id: String, topic: String },
    UnSubscribe { ws_id: String, topic: String },
    Publish { topic: String, msg: String },
    Cleanup,
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
    GameTypeChange {
        ws_id: String,
        room_id: String,
        game_type: String,
    },
}

pub enum Lobby {
    // Enter { ws_id: String },
    // Leave { ws_id: String },
    Subscribe { ws_id: String },
    UnSubscribe { ws_id: String },
    Chat { ws_id: String, msg: String },
}
