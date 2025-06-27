/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Box, Button, Flex, Grid, Text, TextField } from "@radix-ui/themes"
import { useEffect, useRef, useState } from "react"
import { useRoomStore } from "../store/useRoomStore"
import { useWsStore } from "../store/useWsStore"
import { useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { ReadyState } from "react-use-websocket"
import { useWsUserStore } from "../store/useWsUserStore"
import { useKeyboardActionSender } from "../hooks/useWsGameActoinSender"

const RoomPage = () => {
  const wsReadyState = useWsStore(s=>s.readyState)
  const isInitialWsLoginEnd = useWsUserStore(s=>s.isInitialWsLoginEnd);
  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);
  const roomClear = useRoomStore(s=>s.clear);
  const games = useRoomStore(s=>s.games);
  const roomStatus = useRoomStore(s=>s.roomStatus);

  // const [gameId, setGameId] = useState<string | null>(null);
  const setGameId = useKeyboardActionSender();


  useEffect(() => {
    if (roomStatus === 'Gaming') {
      const nowGameId = games[games.length - 1];
      if (nowGameId) {
        setGameId(nowGameId)
      }
    } else {
      setGameId(null)
    }
  }, [games, roomStatus, setGameId])

  const roomEnter = (roomId: string) => {
    const obj = {
      type: 'roomEnter',
      data: {
        roomId
      }
    }
    send(JSON.stringify(obj));
  }

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
  
  useEffect(() => {
    if (roomId) {
      if (wsReadyState === ReadyState.OPEN) {
        if (isInitialWsLoginEnd) {
          roomEnter(roomId);
        }
      }
    }
    return () => {
      if (roomId) {
        if (wsReadyState === ReadyState.OPEN) {
          if (isInitialWsLoginEnd) {
            roomLeave(roomId);
          }
        }
      }
    };
  }, [wsReadyState, roomId, isInitialWsLoginEnd]);
  return (
    <Flex direction="column" css={css`height: 100vh; padding: 1rem;`}>
      <Header/>
      {games[games.length - 1]}
      <Flex css={css`height: 100%;`}>
        <OtherBoard/>
        <MyBoard/>
        <Infomation/>
      </Flex>
    </Flex>
  )
}

export default RoomPage

const Header = () => {
  const roomName = useRoomStore(s=>s.roomName);
  const roomStatus = useRoomStore(s=>s.roomStatus);
  return (
    <Flex>
      <Text>{roomName} {roomStatus}</Text>
    </Flex>
  )
}

const OtherBoard = () => {
  const myUserId = useWsUserStore(s=>s.wsUserId);
  const roomUsers = useRoomStore(s=>s.users);
  const hostUser = useRoomStore(s=>s.hostUser);

  const otherUsers = myUserId
                      ? roomUsers.filter(roomUser=>roomUser.userId != myUserId)
                      : [];

  
  return (
    <Flex css={css`flex: 2; border: 1px solid black;`}>
      <Grid  columns="auto"
        rows="2"
        flow="column"
        >
          {otherUsers.map((roomUser) =>(
            <Board isHost={roomUser
              .userId === hostUser?.userId
            } wsId={roomUser.wsId} userId={roomUser.userId} nickName={roomUser.nickName}/>
          ))}
      </Grid>
    </Flex>
  )
}


const MyBoard = () => {
  const myWsId = useWsUserStore(s=>s.wsId);
  const myUserId = useWsUserStore(s=>s.wsUserId);
  const myNicName = useWsUserStore(s=>s.wsNickName);
  const hostUser = useRoomStore(s=>s.hostUser);

  const isHost = hostUser?.userId === myUserId;

  const send = useWsStore(s=>s.send);
  const roomStatus = useRoomStore(s=>s.roomStatus);
  const {roomId} = useParams();
  const handleGameStart = () => {
    if (roomId) {
      const obj = {
        type: 'roomGameStart',
        data: {
          roomId
        }
      };
      send(JSON.stringify(obj));
    }
  }
  return (
    <Flex css={css`flex: 2; border: 1px solid black;`}>
      <Flex>hold</Flex>
      <Box position="absolute" css={css`left: 50%; top: 50%;`}>
        {isHost && roomStatus === 'Waiting'
        ? (<Button onClick={handleGameStart}>GAME START</Button>)
        : (<></>)}
      </Box>
      <Board isHost={isHost} wsId={myWsId ?? ''} userId={myUserId ?? ''} nickName={myNicName ?? ''}/>
      
      <Flex>next</Flex>
    </Flex>
  )
}

type BoardParams = {
  isHost: boolean,
  wsId: string,
  userId: string
  nickName: string
}
const Board = ({isHost, nickName}: BoardParams) => {
  return (
    <Flex direction="column" css={css`flex:1; border: 1px solid black;`}>
      <Flex  css={css`border: 1px solid black; flex: 1`}>
        GAME AREA
      </Flex>
      <Flex>
        {isHost ? '(방장)': ''}{nickName}
      </Flex>
    </Flex>
  )
}

const Infomation = () => {
  const navigate = useNavigate();
  return (
    <Flex direction="column" css={css`flex: 1; border: 1px solid black; `}>
      <Flex css={css`flex: 1;`}></Flex>
      <Flex css={css`flex: 1;`}>
        BG
      </Flex>
      <Flex direction="column" css={css`flex: 2; border: 1px solid black;`}>
        <Flex direction="column" css={css`flex: 1;`} >
          <ChatList/>
        </Flex>
        <Flex>
          <ChatSender/>
        </Flex>
      </Flex>
      <Flex css={css`flex: 1;`}>
        초대
      </Flex>
      <Button onClick={() => navigate('/')}>로비로</Button>
    </Flex>
  )
}



const ChatList = () => {
  /* const lobbyChats = useLobbyStore(s=>s.lobbychats); */
  const roomChast = useRoomStore(s=>s.chats);
  return (
    <Flex direction="column">
      {roomChast.map((chat, idx)=>(
        <Flex key={`${chat.timestamp}_${idx}`}>
          <Text >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
          <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
          <Text >{chat.msg}</Text>
        </Flex>
      ))} 
    </Flex>
  )
}
/* {lobbyChats.map((chat, idx)=>(
        <Flex key={`${chat.timestamp}_${idx}`}>
          <Text >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
          <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
          <Text >{chat.msg}</Text>
        </Flex>
      ))}  */

const ChatSender = () => {
  const {roomId} = useParams();
  const [chat, setChat] = useState('');
  const send = useWsStore(s=>s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleSendChat = () => {
    if (roomId) {
      const trimmed = chat.trim();
      console.log('Send: ', trimmed);
      const obj = {
        type: 'roomChat',
        data: {
          msg: chat,
          roomId
        }
      };
      send(JSON.stringify(obj));
      setChat('');
      inputRef.current?.focus();
    }
    
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleSendChat();
    }
  }

  

  return (
    <Flex css={css`flex: 1; width: 100%;`}>
      <TextField.Root
        css={css`flex: 1; width: 100%;`}
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
