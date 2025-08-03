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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LazyPerf = React.lazy(()=>import('../component/r3f/Perf'));

export const gameTypeMap = (gameType: string) => {
  if (gameType === "MultiScore") {
    return "Score"
  } else if (gameType === "Multi40Line") {
    return "40Line"
  } else if (gameType === "MultiBattle") {
    return "Battle"
  } else {
    return "?"
  }
}

const RoomPage = () => {
  const wsReadyState = useWsStore(s=>s.readyState)
  const isInitialWsLoginEnd = useWsUserStore(s=>s.isInitialWsLoginEnd);
  const {roomId} = useParams();
  const send = useWsStore(s=>s.send);
  const roomClear = useRoomStore(s=>s.clear);
  const roomSetGameResult = useRoomStore(s=>s.setRoomGameResult);
  const setServerGameMsg = useGameStore(s=>s.setServerGameMsg);

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
  const roomUsers = useRoomStore(s=>s.users);
  const [cameraX, setCameraX] = useState(0);
  useEffect(()=>{
    if (roomUsers.length === 1) {
      setCameraX(0)
    } else{
      setCameraX(13)
    }
  }, [roomUsers])
  return (
      <Canvas orthographic={isOrth}>
        {/* <LazyPerf position="bottom-left" /> */}
        {isOrth
        ? <OrthographicCamera
            makeDefault
            ref={orthoCameraRef}
            position={[cameraX, 0, 10]}
            near={1}
            far={12}
            zoom={20}
          />
        : <PerspectiveCamera
            makeDefault
            ref={cameraRef}
            position={[13, 0, 100]}
            near={0.1}
            far={5000}
        />}
        <OrbitControls
          ref={controlsRef}
          target={[cameraX, 0, 0]}
          enableRotate={false}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.PAN,
          }}
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
        <GameBoard/>
      </Canvas>
  )
}

