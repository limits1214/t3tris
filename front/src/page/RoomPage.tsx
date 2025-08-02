/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Box, Button, Dialog, Flex, Select, Table, Text, TextField } from "@radix-ui/themes"
import { useEffect, useRef, useState } from "react"
import { useRoomStore, type GameResult } from "../store/useRoomStore"
import { useWsStore } from "../store/useWsStore"
import { useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { ReadyState } from "react-use-websocket"
import { useWsUserStore } from "../store/useWsUserStore"
import { useKeyboardActionSender } from "../hooks/useWsGameActoinSender"
import { Canvas } from "@react-three/fiber"
import { OrbitControls,  OrthographicCamera,  PerspectiveCamera } from "@react-three/drei"
import { useGameStore } from "../store/useGameStore"
import React from "react"
import * as THREE from 'three'
import { OptTetris, type OptTetrisController } from "../component/r3f/OptTetris"
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const LazyPerf = React.lazy(()=>import('../component/r3f/Perf'));

const RoomPage = () => {
  const wsReadyState = useWsStore(s=>s.readyState)
  const isInitialWsLoginEnd = useWsUserStore(s=>s.isInitialWsLoginEnd);
  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);
  const roomClear = useRoomStore(s=>s.clear);
  const roomSetGameResult = useRoomStore(s=>s.setRoomGameResult);
  const games = useRoomStore(s=>s.games);
  const roomStatus = useRoomStore(s=>s.roomStatus);
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
    roomSetGameResult([]);
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
        
          <GameCanvas/>
        
      </Box>
      <HUD/>
    </Flex>
  )
}

export default RoomPage

const GameCanvas = () => {
  const [isOrth] = useState(true)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null)
  return (
      <Canvas orthographic={isOrth}>
        <LazyPerf position="bottom-left" />
        {isOrth
        ? <OrthographicCamera
            makeDefault
            ref={orthoCameraRef}
            position={[0, 0, 100]}
            near={0.1}
            far={5000}
          />
        : <PerspectiveCamera
            makeDefault
            ref={cameraRef}
            position={[0, 0, 100]}
            near={0.1}
            far={5000}
        />}
        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          enableZoom
          enableRotate
        />
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
        <GameBoard cameraRef={isOrth ? orthoCameraRef : cameraRef} controlsRef={controlsRef} />
      </Canvas>
  )
}

const GameBoard = ({cameraRef, controlsRef}: {cameraRef: React.RefObject<THREE.PerspectiveCamera| THREE.OrthographicCamera |null>, controlsRef: React.RefObject<OrbitControlsImpl|null>}) => {
  const myWsId = useWsUserStore(s=>s.wsId);
  const roomUsers = useRoomStore(s=>s.users);
  const ref = useRef<OptTetrisController | null>(null);

  const games = useRoomStore(s=>s.games);

  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);

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
    for (const [, {wsId, nickName}] of roomUserWsId.entries()) {

      if (tetrisList[wsId]) {
        delete tetrisList[wsId]
      } else {
        if (wsId === myWsId) {
          localRef.boardCreateMy(wsId,{nickName})
        } else {
          localRef.boardCreateBySlot(wsId,{nickName})
        }
        
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
            // console.log(cameraRef.current, controlsRef.current)
            // controlsRef.current?.target.set(to.x + dx, to.y + dy, to.z + dz);
            // cameraRef.current?.position.set(to2.x + dx, to2.y + dy, to2.z + dz);
            // controlsRef.current?.update()
            // console.log(controlsRef.current?.target, cameraRef.current?.position)
          })

          handleSync()
        }

      }
    }

    //to delete
    for (const [k] of Object.entries(tetrisList)) {
      console.log('delete', k)
      localRef.boardDelete(k)
    }

    
  }, [ myWsId, roomUsers])
  const handleSync = () => {
      if (roomId) {
        const nowGameId = games[games.length - 1];
        if (nowGameId) {
          const obj = {
            type: 'gameSync',
            data: {
              gameId: nowGameId,
              roomId,
            }
          };
          send(JSON.stringify(obj));
        }
      }
    }
  useEffect(()=>{
    
    // handleSync()
  }, [games, roomId, send])

  return <OptTetris ref={ref} />
}


