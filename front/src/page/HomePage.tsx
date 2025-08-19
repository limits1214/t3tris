/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react";
import { Text, Flex, Grid, TextField, Button, Dialog } from "@radix-ui/themes";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { getUserInfo, type UserInfo } from "../api/user";
import { getWsToken, guestLogin, serverLogout } from "../api/auth";
import { useWsStore } from "../store/useWsStore";
import { useLobbyStore } from "../store/useLobbyStore";
import { format } from "date-fns";
import type { RoomInfo } from "../store/useRoomStore";
import { ReadyState } from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import { useWsUserStore } from "../store/useWsUserStore";
import { gameTypeMap } from "./RoomPage";
import { readyStateString } from "../util/ws";

const HomePage = () => {
  const send = useWsStore((s) => s.send);
  const readyState = useWsStore((s) => s.readyState);
  const isInitialWsLoginEnd = useWsUserStore((s) => s.isInitialWsLoginEnd);
  const wsReadyState = useWsStore((s) => s.readyState);
  const updateLobbyChats = useLobbyStore((s) => s.updateLobbyChats);
  const setWsToken = useWsStore((s) => s.setWsToken);
  const navigate = useNavigate();
  useEffect(() => {
    if (wsReadyState === ReadyState.OPEN) {
      console.log("lobby sub");
      const obj = {
        type: "lobbySubscribe",
      };
      send(JSON.stringify(obj));
      updateLobbyChats([]);
    }
    return () => {
      if (wsReadyState === ReadyState.OPEN) {
        console.log("lobby unsub");
        const obj = {
          type: "lobbyUnSubscribe",
        };
        send(JSON.stringify(obj));
      }
    };
  }, [isInitialWsLoginEnd, send, wsReadyState]);

  return (
    <Flex
      direction="row"
      css={css`
        height: 100dvh;
        padding: 1rem;
      `}
    >
      <Flex
        direction="column"
        css={css`
          border: 1px solid black;
          flex: 1;
          border-radius: 10px;
        `}
      >
        <Flex
          css={css`
            margin: 1rem;
            @media (min-width: 768px) {
              display: none;
            }
          `}
        >
          <MyInfo />
        </Flex>
        <Flex
          justify="between"
          css={css`
            margin-left: 1rem;
            margin-right: 1rem;
            margin-top: 1rem;
          `}
        >
          <Flex>
            <Text
              css={css`
                font-size: 1.5rem;
              `}
            >
              T3TRIS
            </Text>
          </Flex>
          <Flex>
            서버: {readyStateString(readyState)}
            {readyState !== ReadyState.OPEN && (
              <Button
                onClick={() => {
                  const connect = async () => {
                    try {
                      const wsToken = await getWsToken();
                      setWsToken(wsToken);
                    } catch (e) {
                      console.error(e);
                    }
                  };
                  connect();
                }}
              >
                재연결
              </Button>
            )}
          </Flex>
          <Flex>
            <Button
              css={css`
                margin-right: 1rem;
              `}
              onClick={() => navigate("/single")}
            >
              싱글플레이
            </Button>
            {readyState === ReadyState.OPEN && <CreateRoom />}
          </Flex>
        </Flex>
        <Flex
          direction="column"
          css={css`
            flex: 1;
            min-height: 0;
          `}
        >
          <RoomList />
        </Flex>
      </Flex>
      {readyState === ReadyState.OPEN && (
        <Flex
          direction="column"
          css={css`
            width: 30vw;
            @media (max-width: 768px) {
              display: none;
            }
          `}
        >
          <MyInfo />
          <CurrentUser />
          <LobbyChat />
        </Flex>
      )}
    </Flex>
  );
};

export default HomePage;

const LoginWarnDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>로그인 필요합니다.</Dialog.Title>
        <Dialog.Description></Dialog.Description>
        <Flex
          gap="3"
          justify="end"
          css={css`
            margin-top: 10px;
          `}
        >
          <Dialog.Close>
            <Button variant="soft" color="gray">
              닫기
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("");
  const send = useWsStore((s) => s.send);
  const [loginWarnOpen, setLoginWarnOpen] = useState(false);

  const wsUserId = useWsUserStore((s) => s.wsUserId);

  const createRoom = () => {
    const obj = {
      type: "roomCreate",
      data: {
        roomName,
      },
    };
    send(JSON.stringify(obj));
  };
  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button
            onClick={(e) => {
              if (!wsUserId) {
                setLoginWarnOpen(true);
                e.preventDefault();
              }
            }}
          >
            방 만들기
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>방 만들기</Dialog.Title>
          <Dialog.Description>방 설정</Dialog.Description>

          <TextField.Root
            placeholder="방 이름"
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={20}
          ></TextField.Root>

          <Flex
            gap="3"
            justify="end"
            css={css`
              margin-top: 10px;
            `}
          >
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
      <LoginWarnDialog
        open={loginWarnOpen}
        onOpenChange={(open) => setLoginWarnOpen(open)}
      />
    </>
  );
};

