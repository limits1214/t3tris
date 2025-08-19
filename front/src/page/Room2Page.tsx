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
  const [cameraX, setCameraX] = useState(0);
  const send = useWsStore((s) => s.send);
  const { camera } = useThree();

  // XY만 제한할 박스(2D)
  const min = new THREE.Vector2(-20, -20);
  const max = new THREE.Vector2(20, 20);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // 회전 끄면 offset의 방향은 고정(보통 z축만 차이)
    const offset = new THREE.Vector3().subVectors(
      camera.position,
      controls.target
    );

    const onChange = () => {
      // 1) target을 XY로만 클램프
      const t = controls.target;
      const clampedX = THREE.MathUtils.clamp(t.x, min.x, max.x);
      const clampedY = THREE.MathUtils.clamp(t.y, min.y, max.y);

      // 변화 없으면 조기 종료 (피드백 루프 방지)
      if (t.x === clampedX && t.y === clampedY) return;

      t.set(clampedX, clampedY, t.z);

      // 2) 카메라도 같은 XY로 이동 (오프셋 유지: 보통 z만 차이)
      camera.position.set(t.x + offset.x, t.y + offset.y, t.z + offset.z);

      // 3) 변경 알림
      camera.updateProjectionMatrix();
      controls.update();
    };

    controls.addEventListener("change", onChange);
    return () => controls.removeEventListener("change", onChange);
  }, [camera]);

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
      cur?.setWsSenderGameId(undefined);
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

    for (const [, { wsId, nickName }] of roomUserWsId.entries()) {
      if (tetrisList[wsId]) {
        delete tetrisList[wsId];
      } else {
        if (wsId === myWsId) {
          cur?.createMulitPlayerBoard(wsId, nickName);
        } else {
          cur?.createMultiSubBoard(wsId, nickName);
        }
        if (wsId === myWsId) {
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

      {/* Game */}
      <ClientTetris ref={ref} send={send} />
    </>
  );
};

const HUD = () => {
  const [isRoomUiHide, setIsRoomUiHide] = useState(false);
  return (
    <>
      <Flex
        direction="column"
        css={css`
          background-color: rgba(255, 255, 255, 0.7);
          position: absolute;
          padding: 0.5rem;
          left: 0;
          top: 0;
          width: 250px;
          /* height: 300px; */
          border: 1px solid black;
          pointer-events: none;
          /* z-index: 1; */
        `}
      >
        <Flex
          css={css`
            justify-content: end;
          `}
        >
          <Button
            onClick={() => setIsRoomUiHide(!isRoomUiHide)}
            onKeyDown={(e) => {
              if (e.code === "Space") {
                e.preventDefault();
              }
            }}
            css={css`
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1;
              pointer-events: auto;
            `}
          >
            {isRoomUiHide ? (
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            )}
          </Button>
        </Flex>
        <Flex
          direction="column"
          css={css`
            display: ${isRoomUiHide ? "none" : "block"};
            pointer-events: none;
            /* z-index: 1; */
          `}
        >
          <HUDInfoMenu />
          <HUDChats />
        </Flex>
        <HUDRoomButton />
      </Flex>

      <HUDGameStartTimer />
      <HUDMobileButton />
    </>
  );
};

const HUDInfoMenu = () => {
  const roomIsGameResultOpen = useRoomStore((s) => s.isGameResultOpen);
  const [tab, setTab] = useState("roomInfo");
  useEffect(() => {
    if (roomIsGameResultOpen) {
      setTab("results");
    }
  }, [roomIsGameResultOpen]);
  return (
    <Box
      css={css`
        width: 100%;
        /* height: 250px; */
        max-height: 250px;
        min-height: 200px;
        overflow: auto;
      `}
    >
      <Tabs.Root
        defaultValue="roomInfo"
        value={tab}
        onValueChange={setTab}
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
      {isHost && roomStatus === "Waiting" ? (
        <Button variant="classic" onClick={handleGameStart}>
          GAME START
        </Button>
      ) : (
        <></>
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
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `}
    >
      <Button onClick={() => navigate("/")}>나가기</Button>
      <Help></Help>
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
        margin-top: 1rem;
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

const Help = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button
          variant="classic"
          color="cyan"
          onKeyDown={(e) => {
            if (e.code === "Space") {
              e.preventDefault();
            }
          }}
        >
          Help
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Help</Dialog.Title>
        <strong>게임모드</strong>
        <br />
        Score: 스코어가 가장 높은 사람이 1등 <br />
        40Line: 40라인을 가장 먼저 만드는 사람이 1등 <br />
        Battle: 서로에게 공격 및 방어하며 최후의 1인이 1등 <br />
        (게임모드는 방장만 조작 가능)
        <br />
        <br />
        <br />
        <strong>조작법</strong> <br />
        블럭 왼쪽 움직이기: 화살표 왼키 <br />
        블럭 오른쪽 움직이기: 화살표 오른키 <br />
        블럭 시계방향 회전: 화살표 위키 <br />
        블럭 반시계방향 회전: Z 키 <br />
        블럭 소프트 드랍: 화살표 아래키 <br />
        블럭 하드 드랍: 스페이스바 <br />
        블럭 홀드: 시프트키 <br />
        <br />
        <br />
        <strong>마우스</strong>
        <br />
        휠: 카메라 줌 인아웃
        <br />
        좌,우: 카메라 이동
        <br />
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button>Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
