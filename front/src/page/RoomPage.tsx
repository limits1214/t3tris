/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Box, Button, Flex, Grid, Text, TextField } from "@radix-ui/themes"
import { Suspense, useEffect, useRef, useState } from "react"
import { useRoomStore, type RoomUser } from "../store/useRoomStore"
import { useWsStore } from "../store/useWsStore"
import { useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { ReadyState } from "react-use-websocket"
import { useWsUserStore } from "../store/useWsUserStore"
import { useKeyboardActionSender } from "../hooks/useWsGameActoinSender"
import { Canvas } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { OrbitControls, Text as R3fText } from "@react-three/drei"
import { CuboidCollider, Physics } from "@react-three/rapier"
import { TetrisBoardCase, type TimeController } from "../component/r3f/TetrisBoardCase"
import { convertInstancedTetrimino, TetrisInstancedTetriminos } from "../component/r3f/TetrisInstancedTetriminos"
import { useGameStore, type ServerGameMsg, type ServerTetris } from "../store/useGameStore"
import React from "react"

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

    <Flex direction="column" css={css`height: 100vh; `}>
      <GameCanvas/>
      <HUD/>
    </Flex>

  )
}

export default RoomPage

const GameCanvas = () => {
  const roomUsers = useRoomStore(s=>s.users, );


  return (
    <Box css={css`height: 100%;`}>
      <Canvas>
        <Perf position="bottom-left" />
        <OrbitControls />
        <Suspense>
          <Physics >
            {roomUsers.map((roomUser, idx)=>(
              <group key={roomUser.wsId} position={[idx * 30, 0, 0]}>
                <GameBoard roomUser={roomUser}  />
              </group>
            ))}
{/**/}
            <CuboidCollider position={[5, -23, 0]} args={[120, 0.5, 120]} />

          </Physics>
        </Suspense>
      </Canvas>
    </Box>
  )
}

type GameBoardParam = {
  roomUser: RoomUser
}
// const GameBoard = ({roomUser}: GameBoardParam) => {

//   const serverTetris = useGameStore(s=>s.serverGameMsg?.tetries[roomUser.wsId])
//   const timerRef = useRef<TimeController>(null);
//   return <>
//     <TetrisBoardCase ref={timerRef} isOver={serverTetris?.isGameOver ?? null}/>
    
//     <R3fText position={[ 0, 5, 0]} color="black" scale={1}>{roomUser.nickName}</R3fText>
//     {serverTetris
//       && <TetrisInstancedTetriminos tetriminos={convertInstancedTetrimino(serverTetris.board, serverTetris.next, serverTetris.hold)} isOver={serverTetris?.isGameOver ?? null} />}
    
//   </>
// }
const GameBoard = React.memo(
  ({ roomUser }: GameBoardParam) => {
    const serverTetris = useGameStore(s=>s.serverGameMsg?.tetries[roomUser.wsId])
  const timerRef = useRef<TimeController>(null);
  return <>
    <TetrisBoardCase ref={timerRef} isOver={serverTetris?.isGameOver ?? null}/>
    
    <R3fText position={[ 0, 5, 0]} color="black" scale={1}>{roomUser.nickName}</R3fText>
    {serverTetris
      && <TetrisInstancedTetriminos tetriminos={convertInstancedTetrimino(serverTetris.board, serverTetris.next, serverTetris.hold)} isOver={serverTetris?.isGameOver ?? null} />}
    
  </>
  },
  (prevProps, nextProps) => {
    // ✅ 여기서 동일성 비교
    return (
      prevProps.roomUser.userId === nextProps.roomUser.userId &&
      prevProps.roomUser.wsId === nextProps.roomUser.wsId &&
      prevProps.roomUser.nickName === nextProps.roomUser.nickName
    );
  }
);

const HUD = () => {
  const navigate = useNavigate();
  const roomName = useRoomStore(s=>s.roomName);
  const roomStatus = useRoomStore(s=>s.roomStatus);

  const myUserId = useWsUserStore(s=>s.wsUserId);
  const roomUsers = useRoomStore(s=>s.users);
  const hostUser = useRoomStore(s=>s.hostUser);
  const games = useRoomStore(s=>s.games);

  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);

  const isHost = hostUser?.userId === myUserId;


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
    <>
      <Flex
        direction="column"
        css={css`
          position: absolute;
          padding: 1rem;
          border: 1px solid black;
          left: 0px;
          top: 0px;
        `}
      >
        <Flex>
          <Text>{roomName} ({roomStatus}) / {games[games.length - 1]}</Text>
        </Flex>
        <Flex direction="column">
          <Text>Users</Text>
          <Flex direction="column">
            {roomUsers.map((roomUser) =>(
              <Text>- {roomUser.nickName} {hostUser?.userId == roomUser.userId ? '(방장)' : ''}</Text>
            ))}
          </Flex>
        </Flex>
        <Flex direction="column">
          <Button css={css`pointer-events: auto;`} onClick={()=> navigate('/')}>로비로</Button>
          
          {isHost && roomStatus === 'Waiting'
          ? (<Button onClick={handleGameStart}>GAME START</Button>)
          : (<></>)}
    
        </Flex>
      </Flex>

      <Flex
        direction="column"
        css={css`
          position: absolute;
          padding: 1rem;
          border: 1px solid black;
          right: 0px;
          bottom: 0px;
        `}
      >
        <Flex direction="column" css={css` border: 1px solid black;  width: 30vw`}>
          <Flex direction="column" css={css`width: 100%`} >
            <ChatList/>
          </Flex>
          <Flex>
            <ChatSender/>
          </Flex>
        </Flex>
        {/* {games[games.length - 1]} */}
      </Flex>
    </>
  )
}


const ChatList = () => {
  const roomChast = useRoomStore(s=>s.chats);
  return (
    <Flex
      direction="column"
      css={css`
        height: 20vh;
        overflow:auto;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
      `}>
      {roomChast.map((chat, idx)=>(
        <Flex key={`${chat.timestamp}_${idx}`} css={css` width: 10wh;`}>
          <Text >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
          <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
          <Text >{chat.msg}</Text>
        </Flex>
      ))} 
    </Flex>
  )
}

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
