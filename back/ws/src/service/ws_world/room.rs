use nanoid::nanoid;

use crate::{
    constant::TOPIC_ROOM_LIST_UPDATE,
    model::{
        ws_msg::ServerToClientWsMsg,
        ws_world::{WsRecvCtx, WsWorldRoom, WsWorldRoomUser, WsWorldUser},
    },
    ws_world::{Room, WsWorldCommand},
};

impl WsRecvCtx<'_> {
    pub async fn room_list_update_subscribe(&mut self) -> anyhow::Result<()> {
        self.topic_subscribe(TOPIC_ROOM_LIST_UPDATE).await?;
        Ok(())
    }
    pub async fn room_list_update_unsubscribe(&mut self) -> anyhow::Result<()> {
        self.topic_subscribe(TOPIC_ROOM_LIST_UPDATE).await?;
        Ok(())
    }
    pub async fn room_create(&mut self, room_name: &str) -> anyhow::Result<()> {
        //
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
        self.ws_world_command_tx
            .send(WsWorldCommand::Room(Room::CreateRoom {
                room: room.clone(),
            }))?;

        // get room list and publish
        let (tx, rx) = tokio::sync::oneshot::channel::<Vec<WsWorldRoom>>();
        self.ws_world_command_tx
            .send(WsWorldCommand::Room(Room::GetRoomList { tx }))?;
        let rooms = rx.await?;
        let server_msg = ServerToClientWsMsg::RoomListUpdated { rooms };
        let server_msg_str = serde_json::to_string(&server_msg)?;
        // self.ws_topic
        //     .publish(TOPIC_ROOM_LIST_UPDATE, &server_msg_str);
        Ok(())
    }
}
