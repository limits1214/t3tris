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
import { Canvas } from "@react-three/fiber"
import { OrbitControls,  OrthographicCamera,  PerspectiveCamera } from "@react-three/drei"
import { useGameStore } from "../store/useGameStore"
import React from "react"
import * as THREE from 'three'
import { OptTetris, type OptTetrisController } from "../component/r3f/OptTetris"
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useWindowSize } from "../hooks/useWindowSize"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const LazyPerf = React.lazy(()=>import('../component/r3f/Perf'));

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
    <Flex direction="column"
    css={css`
      height: 100dvh;
      width: 100dwh;
      -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
      -webkit-user-select: none;   /* 텍스트 선택 막기 (iOS/Android) */
      user-select: none;
      /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
      touch-action: manipulation; /* 더블탭 확대 방지 */
    `}>
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
          touches={{
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN
,
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
  // const setGameId = useKeyboardActionSender();
  const roomStatus = useRoomStore(s=>s.roomStatus);
  const roomGameStartTimer = useRoomStore(s=>s.setGameStartTimer);
  useEffect(() => {
    if (roomStatus === 'Gaming') {
      const nowGameId = games[games.length - 1];
      if (nowGameId) {
        // setGameId(nowGameId)
        ref.current?.setGameId(nowGameId)
      }
    } else {
      // setGameId(null)
      ref.current?.setGameId(null)
      roomGameStartTimer(0)
    }
  }, [games, roomStatus])

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

  const {width} = useWindowSize();

  useEffect(()=>{
    if (width < 768) {
      setIsChatUiHide(true);
      setIsResultUiHide(true);
    }
  }, [width])

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

  const [isRoomUiHide, setIsRoomUiHide] = useState(false);
  const [isResultUiHide, setIsResultUiHide] = useState(false);
  const [isChatUiHide, setIsChatUiHide] = useState(false);

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
          background-color: white;
          overflow: auto;
          z-index: 1;
        `}
      > 
        <Flex css={css` `}>
          <Text>Room</Text>
          <Button 
            onClick={()=>setIsRoomUiHide(!isRoomUiHide)}
            css={css`
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1;
            `}
            >
              {isRoomUiHide
              ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              : <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>}
              
          </Button>
        </Flex>
        <Box css={css`
          display: ${isRoomUiHide ? "none" : "block"};
          @media (minx-width: 768px) {
            width: 20vw;
          }
          @media (max-width: 768px) {
            width: 55vw;
          }
        `}>
          <Flex direction="column" css={css`border: 1px solid black; border-radius: 5px; margin-top: 1rem;`} >
            <Text>방: {roomName} ({roomStatus})</Text>
            <Text>게임모드: {gameTypeMap(roomGameType ?? "")}</Text>
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
          

          <Flex direction="column" css={css`margin-top: 1rem;`}>
            <Help />
          </Flex>
        </Box>

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
          
          @media (max-width: 768px) {
            top: 0%;
            right: 50%;
            transform: translate(50%, -0%);
          }
        `}
      >
        <Flex css={css`justify-content: center;`}>
          <Text>Result</Text>
          <Button 
            onClick={()=>setIsResultUiHide(!isResultUiHide)}
            css={css`
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
            >
              {isResultUiHide
              ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              : <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>}
          </Button>
        </Flex>
        <Flex
          direction="column"
          css={css`
            margin-top: 1rem;
            /* width: 15vw; */
            max-height: 400px;
            overflow-y: auto;
            display: ${isResultUiHide ? "none" : ""};
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
          border-radius: 10px;
          background-color: white;
          z-index: 1;
          @media (max-width: 768px) {
            top: 0px;
          }
          @media (min-width: 768px) {
            bottom: 0px;
          }
        `}
      >
        <Flex css={css`justify-content: end;`}>
          <Text>Chat</Text>
          <Button 
            onClick={()=>setIsChatUiHide(!isChatUiHide)}
            css={css`
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
            >
            {isChatUiHide
              ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              : <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>}
          </Button>
        </Flex>
        <Flex direction="column" css={css`
           margin-top: 1rem;
            border: 1px solid black;
            display: ${isChatUiHide ? "none" : ""};
            @media (min-width: 768px) {
              width: 30vw;
            }
            @media (max-width: 768px) {
              width: 60vw;
            }
        `}>
          <Chat/>
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

        {/*  */}
        <MobileButton/>
    </>
  )
}

