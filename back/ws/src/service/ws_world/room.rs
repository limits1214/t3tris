use nanoid::nanoid;

use crate::{
    constant::TOPIC_ROOM_LIST_UPDATE,
    model::ws_world::{WsRecvCtx, WsWorldRoom, WsWorldRoomUser},
    ws_world::{Room, WsWorldCommand},
};

impl WsRecvCtx<'_> {
    pub fn room_list_update_subscribe(&mut self) {
        self.topic_subscribe(TOPIC_ROOM_LIST_UPDATE);
    }
    pub fn room_list_update_unsubscribe(&mut self) {
        self.topic_unsubscribe(TOPIC_ROOM_LIST_UPDATE);
    }
    pub fn room_create(&mut self, room_name: &str) {
        let room_user = WsWorldRoomUser {
            user_id: self.user_id.to_owned(),
            ws_id: self.ws_id.to_owned(),
            nick_name: self.nick_name.to_owned(),
        };
        let room_id = nanoid!();
        let room = WsWorldRoom {
            room_id: room_id,
            room_name: room_name.to_owned(),
            // room_status: todo!(),
            room_host: room_user.clone(),
            room_users: vec![room_user],
            room_event: vec![],
        };
        let _ = self
            .ws_world_command_tx
            .send(WsWorldCommand::Room(Room::Create { room: room.clone() }));
    }
}