const MyInfo = () => {
  const readyState = useWsStore((s) => s.readyState);

  const { logout, setAccessToken, setRefreshToken } = useAuthStore();
  const wsUserId = useWsUserStore((s) => s.wsUserId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const send = useWsStore((s) => s.send);
  useEffect(() => {
    const fetch = async () => {
      const userInfo = await getUserInfo();
      console.log(userInfo);
      setUserInfo(userInfo);
    };
    fetch();
  }, []);

  const [nickName, setNickName] = useState("");
  const handleGuestLogin = async () => {
    if (nickName === "") {
      return;
    }
    try {
      const [accessToken, refreshToken] = await guestLogin(nickName);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      const userInfo = await getUserInfo();
      console.log(userInfo);
      setUserInfo(userInfo);

      const obj = {
        type: "userLogin",
        data: {
          accessToken,
        },
      };
      send(JSON.stringify(obj));
    } catch (e) {
      console.error("e", e);
    }
  };

  const handleLogout = async () => {
    try {
      await serverLogout();
      logout();

      const obj = {
        type: "userLogout",
      };
      send(JSON.stringify(obj));
    } catch (e) {
      console.error("e", e);
    }
  };
  return (
    readyState === ReadyState.OPEN && (
      <Flex
        direction="row"
        css={css`
          padding: 1rem;
          flex: 1;
          border: 1px solid black;
          border-radius: 10px;
        `}
      >
        {wsUserId && userInfo ? (
          <>
            {/*
            <Avatar fallback="A" css={css`flex: 1; height: 100%`}>asdf</Avatar>
          */}
            <Flex
              css={css`
                flex: 1;
              `}
              align="center"
              justify="center"
              direction="column"
            >
              {/*
              <Text>{userInfo?.userId}</Text>
            */}
              <Text>닉네임: {userInfo?.nickName}</Text>
              <Button onClick={handleLogout}>로그아웃</Button>
            </Flex>
          </>
        ) : (
          <>
            <Flex
              direction="column"
              css={css`
                flex: 1;
                justify-content: center;
              `}
            >
              <Flex direction="column">
                <Text>닉네임</Text>
                <TextField.Root
                  placeholder="닉네임 최소 2글자 이상"
                  onChange={(e) => setNickName(e.target.value)}
                  maxLength={10}
                  minLength={2}
                />
                <Flex justify="end">
                  <Button onClick={handleGuestLogin}>게스트 로그인</Button>
                </Flex>
              </Flex>
              {/* <Text>OR</Text>
            <GoogleLoginButton /> */}
            </Flex>
          </>
        )}
      </Flex>
    )
  );
};

const RoomList = () => {
  const readyState = useWsStore((s) => s.readyState);
  const [loginWarnOpen, setLoginWarnOpen] = useState(false);
  const lobbyRooms = useLobbyStore((s) => s.rooms);
  return (
    <Flex
      direction="column"
      css={css`
        padding: 1rem;
        min-height: 0;
        flex: 1;
      `}
    >
      {/* <Flex css={css`border: 1px solid black; flex: 1; width: 100%;`} justify="between">
          <Flex  css={css`flex: 1;`}>
          </Flex>
          <Flex css={css`flex: 1;`}>
          </Flex>
        </Flex> */}
      <Flex
        direction="column"
        css={css`
          border: 1px solid black;
          flex: 1;
          padding: 1rem;
          border-radius: 10px;
          overflow: auto;
        `}
      >
        {readyState === ReadyState.OPEN && (
          <Grid rows="2" columns="2">
            {lobbyRooms.map((roomInfo) => (
              <RoomListItem
                key={roomInfo.roomId}
                roomInfo={roomInfo}
                setLoginWarnOpen={setLoginWarnOpen}
              />
            ))}
          </Grid>
        )}
      </Flex>
      <LoginWarnDialog
        open={loginWarnOpen}
        onOpenChange={(open) => setLoginWarnOpen(open)}
      />
    </Flex>
  );
};

const RoomListItem = ({
  roomInfo,
  setLoginWarnOpen,
}: {
  roomInfo: RoomInfo;
  setLoginWarnOpen: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const wsUserId = useWsUserStore((s) => s.wsUserId);
  const roomEnter = (roomId: string) => {
    navigate(`/room2/${roomId}`);
  };
  return (
    <Flex
      onClick={(e) => {
        if (!wsUserId) {
          setLoginWarnOpen(true);
          e.preventDefault();
          return;
        }
        roomEnter(roomInfo.roomId);
      }}
      direction="column"
      css={css`
        border: 1px solid black;
        flex: 1;
        border-radius: 5px;
        margin: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
      `}
    >
      <Flex direction="column">
        <Text>
          방: {roomInfo.roomName} ({roomInfo.roomStatus}){" "}
        </Text>
        <Text>게임모드: {gameTypeMap(roomInfo.gameType)}</Text>
        <Text>
          방장: {roomInfo.roomHostUser?.nickName}, 참가자:{" "}
          {roomInfo.roomUsers.length}
        </Text>
      </Flex>
    </Flex>
  );
};

const CurrentUser = () => {
  const readyState = useWsStore((s) => s.readyState);
  const lobbyUsers = useLobbyStore((s) => s.lobbyUsers);
  return (
    readyState === ReadyState.OPEN && (
      <Flex
        direction="column"
        css={css`
          flex: 2;
          border: 1px solid black;
          min-height: 0;
          border-radius: 10px;
          padding: 0.5rem;
        `}
      >
        <Text>접속자</Text>
        <Flex
          direction="column"
          css={css`
            overflow: auto;
          `}
        >
          {lobbyUsers.map((lobbyUser) => (
            <Flex key={lobbyUser.wsId}>
              <Text>{lobbyUser.nickName}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    )
  );
};

const LobbyChat = () => {
  const readyState = useWsStore((s) => s.readyState);
  return (
    readyState === ReadyState.OPEN && (
      <Flex
        direction="column"
        css={css`
          flex: 2;
          border: 1px solid black;
          min-height: 0;
          border-radius: 10px;
          padding: 0.5rem;
        `}
      >
        <Chat />
      </Flex>
    )
  );
};

const Chat = () => {
  const lobbyChats = useLobbyStore((s) => s.lobbychats);

  const [chat, setChat] = useState("");
  const send = useWsStore((s) => s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lobbyChats]);

  const handleSendChat = () => {
    const trimmed = chat.trim();
    console.log("Send: ", trimmed);
    const obj = {
      type: "lobbyChat",
      data: {
        msg: chat,
      },
    };
    send(JSON.stringify(obj));
    setChat("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <>
      <Flex
        direction="column"
        css={css`
          overflow: auto;
          flex: 1;
        `}
      >
        {lobbyChats.map((chat, idx) => (
          <Flex key={`${chat.timestamp}_${idx}`}>
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
    </>
  );
};
