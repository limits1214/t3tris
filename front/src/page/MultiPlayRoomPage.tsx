/** @jsxImportSource @emotion/react */

import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes"
import { useEffect, useRef, useState } from "react";
import {  useLocation, useNavigate } from "react-router-dom"
import { useWsStore } from "../store/useWsStore";
import { useRoomStore } from "../store/useRoomStore";
import { format } from 'date-fns';
import { css } from "@emotion/react";


const MultiPlayRoomPage = () => {
  const navigate = useNavigate();
  const send = useWsStore(s=>s.send);
  const { search } = useLocation();
  const roomId = useRoomStore(s=>s.roomId);
  const roomName = useRoomStore(s=>s.roomName);
  const hostUser = useRoomStore(s=>s.hostUser);
  const roomUsers = useRoomStore(s=>s.users);
  const roomClear = useRoomStore(s=>s.clear);

  const roomLeave = (roomId: string) => {
    const obj = {
      type: 'roomLeave',
      data: {
        roomId
      }
    }
    send(JSON.stringify(obj));
    roomClear();
  }

  useEffect(()=>{
    if (!roomId) {
      return;
    }
    const searchParams = new URLSearchParams(search);
    const qsRoomId = searchParams.get('roomId');
    if (!qsRoomId && roomId) {
      console.log('setNavigate');
      searchParams.set('roomId', roomId);
      navigate({
        pathname: location.pathname,
        search: searchParams.toString()
      })
    }
    
  }, [navigate, roomId, search])

  const hasMountedRef = useRef(false);
  useEffect(()=>{
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    
    return () => {
      if (hasMountedRef.current) {
        if (roomId) {
          console.log('room leave')
          roomLeave(roomId);
          
        }
      }
    }
  },[])
  return (
    <Flex direction="row" justify={"center"}>
      <RoomLeft></RoomLeft>
      <RoomCenter></RoomCenter>
      <RoomRight></RoomRight>
    </Flex>
   
  )
}
 // <div>
      
      {/* <Button onClick={()=>navigate('/multiplay')}>Back</Button>
      <br/>
      <Text>roomId: {roomId}</Text>
      <br/>
      <Text>roomName: {roomName}</Text>
      <br/>
      <Text>host: {hostUser?.nickName}</Text>
      <br/>
      {roomUsers.map((user)=>(
        <Flex key={user.wsId}>
          <Text >roomUsers: {user.nickName}</Text>
          <br/>
        </Flex>
      ))}
      <br/>
      
      <Chat/> */}
    // </div>
export default MultiPlayRoomPage

const RoomLeft = () => {
  return (
    <Flex direction="column" css={css`border: 1px solid black; flex: 1;`}>
      유저
      {
        
      }
    </Flex>
  )
}

const RoomCenter = () => {
  return (
    <Flex direction="column" css={css`border: 1px solid black;  flex: 2;`}>
      정보
    </Flex>
  )
}

const RoomRight = () => {
  return (
    <Flex direction="column" css={css`border: 1px solid black;  flex: 1;`}>
      <Text>채팅</Text>

    </Flex>
  )
}

const Chat = () => {
  return (
    <Box>
      <ChatList></ChatList>
      <ChatSender/>
    </Box>
  )
}

const ChatList = () => {
  const roomChats = useRoomStore(s=>s.chats);
  return (
    <Flex direction="column">
      {roomChats.map((chat, idx)=>(
        <Flex key={`${chat.timestamp}_${idx}`}>
          <Text >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
          <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
          <Text >{chat.msg}</Text>
        </Flex>
      ))}
    </Flex>
  )
}

const ChatSender = () => {
  const roomId = useRoomStore(s=>s.roomId);
  const [chat, setChat] = useState('');
  const send = useWsStore(s=>s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleSendChat = () => {
    const trimmed = chat.trim();
    console.log('Send: ', trimmed);
    const obj = {
      type: 'roomChat',
      data: {
        roomId,
        msg: chat
      }
    };
    send(JSON.stringify(obj));
    setChat('');
    inputRef.current?.focus();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleSendChat();
    }
  }

  return (
    <Flex>
      <TextField.Root
        ref={inputRef}
        placeholder="message..."
        value={chat}
        onChange={e=>setChat(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={()=>setIsComposing(true)}
        onCompositionEnd={()=>setIsComposing(false)}
      />
      <Button onClick={handleSendChat}>전송</Button>
    </Flex>
  )
}