const HUD = () => {
  const navigate = useNavigate();
  const roomName = useRoomStore(s=>s.roomName);
  const roomStatus = useRoomStore(s=>s.roomStatus);
  const roomGameType = useRoomStore(s=>s.gameType);

  const myWsId = useWsUserStore(s=>s.wsId);
  const roomUsers = useRoomStore(s=>s.users);
  const hostUser = useRoomStore(s=>s.hostUser);
  // const games = useRoomStore(s=>s.games);
  const roomGameStartTimer = useRoomStore(s=>s.gameStartTimer);

  const roomGameResult = useRoomStore(s=>s.gameResult);

  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);

  const isHost = hostUser?.wsId === myWsId;

  const handleGameStart = () => {
    if (roomGameType === "MultiBattle") {
      if (roomUsers.length === 1) {
        return;
      }
    }

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

  const handleGameTypeChange = (gameType: string) => {
    if (roomId) {
      const obj = {
        type: 'roomGameTypeChange',
        data: {
          roomId,
          gameType
        }
      };
      send(JSON.stringify(obj));
    }
  }

  return (
    <>
      {/* Room */}
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
          <Text>{roomName} ({roomStatus}) / {roomGameType}</Text>
        </Flex>
        <Flex direction="column">
          <Text>Users</Text>
          <Flex direction="column">
            {roomUsers.map((roomUser) =>(
              <Text key={roomUser.wsId}>- {roomUser.nickName} {roomUser.wsId == myWsId ? '(ME)' : ''} {hostUser?.wsId == roomUser.wsId ? '(방장)' : ''}</Text>
            ))}
          </Flex>
        </Flex>
        <Flex direction="column">
          
          
          {isHost && roomStatus === 'Waiting'
          ? (<Button onClick={handleGameStart}>GAME START</Button>)
          : (<></>)}
    
          {/* <Button css={css`pointer-events: auto;`} onClick={handleSync}>Sync</Button> */}
          
          {isHost && 
            <Select.Root defaultValue={roomGameType ?? "MultiScore"} onValueChange={handleGameTypeChange} disabled={roomStatus !== 'Waiting'}>
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>GameType</Select.Label>
                  <Select.Item value="MultiScore">Score</Select.Item>
                  <Select.Item value="Multi40Line">40Line</Select.Item>
                  <Select.Item value="MultiBattle">Battle(최소2명 이상)</Select.Item>
                </Select.Group>
              </Select.Content>
            </Select.Root>
          }
        </Flex>
        <Flex direction="column" css={css`margin-top: 1rem`}>
          <Button css={css`pointer-events: auto;`} onClick={()=> navigate('/')} >Exit</Button>
        </Flex>
      </Flex>

      {/* Game Result*/}
      <Flex
        direction="column"
        css={css`
          position: absolute;
          padding: 1rem;
          border: 1px solid black;
          right: 0px;
          top: 0px;
        `}
      >
      
        {/* <Text>{games[games.length - 1]}</Text> */}
        <Text>GameResult</Text>
        {roomGameResult.map((r, idx)=>(
          <GameResultDialog key={idx} idx={idx} gameResult={r} />
        ))}
        
      </Flex>

    {/* Chat */}
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

      {/* Game Timer */}
      {(roomGameStartTimer !== 0) &&
        <Flex css={css`
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%)
        `}>
          <Flex css={css`
            border: 1px solid black;
            width: 100px;
            height: 100px;
            background: white;
            justify-content: center;
            align-items: center;
            font-size: 50px;
          `}>
            {roomGameStartTimer}
          </Flex>
        </Flex>}
      
    </>
  )
}

/* 

MultiScore result
[[ws_id, nick_name, score]], order score 

Multi40Line result
[[ws_id, nick_name, elapsed, is_40_clear]], order is_40_clear, elapsed

MultiBattle result
[[ws_id, nick_name, elapsed, is_battle_wind]], order elapsed
*/
type GameResultDialogProp = {
  idx: number,
  gameResult: GameResult,
}
const GameResultDialog = ({idx, gameResult, }:GameResultDialogProp) => {
  const roomIsGameResultOpen = useRoomStore(s=>s.isGameResultOpen)
  const roomSetIsGameResultOpen = useRoomStore(s=>s.setIsGameResultOpen)
  const roomGameResult = useRoomStore(s=>s.gameResult);
  
  // open 제어는 최신 result만 적용되게
  return <Dialog.Root
    open={(roomGameResult.length === idx + 1) ? roomIsGameResultOpen : undefined}
    onOpenChange={(roomGameResult.length === idx + 1) ? roomSetIsGameResultOpen : undefined}>
    <Dialog.Trigger>
      <Button onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }}>{idx + 1} {gameResult.gameType}</Button>
    </Dialog.Trigger>

    <Dialog.Content maxWidth="450px">
      <Dialog.Title>{idx + 1} {gameResult.gameType}Result</Dialog.Title>

      <Table.Root css={css`max-height: 400px; overflow-y: auto `}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>No</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>NickName</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Elapsed</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body >
          {gameResult.gameResultInfo.map((r, idx)=>(
            <Table.Row>
              <Table.RowHeaderCell>{idx + 1}</Table.RowHeaderCell>
              <Table.Cell>{r.nickName}</Table.Cell>
              <Table.Cell>{`${format(new Date((r.elapsed ?? 0) ), 'mm:ss:SS')}`}</Table.Cell>
              <Table.Cell>{r.score}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button>Close</Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
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
