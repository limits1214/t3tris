/** @jsxImportSource @emotion/react */

import {
  Box,
  Button,
  Dialog,
  Flex,
  Select,
  Table,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ClientTetris,
  type ClientTetrisController,
} from "../component/r3f/ClientTetris";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import { css } from "@emotion/react";
import { MobileButton } from "../component/MobileButton";
import { useRoomStore, type GameResult } from "../store/useRoomStore";
import { useWsStore } from "../store/useWsStore";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useGameStore } from "../store/useGameStore";
import { useWsUserStore } from "../store/useWsUserStore";

const Room2Page = () => {
  const { roomId } = useParams();
  const isInitialWsLoginEnd = useWsUserStore((s) => s.isInitialWsLoginEnd);
  const send = useWsStore((s) => s.send);
  const roomClear = useRoomStore((s) => s.clear);
  const roomSetGameResult = useRoomStore((s) => s.setRoomGameResult);
  const setServerGameMsg = useGameStore((s) => s.setServerGameMsg);
  useEffect(() => {
    const roomEnter = (roomId: string) => {
      const obj = {
        type: "roomEnter",
        data: {
          roomId,
        },
      };
      send(JSON.stringify(obj));
    };
    if (isInitialWsLoginEnd && roomId) {
      roomEnter(roomId);
    }

    return () => {
      const roomLeave = (roomId: string) => {
        const obj = {
          type: "roomLeave",
          data: {
            roomId,
          },
        };
        send(JSON.stringify(obj));
        roomClear();
        roomSetGameResult([]);
        setServerGameMsg(null);
      };

      if (isInitialWsLoginEnd && roomId) {
        roomLeave(roomId);
      }
    };
  }, [roomId, isInitialWsLoginEnd]);
  return (
    <Box
      css={css`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `}
    >
      <CanvasWrap />
      <HUD />
    </Box>
  );
};

export default Room2Page;

const CanvasWrap = () => {
  const [isOrth] = useState(true);
  return (
    <Canvas orthographic={isOrth}>
      <GameBoard isOrth={isOrth} />
    </Canvas>
  );
};

type GameBoardParam = {
  isOrth: boolean;
};
const GameBoard = ({ isOrth }: GameBoardParam) => {
  const { roomId } = useParams();
  const ref = useRef<ClientTetrisController>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const setGameRef = useGameStore((s) => s.setGameRef);
  const myWsId = useWsUserStore((s) => s.wsId);
  const myNickName = useWsUserStore((s) => s.wsNickName);
  const [cameraX, setCameraX] = useState(0);
  const send = useWsStore((s) => s.send);
  // useEffect(() => {
  //   const cur = ref.current;
  //   if (myWsId && myNickName) {
  //     cur?.createMulitPlayerBoard(myWsId, myNickName);
  //   }
  //   return () => {
  //     if (myWsId) {
  //       cur?.deleteBoard(myWsId);
  //     }
  //   };
  // }, [myNickName, myWsId]);

  useEffect(() => {
    setGameRef(ref);
  }, [setGameRef]);
  const games = useRoomStore((s) => s.games);
  const roomStatus = useRoomStore((s) => s.roomStatus);
  useEffect(() => {
    const cur = ref.current;
    if (roomStatus === "Gaming") {
      const nowGameId = games[games.length - 1];
      if (nowGameId) {
        cur?.setWsSenderGameId(nowGameId);
      }
    } else {
      // setGameId(null)
      cur?.setWsSenderGameId(undefined);
      // roomGameStartTimer(0);
    }
  }, [games, roomStatus]);
  const roomUsers = useRoomStore((s) => s.users);
  useEffect(() => {
    const cur = ref.current;
    const roomUserWsId = roomUsers.map((ru) => ({
      wsId: ru.wsId,
      nickName: ru.nickName,
    }));
    const tetrisList = { ...cur?.getBoards() };
    console.log("roomUserWsId", roomUserWsId);
    console.log("boardist", tetrisList);

    for (const [, { wsId, nickName }] of roomUserWsId.entries()) {
      if (tetrisList[wsId]) {
        delete tetrisList[wsId];
      } else {
        if (wsId === myWsId) {
          cur?.createMulitPlayerBoard(wsId, nickName);
        } else {
          // cur?.boardCreateBySlot(wsId, { nickName });
          cur?.createMultiSubBoard(wsId, nickName);
        }
        if (wsId === myWsId) {
          // TODO
          // handleSync();

          const handleGameSync = () => {
            if (roomId) {
              const nowGameId = games[games.length - 1];
              if (nowGameId) {
                const obj = {
                  type: "gameSync",
                  data: {
                    gameId: nowGameId,
                    roomId,
                  },
                };
                send(JSON.stringify(obj));
              }
            }
          };
          handleGameSync();
        }
      }
    }

    //to delete
    for (const [k] of Object.entries(tetrisList)) {
      console.log("delete", k);
      cur?.deleteBoard(k);
    }
  }, [myWsId, roomUsers]);

  useEffect(() => {
    if (roomUsers.length === 1) {
      setCameraX(0);
    } else {
      setCameraX(13);
    }
  }, [roomUsers]);
  return (
    <>
      {/* camera */}
      {isOrth ? (
        <OrthographicCamera
          makeDefault
          ref={orthoCameraRef}
          position={[cameraX, 0, 10]}
          near={1}
          far={12}
          zoom={20}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[13, 0, 100]}
          near={0.1}
          far={5000}
        />
      )}

      {/* CameraControls */}
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
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* Lights */}
      <ambientLight intensity={1} />
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
        const x = Math.cos(angle) * 100;
        const z = Math.sin(angle) * 100;
        return (
          <directionalLight key={i} position={[x, 100, z]} intensity={1} />
        );
      })}

      <mesh>
        <boxGeometry />
      </mesh>

      {/* Game */}
      <ClientTetris ref={ref} send={send} />
    </>
  );
};

