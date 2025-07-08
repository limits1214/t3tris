/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes"
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
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Text as R3fText } from "@react-three/drei"
import { TetrisBoardCase, type TimeController } from "../component/r3f/TetrisBoardCase"
import { convertInstancedTetrimino, TetrisInstancedTetriminos } from "../component/r3f/TetrisInstancedTetriminos"
import { useGameStore } from "../store/useGameStore"
import React from "react"
import { convertTotalInstancedTetrimino, TotalTetrisInstancedTetriminos,  } from "../component/r3f/TotalTetrisInstancedTetriminos"
import * as THREE from 'three'
import { OptTetris, type OptTetrisController } from "../component/r3f/OptTetris"
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
const RoomPage = () => {
  const wsReadyState = useWsStore(s=>s.readyState)
  const isInitialWsLoginEnd = useWsUserStore(s=>s.isInitialWsLoginEnd);
  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);
  const roomClear = useRoomStore(s=>s.clear);
  const games = useRoomStore(s=>s.games);
  const roomStatus = useRoomStore(s=>s.roomStatus);
;
  const setGameId = useKeyboardActionSender();

  const setServerGameMsg = useGameStore(s=>s.setServerGameMsg);


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
            setServerGameMsg(null);
          }
        }
      }
    };
  }, [wsReadyState, roomId, isInitialWsLoginEnd]);


  return (
    <Flex direction="column" css={css`height: 100vh; `}>
      <Box css={css`height: 100%;`}>
        <Canvas orthographic={false}>
          <GameCanvas/>
        </Canvas>
      </Box>

      <HUD/>
    </Flex>

  )
}

export default RoomPage

const GameCanvas = () => {
  const roomUsers = useRoomStore(s=>s.users, );
  const [isOrth] = useState(false)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null)
  return (
      <>
        <Perf position="bottom-left" />
        <PerspectiveCamera
            makeDefault
            ref={cameraRef}
            position={[0, 0, 100]}
            near={0.1}
            far={5000}
          />
        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          enableZoom
          enableRotate
        />

        <Suspense>
{/* <hemisphereLight intensity={2} position={[0, 10, 0]}/> */}


<ambientLight intensity={1} />
{[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
  const x = Math.cos(angle) * 100;
  const z = Math.sin(angle) * 100;
  return (
    <directionalLight
      key={i}
      position={[x, 100, z]}
      intensity={1}
    />
  );
})}

           <GameBoard3 cameraRef={cameraRef} controlsRef={controlsRef} />

{/*
           <GameBoard2  />
*/}
{/*
            {roomUsers.map((roomUser, idx)=>(
              <group key={roomUser.wsId} position={[idx * 30, 0, 0]}>
                <GameBoard roomUser={roomUser}  />
              </group>
            ))}
 */}
            
{/*
            <Physics >
              <CuboidCollider position={[5, -23, 0]} args={[120, 0.5, 120]} />
          </Physics>
*/}
        </Suspense>
      </>
  )
}

const GameBoard3 = ({cameraRef, controlsRef}: {cameraRef: React.RefObject<THREE.PerspectiveCamera|null>, controlsRef: React.RefObject<OrbitControlsImpl|null>}) => {
  const myWsId = useWsUserStore(s=>s.wsId);
  const roomUsers = useRoomStore(s=>s.users);
  const ref = useRef<OptTetrisController | null>(null);

  const setGameRef = useGameStore((s) => s.setGameRef);

  useEffect(() => {
    setGameRef(ref);
  }, [setGameRef]);

  useEffect(()=>{
    if (ref.current == null) {
      return;
    }

    const localRef = ref.current;
    const roomUserWsId = roomUsers.map(ru => ({wsId: ru.wsId, nickName: ru.nickName}));
    const tetrisList = {...localRef.tetrisGameList()};
    console.log('roomUserWsId', roomUserWsId)
    console.log('boardist', tetrisList)

    // const radius = 40; // 원의 반지름
    // const angleStep = (2 * Math.PI) / roomUserWsId.length;
    for (const [idx, {wsId, nickName}] of roomUserWsId.entries()) {

      if (tetrisList[wsId]) {
        delete tetrisList[wsId]
      } else {
        console.log('to create', wsId)
        //to create
        localRef.boardCreateBySlot(wsId,{nickName})
        if (wsId === myWsId) {
          console.log('###')
          const {position, rotation} = localRef.tetrisInfo(wsId)!.boardTransform;
          const angle = rotation[1] + Math.PI/2;
          const distanceZ = 4.5;
          const offsetX = Math.sin(angle) * distanceZ;
          const offsetZ = Math.cos(angle) * distanceZ;
          const dx = offsetX;
          const dy = -12.5;
          const dz = offsetZ  ;
          const from = new THREE.Vector3(position[0], position[1] , position[2] );
          const to = from.clone().normalize().multiplyScalar(-30).add(from);
          const to2 = to.clone().normalize().multiplyScalar(-10).add(to);
          // cameraRef.current.position.set(to.x + dx, to.y + dy, to.z + dz);
          // controlsRef.current.target.set(position[0] + dx, position[1] + dy, position[2] + dz);

          requestAnimationFrame(()=>{
            console.log(cameraRef.current, controlsRef.current)
            controlsRef.current?.target.set(to.x + dx, to.y + dy, to.z + dz);
            cameraRef.current?.position.set(to2.x + dx, to2.y + dy, to2.z + dz);
            controlsRef.current?.update()
            console.log(controlsRef.current?.target, cameraRef.current?.position)
          })
        }
      }
    }

    //to delete
    for (const [k, v] of Object.entries(tetrisList)) {
      console.log('delete', k)
      localRef.boardDelete(k)
    }
  }, [ myWsId, roomUsers])

  return <OptTetris ref={ref} />
}

const GameBoard2 = () => {
    const serverGameMsg = useGameStore(s=>s.serverGameMsg);
    if (!serverGameMsg){
      return null
    }
    // console.log(serverGameMsg)
    const a = Object.entries(serverGameMsg.tetries).map(([wsId, tetris], idx)=>{
      return {
        boardPosition: [idx * 30 , 0, idx * 30 ],
        boardRotatoin: [0, 0, 0],
        board: tetris.board,
        next: tetris.next,
        hold: tetris.hold
      }
    })
    console.log('abc', a)
  return (
    <TotalTetrisInstancedTetriminos tetriminos={convertTotalInstancedTetrimino(a)} />
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
              <Text key={roomUser.wsId}>- {roomUser.nickName} {hostUser?.userId == roomUser.userId ? '(방장)' : ''}</Text>
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
