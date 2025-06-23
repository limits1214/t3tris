import { Button, Dialog, Flex, TextField } from "@radix-ui/themes"
import { useRoomListStore } from "../store/useRoomListStore";
import { Outlet, useNavigate } from "react-router-dom";
import { useWsStore } from "../store/useWsStore";
import { useEffect, useState } from "react";

const MultiPlayRoomListPage = () => {
  const navigate = useNavigate();
  const send = useWsStore(s=>s.send);
  const rooms = useRoomListStore(s=>s.rooms);
  const roomEnter = (roomId: string) => {
    console.log('roomEnter')
    const obj = {
      type: 'roomEnter',
      data: {
        roomId
      }
    }
    
    send(JSON.stringify(obj));
    navigate(`/multiplay/room?roomId=${roomId}`);
  }
  useEffect(()=>{
    const obj = {
      type: 'roomListUpdateSubscribe',
    }
    send(JSON.stringify(obj))
  }, [send])
  return (
    <>
      <Flex>
        <CreateRoom/>
        <Flex>
          {rooms.map(room=>(
            <Flex key={room.roomId} onClick={()=>roomEnter(room.roomId)}>
              <span>{room.roomName}</span>|
              <span>{room.roomHostUser.nickName}</span>|
              <span>{room.roomUsers.length}</span>
            </Flex>
          ))}
        </Flex>
      </Flex>
      <Outlet/>
    </>
  )
}

export default MultiPlayRoomListPage

const CreateRoom = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const send = useWsStore(s=>s.send);
  const createRoom = () => {
    const obj = {
      type: 'roomCreate',
      data: {
        roomName
      }
    }
    send(JSON.stringify(obj));

    navigate(`/multiplay/room`);
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button>방 만들기</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>방 만들기</Dialog.Title>
        <Dialog.Description>
          방 설정
        </Dialog.Description>

        <TextField.Root placeholder="방 이름" onChange={e=>setRoomName(e.target.value)}></TextField.Root>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" onClick={createRoom}>
                만들기
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              닫기
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}