const GameBoard = () => {
  const myWsId = useWsUserStore(s=>s.wsId);
  const roomUsers = useRoomStore(s=>s.users);
  const ref = useRef<OptTetrisController | null>(null);

  const games = useRoomStore(s=>s.games);
  const setGameId = useKeyboardActionSender();
  const roomStatus = useRoomStore(s=>s.roomStatus);

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
          border-radius: 10px;
          width: 15vw;
          overflow: auto;
        `}
      >
        <Help />
        <Flex direction="column" css={css`border: 1px solid black; border-radius: 5px; margin-top: 1rem;`} >
          <Text>방: {roomName} ({roomStatus})</Text>
          <Text>게임모드: {gameTypeMap(roomGameType ?? "")}</Text>
        </Flex>
        <Flex direction="column" css={css`border: 1px solid black; border-radius: 5px; margin-top: 1rem;`}>
          <Text>참가자</Text>
          <Flex direction="column" css={css`
            max-height: 400px; overflow-y: auto
          `}>
            {roomUsers.sort((a, b)=> {
              if (a.wsId === myWsId) return -1;
              if (b.wsId === myWsId) return 1;
              return 0
            }).map((roomUser) =>(
              <Text key={roomUser.wsId}>- {roomUser.nickName} {roomUser.wsId == myWsId ? '(본인)' : ''} {hostUser?.wsId == roomUser.wsId ? '(방장)' : ''}</Text>
            ))}
          </Flex>
        </Flex>
        {isHost && <Flex direction="column" css={css`margin-top: 1rem`}>
          {isHost && 
            <Select.Root defaultValue={roomGameType ?? "MultiScore"} onValueChange={handleGameTypeChange} disabled={roomStatus !== 'Waiting'}>
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>GameType</Select.Label>
                  <Select.Item value="MultiScore">Score</Select.Item>
                  <Select.Item value="Multi40Line">40Line</Select.Item>
                  <Select.Item value="MultiBattle">Battle(최소 2명)</Select.Item>
                </Select.Group>
              </Select.Content>
            </Select.Root>
          }

          {isHost && roomStatus === 'Waiting'
          ? (<Button variant="classic" onClick={handleGameStart}>GAME START</Button>)
          : (<></>)}
        </Flex>}
        <Flex direction="column" css={css`margin-top: 1rem`}>
          <Button variant="classic" color="crimson" css={css`pointer-events: auto;`} onClick={()=> navigate('/')} >Exit</Button>
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
          border-radius: 10px;
        `}
      >
      
        <Text>GameResults</Text>
        <Flex
          direction="column"
          css={css`
            max-height: 400px;
            overflow-y: auto;
          `}
        >
           {roomGameResult.map((r, idx)=>(
            <GameResultDialog key={idx} idx={idx} gameResult={r} />
          ))}
        </Flex>
       
        
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
          border-radius: 10px;
        `}
      >
        <Flex direction="column" css={css` border: 1px solid black;  width: 30vw`}>
          <Chat/>
          {
            /* <Flex direction="column" css={css`width: 100%`} >
            <ChatList/>
          </Flex>
          <Flex>
            <ChatSender/>
          </Flex> */
          }
        </Flex>
        {/* {games[games.length - 1]} */}
      </Flex>

      {/* Game Timer */}
      {(roomGameStartTimer !== 0) &&
        <Flex css={css`
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          
        `}>
          <Flex css={css`
            border: 1px solid black;
            width: 100px;
            height: 100px;
            background: white;
            justify-content: center;
            align-items: center;
            font-size: 50px;
            border-radius: 10px;
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
      <Button variant="classic" color="bronze" onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }}
      css={css`
        margin-top: 3px;
      `}
      >#{idx + 1} {gameTypeMap(gameResult.gameType)}</Button>
    </Dialog.Trigger>

    <Dialog.Content >
      <Dialog.Title>#{idx + 1} {gameTypeMap(gameResult.gameType)} Result</Dialog.Title>

      <Table.Root css={css`max-height: 400px; overflow-y: auto `}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>No</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>NickName</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Elapsed</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Line</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body >
          {gameResult.gameResultInfo.map((r, idx)=>(
            <Table.Row key={idx}>
              <Table.RowHeaderCell>{idx + 1}</Table.RowHeaderCell>
              <Table.Cell>{r.nickName}</Table.Cell>
              <Table.Cell>{`${format(new Date((r.elapsed ?? 0) ), 'mm:ss:SS')}`}</Table.Cell>
              <Table.Cell>{r.score}</Table.Cell>
              <Table.Cell>{r.clearLine}</Table.Cell>
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

const Help = () => {
  return <Dialog.Root>
    <Dialog.Trigger>
      <Button variant="classic" color="cyan" onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }}>Help</Button>
    </Dialog.Trigger>

    <Dialog.Content maxWidth="450px">
      <Dialog.Title>Help</Dialog.Title>

      <strong>게임모드</strong><br/>
      Score: 스코어가 가장 높은 사람이 1등 <br/>
      40Line: 40라인을 가장 먼저 만드는 사람이 1등 <br/>
      Battle: 서로에게 공격 및 방어하며 최후의 1인이 1등 <br/>
      (게임모드는 방장만 조작 가능)<br/>
      <br/>
      <br/>
      <strong>조작법</strong> <br/>
      블럭 왼쪽 움직이기: 화살표 왼키  <br/>
      블럭 오른쪽 움직이기: 화살표 오른키  <br/>
      블럭 시계방향 회전: 화살표 위키  <br/>
      블럭 반시계방향 회전: Z 키 <br/>
      블럭 소프트 드랍: 화살표 아래키  <br/>
      블럭 하드 드랍: 스페이스바 <br/>
      블럭 홀드: 시프트키 <br/>
      <br/>
      <br/>
      <strong>마우스</strong><br/>
      휠: 카메라 줌 인아웃<br/>
      좌,우: 카메라 이동<br/>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button>Close</Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
}

const Chat = () => {
  const roomChats = useRoomStore(s=>s.chats);

  const {roomId} = useParams();
  const [chat, setChat] = useState('');
  const send = useWsStore(s=>s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomChats]);

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
    <>
      <Flex
        direction="column"
        css={css`
          height: 20vh;
          overflow:auto;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
          
        `}>
          <Flex direction="column" css={css`flex: 1;`}>
            {roomChats.map((chat, idx)=>(
              <Flex key={`${chat.timestamp}_${idx}`} css={css` width: 10wh; `}>
                <Text >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
                <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
                <Text >{chat.msg}</Text>
              </Flex>
            ))} 
          </Flex>
          <div ref={bottomRef} />
      </Flex>

        <Flex css={css`width: 100%;`}>
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
    </>
  )
}