const HUD = () => {
  return (
    <>
      <Flex
        direction="column"
        css={css`
          position: absolute;
          left: 0;
          top: 0;
          /* width: 100dvw; */
          /* height: 100dvh; */

          pointer-events: none;
          /* z-index: 1; */
        `}
      >
        <HUDInfoMenu />
        <HUDChats />
        <HUDRoomButton />
      </Flex>

      <HUDGameStartTimer />
      <HUDMobileButton />
    </>
  );
};

const HUDInfoMenu = () => {
  return (
    <Box
      css={css`
        width: 100%;
      `}
    >
      <Tabs.Root
        defaultValue="roomInfo"
        css={css`
          pointer-events: auto;
        `}
      >
        <Tabs.List>
          <Tabs.Trigger value="roomInfo">Room</Tabs.Trigger>
          <Tabs.Trigger value="userInfo">User</Tabs.Trigger>
          <Tabs.Trigger value="results">Result</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="roomInfo">
            <HUDRoomInfo />
          </Tabs.Content>
          <Tabs.Content value="userInfo">
            <HUDUserInfo />
          </Tabs.Content>
          <Tabs.Content value="results">
            <HUDResults />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
};

const HUDRoomInfo = () => {
  const { roomId } = useParams();
  const send = useWsStore((s) => s.send);
  const roomName = useRoomStore((s) => s.roomName);
  const roomUsers = useRoomStore((s) => s.users);
  const roomStatus = useRoomStore((s) => s.roomStatus);
  const roomGameType = useRoomStore((s) => s.gameType);
  const hostUser = useRoomStore((s) => s.hostUser);
  const myWsId = useWsUserStore((s) => s.wsId);
  const isHost = hostUser?.wsId === myWsId;
  const handleGameStart = () => {
    if (roomGameType === "MultiBattle") {
      if (roomUsers.length === 1) {
        return;
      }
    }

    if (roomId) {
      const obj = {
        type: "roomGameStart",
        data: {
          roomId,
        },
      };
      send(JSON.stringify(obj));
    }
  };
  const handleGameTypeChange = (gameType: string) => {
    if (roomId) {
      const obj = {
        type: "roomGameTypeChange",
        data: {
          roomId,
          gameType,
        },
      };
      send(JSON.stringify(obj));
    }
  };
  return (
    <Flex direction="column">
      <Text>방제목: {roomName}</Text>
      <Text>방상태: {roomStatus}</Text>
      <Text>방장: {hostUser?.nickName}</Text>
      <Text>게임모드: {roomGameType ?? ""}</Text>
      {isHost && roomStatus === "Waiting" ? (
        <Button variant="classic" onClick={handleGameStart}>
          GAME START
        </Button>
      ) : (
        <></>
      )}
      {isHost && (
        <Select.Root
          defaultValue={roomGameType ?? "MultiScore"}
          onValueChange={handleGameTypeChange}
          disabled={roomStatus !== "Waiting"}
        >
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
      )}
    </Flex>
  );
};

const HUDUserInfo = () => {
  const roomUsers = useRoomStore((s) => s.users);
  const myWsId = useWsUserStore((s) => s.wsId);
  const hostUser = useRoomStore((s) => s.hostUser);
  return (
    <Flex direction="column">
      {roomUsers
        .sort((a, b) => {
          if (a.wsId === myWsId) return -1;
          if (b.wsId === myWsId) return 1;
          return 0;
        })
        .map((roomUser) => (
          <Text key={roomUser.wsId}>
            - {roomUser.nickName} {roomUser.wsId == myWsId ? "(본인)" : ""}{" "}
            {hostUser?.wsId == roomUser.wsId ? "(방장)" : ""}
          </Text>
        ))}
    </Flex>
  );
};

const HUDRoomButton = () => {
  const navigate = useNavigate();
  return (
    <Flex
      css={css`
        pointer-events: auto;
      `}
    >
      <Button onClick={() => navigate("/")}>나가기</Button>
    </Flex>
  );
};

const HUDChats = () => {
  const roomChats = useRoomStore((s) => s.chats);
  const { roomId } = useParams();
  const [chat, setChat] = useState("");
  const send = useWsStore((s) => s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [roomChats]);
  const handleSendChat = () => {
    if (roomId) {
      const trimmed = chat.trim();
      console.log("Send: ", trimmed);
      const obj = {
        type: "roomChat",
        data: {
          msg: chat,
          roomId,
        },
      };
      send(JSON.stringify(obj));
      setChat("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      handleSendChat();
    }
  };
  return (
    <Box
      css={css`
        pointer-events: auto;
      `}
    >
      <Flex
        direction="column"
        css={css`
          height: 20vh;
          overflow: auto;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
        `}
      >
        <Flex
          direction="column"
          css={css`
            flex: 1;
            font-size: 12px;
          `}
        >
          {roomChats.map((chat, idx) => (
            <Flex
              key={`${chat.timestamp}_${idx}`}
              css={css`
                width: 10wh;
              `}
            >
              <Text>[{format(new Date(chat.timestamp), "HH:mm:ss")}]</Text>
              <Text>
                {"<"}
                {chat.user.nickName}
                {">"}:&nbsp;
              </Text>
              <Text>{chat.msg}</Text>
            </Flex>
          ))}
          <div ref={bottomRef} />
        </Flex>
      </Flex>

      <Flex
        css={css`
          width: 100%;
        `}
      >
        <TextField.Root
          css={css`
            flex: 1;
            width: 100%;
          `}
          ref={inputRef}
          placeholder="message..."
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          maxLength={100}
        />
        <Button onClick={handleSendChat}>전송</Button>
      </Flex>
    </Box>
  );
};

const HUDResults = () => {
  const roomGameResult = useRoomStore((s) => s.gameResult);
  return (
    <Flex
      direction="column"
      css={css`
        /* width: 15vw; */
        max-height: 400px;
        overflow-y: auto;
      `}
    >
      {roomGameResult.map((r, idx) => (
        <GameResultDialog key={idx} idx={idx} gameResult={r} />
      ))}
    </Flex>
  );
};

/* 

MultiScore result
[[ws_id, nick_name, score]], order score 

Multi40Line result
[[ws_id, nick_name, elapsed, is_40_clear]], order is_40_clear, elapsed

MultiBattle result
[[ws_id, nick_name, elapsed, is_battle_wind]], order elapsed
*/
type GameResultDialogProp = {
  idx: number;
  gameResult: GameResult;
};
const GameResultDialog = ({ idx, gameResult }: GameResultDialogProp) => {
  const roomIsGameResultOpen = useRoomStore((s) => s.isGameResultOpen);
  const roomSetIsGameResultOpen = useRoomStore((s) => s.setIsGameResultOpen);
  const roomGameResult = useRoomStore((s) => s.gameResult);

  // open 제어는 최신 result만 적용되게
  return (
    <Dialog.Root
      open={
        roomGameResult.length === idx + 1 ? roomIsGameResultOpen : undefined
      }
      onOpenChange={
        roomGameResult.length === idx + 1 ? roomSetIsGameResultOpen : undefined
      }
    >
      <Dialog.Trigger>
        <Button
          variant="classic"
          color="bronze"
          onKeyDown={(e) => {
            if (e.code === "Space") {
              e.preventDefault();
            }
          }}
          css={css`
            margin-top: 3px;
          `}
        >
          #{idx + 1} {gameResult.gameType}
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Title>
          #{idx + 1} {gameResult.gameType} Result
        </Dialog.Title>

        <Table.Root
          css={css`
            max-height: 400px;
            overflow-y: auto;
          `}
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>No</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>NickName</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Elapsed</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Line</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {gameResult.gameResultInfo.map((r, idx) => (
              <Table.Row key={idx}>
                <Table.RowHeaderCell>{idx + 1}</Table.RowHeaderCell>
                <Table.Cell>{r.nickName}</Table.Cell>
                <Table.Cell>{`${format(
                  new Date(r.elapsed ?? 0),
                  "mm:ss:SS"
                )}`}</Table.Cell>
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
  );
};

const HUDMobileButton = () => {
  return (
    <Box
      css={css`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `}
    >
      <MobileButton />
    </Box>
  );
};

const HUDGameStartTimer = () => {
  const roomGameStartTimer = useRoomStore((s) => s.gameStartTimer);
  return (
    <>
      {roomGameStartTimer !== 0 && (
        <Flex
          css={css`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          `}
        >
          <Flex
            css={css`
              border: 1px solid black;
              width: 100px;
              height: 100px;
              background: white;
              justify-content: center;
              align-items: center;
              font-size: 50px;
              border-radius: 10px;
            `}
          >
            {roomGameStartTimer}
          </Flex>
        </Flex>
      )}
    </>
  );
};