const MobileButton = () => {
  const dispatch = (key: string, keyEvent: string) => {
    const event = new KeyboardEvent(keyEvent, {
      key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  }

  const moveRightKeydownDispatch = () => {
    dispatch("ArrowRight", "keydown")
  }

  const moveRightKeyupDispatch = () => {
    dispatch("ArrowRight", "keyup")
  }

  const moveLeftKeydownDispatch = () => {
    dispatch("ArrowLeft", "keydown")
  }

  const moveLeftKeyupDispatch = () => {
    dispatch("ArrowLeft", "keyup")
  }

  const rotateRightKeydownDispatch = () => {
    dispatch("w", "keydown")
  }

  const rotateRightKeyupDispatch = () => {
    dispatch("w", "keyup")
  }

  const rotateLeftKeydownDispatch = () => {
    dispatch("z", "keydown")
  }

  const rotateLeftKeyupDispatch = () => {
    dispatch("z", "keyup")
  }

  const softDropKeydownDispatch = () => {
    dispatch("ArrowDown", "keydown")
  }

  const softDropKeyupDispatch = () => {
    dispatch("ArrowDown", "keyup")
  }

  const hardDropKeydownDispatch = () => {
    dispatch(" ", "keydown")
  }

  const hardDropKeyupDispatch = () => {
    dispatch(" ", "keyup")
  }

  const holdKeydownDispatch = () => {
    dispatch("Shift", "keydown")
  }

  const holdKeyupDispatch = () => {
    dispatch("Shift", "keyup")
  }
  
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent zoom
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);
  return (
    <Flex
      ref={ref}
      direction="column"
      css={css`
        position: absolute;
        /* width: 50wh; */
        max-width: 100dvw;
        transform: translate(-50%, 0%);
        bottom: 0%;
        left: 50%;
        display: none;
        border: 1px solid black;
        border-radius: 30px;
        padding: 0.5rem;
        @media (max-width: 768px) {
          display: block;
        }
      `}
    >
      <Flex >
        <Flex css={css`align-items: center; margin: 0.5rem;`}>
          {/* Hold */}
          <Button
            onPointerDown={holdKeydownDispatch}
            onPointerUp={holdKeyupDispatch}
            onPointerCancel={holdKeyupDispatch}
            onPointerLeave={holdKeyupDispatch}
            variant="classic"
            css={css`
                padding: 1.5rem;
                height: 100%;
            `}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
          </Button>
        </Flex>
        <Flex direction="column" css={css` `}>
          <Flex css={css`justify-content: space-between; margin-bottom: 0.5rem;`}>
            {/* rotateLeft */}
            <Button
              onPointerDown={rotateLeftKeydownDispatch}
              onPointerUp={rotateLeftKeyupDispatch}
              onPointerCancel={rotateLeftKeyupDispatch}
              onPointerLeave={rotateLeftKeyupDispatch}
              variant="classic"
              css={css`
                padding: 1.5rem;
              `}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.3536 11.3536C11.5488 11.1583 11.5488 10.8417 11.3536 10.6465L4.70711 4L9 4C9.27614 4 9.5 3.77614 9.5 3.5C9.5 3.22386 9.27614 3 9 3L3.5 3C3.36739 3 3.24021 3.05268 3.14645 3.14645C3.05268 3.24022 3 3.36739 3 3.5L3 9.00001C3 9.27615 3.22386 9.50001 3.5 9.50001C3.77614 9.50001 4 9.27615 4 9.00001V4.70711L10.6464 11.3536C10.8417 11.5488 11.1583 11.5488 11.3536 11.3536Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </Button>

            {/* rotateRight */}
            <Button
              onPointerDown={rotateRightKeydownDispatch}
              onPointerUp={rotateRightKeyupDispatch}
              onPointerCancel={rotateRightKeyupDispatch}
              onPointerLeave={rotateRightKeyupDispatch}
              variant="classic"
              css={css`
                padding: 1.5rem;
              `}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </Button>
          </Flex>
          <Flex >
            {/* moveLeft */}
            <Button
              onPointerDown={moveLeftKeydownDispatch}
              onPointerUp={moveLeftKeyupDispatch}
              onPointerCancel={moveLeftKeyupDispatch}
              onPointerLeave={moveLeftKeyupDispatch}
              variant="classic" css={css`margin-right: 0.5rem; padding: 1.5rem;`}
              >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </Button>

            {/* softDrop */}
            <Button
              onPointerDown={softDropKeydownDispatch}
              onPointerUp={softDropKeyupDispatch}
              onPointerCancel={softDropKeyupDispatch}
              onPointerLeave={softDropKeyupDispatch}
              variant="classic" 
              css={css`
              padding: 1.5rem;
            `}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </Button>

            {/* moveRight */}
            <Button
              onPointerDown={moveRightKeydownDispatch}
              onPointerUp={moveRightKeyupDispatch}
              onPointerCancel={moveRightKeyupDispatch}
              onPointerLeave={moveRightKeyupDispatch}
              variant="classic" css={css`margin-left: 0.5rem; padding: 1.5rem;`}
              >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </Button>
          </Flex>
        </Flex>

        <Flex  css={css`align-items: center; margin: 0.5rem;`}>
          {/* hardDrop */}
          <Button
            onPointerDown={hardDropKeydownDispatch}
            onPointerUp={hardDropKeyupDispatch}
            onPointerCancel={hardDropKeyupDispatch}
            onPointerLeave={hardDropKeyupDispatch}
            variant="classic"
            css={css`
              padding: 1.5rem;
              height: 100%;
            `}
            >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.85355 2.14645C3.65829 1.95118 3.34171 1.95118 3.14645 2.14645C2.95118 2.34171 2.95118 2.65829 3.14645 2.85355L7.14645 6.85355C7.34171 7.04882 7.65829 7.04882 7.85355 6.85355L11.8536 2.85355C12.0488 2.65829 12.0488 2.34171 11.8536 2.14645C11.6583 1.95118 11.3417 1.95118 11.1464 2.14645L7.5 5.79289L3.85355 2.14645ZM3.85355 8.14645C3.65829 7.95118 3.34171 7.95118 3.14645 8.14645C2.95118 8.34171 2.95118 8.65829 3.14645 8.85355L7.14645 12.8536C7.34171 13.0488 7.65829 13.0488 7.85355 12.8536L11.8536 8.85355C12.0488 8.65829 12.0488 8.34171 11.8536 8.14645C11.6583 7.95118 11.3417 7.95118 11.1464 8.14645L7.5 11.7929L3.85355 8.14645Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
          </Button>
        </Flex>
      </Flex>
    </Flex>
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', });
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

          <Flex direction="column" css={css`flex: 1; font-size: 12px;`}>
            {roomChats.map((chat, idx)=>(
              <Flex key={`${chat.timestamp}_${idx}`} css={css` width: 10wh; `}>
                <Text  >[{format(new Date(chat.timestamp), 'HH:mm:ss')}]</Text>
                <Text >{"<"}{chat.user.nickName}{">"}:&nbsp;</Text>
                <Text >{chat.msg}</Text>
              </Flex>
            ))} 
          <div ref={bottomRef} />
          </Flex>
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
            maxLength={100}
          />
          <Button onClick={handleSendChat}>전송</Button>
        </Flex>
    </>
  )
}

