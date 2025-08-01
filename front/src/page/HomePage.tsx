/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Text,  Flex, Grid, TextField, Button, Dialog } from "@radix-ui/themes"
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { getUserInfo, type UserInfo } from "../api/user";
import { GoogleLoginButton } from "react-social-login-buttons";
import { guestLogin, serverLogout } from "../api/auth";
import { useWsStore } from "../store/useWsStore";
import { useLobbyStore } from "../store/useLobbyStore";
import {format} from 'date-fns'
import type { RoomInfo } from "../store/useRoomStore";
import { ReadyState } from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import { useWsUserStore } from "../store/useWsUserStore";

const HomePage = () => {
  const send = useWsStore(s=>s.send);
  const isInitialWsLoginEnd = useWsUserStore(s=>s.isInitialWsLoginEnd);
  const wsReadyState = useWsStore(s=>s.readyState)

  useEffect(() => {
    if (wsReadyState === ReadyState.OPEN) {
      console.log('lobby sub')
        const obj = {
          type: 'lobbySubscribe'
        }
        send(JSON.stringify(obj))
    }
    return () => {
      if (wsReadyState === ReadyState.OPEN) {
        console.log('lobby unsub')
          const obj = {
            type: 'lobbyUnSubscribe'
          }
          send(JSON.stringify(obj))
      }
    }
  }, [isInitialWsLoginEnd, send, wsReadyState])
  return (
    <Flex direction="row" css={css`height: 100vh; padding: 1rem;`}>
      <Flex direction="column" css={css`border: 1px solid black; flex: 1`} >
        <Flex justify="between">
          <Text>T3TRIS</Text>
          <CreateRoom/>
        </Flex>
        <Flex direction="column" css={css`flex: 1;`}>
          <RoomList/>
        </Flex>
      </Flex>
      <Flex direction="column" css={css`border: 1px solid black; `}>
        <MyInfo />
        <CurrentUser/>
        <LobbyChat/>
      </Flex>
    </Flex>
  )
}

export default HomePage;

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const send = useWsStore(s=>s.send);
  const createRoom = () => {
    const obj = {
      type: 'roomCreate',
      data: {
        roomName
      }
    }
    send(JSON.stringify(obj));
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button>방 만들기</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>방 만들기</Dialog.Title>
        <Dialog.Description>
          방 설정
        </Dialog.Description>

        <TextField.Root placeholder="방 이름" onChange={e=>setRoomName(e.target.value)}></TextField.Root>

        <Flex gap="3" justify="end">
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
  )
}

const MyInfo = () => {
  const { logout, setAuth} = useAuthStore();
  const wsUserId = useWsUserStore(s=>s.wsUserId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const send = useWsStore(s=>s.send);
  useEffect(() => {
    const fetch = async () => {
      const userInfo = await getUserInfo();
      console.log(userInfo)
      setUserInfo(userInfo);
    }
    fetch();
  }, [])

  const [nickName, setNickName] = useState('');
  const handleGuestLogin = async () =>  {
    if (nickName === '') {
      return;
    }
    try {
      const accessToken = await guestLogin(nickName);
      setAuth(accessToken)

      const userInfo = await getUserInfo();
      console.log(userInfo)
      setUserInfo(userInfo);

      const obj = {
        type: 'userLogin',
        data: {
          accessToken
        }
      }
      send(JSON.stringify(obj));
    } catch (e) {
      console.error('e', e);
    }
  }

  const handleLogout = async () => {
    try {
      await serverLogout();
      logout();

      const obj = {
        type: 'userLogout',
      }
      send(JSON.stringify(obj));
    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <Flex direction="row" css={css`padding: 1rem; flex: 1;`}>
      {wsUserId && userInfo ? (
        <>
          {/*
            <Avatar fallback="A" css={css`flex: 1; height: 100%`}>asdf</Avatar>
          */}
          <Flex css={css`flex: 1;`} direction="column" align="center" justify="center">
            {/*
              <Text>{userInfo?.userId}</Text>
            */}
            <Text>별명: {userInfo?.nickName}</Text>
            <Button onClick={handleLogout}>로그아웃</Button>
          </Flex>
        </>
      ) : (
        <>
          <Flex direction="column" css={css``}>
            <Flex direction="column">
              <Text>게스트</Text>
              <TextField.Root placeholder="nick name" onChange={e=>setNickName(e.target.value)}/>
              <Flex justify="end">
                <Button onClick={handleGuestLogin}>게스트 로그인</Button>
              </Flex>
            </Flex>
            <Text>OR</Text>
            <GoogleLoginButton />
          </Flex>
        </>
      )}
    </Flex>
  );
};

const RoomList = () => {
  const lobbyRooms = useLobbyStore(s=>s.rooms);
  
  return (
    <Flex direction="column" css={css`padding: 1rem; flex: 1;`}>
      <Flex css={css`border: 1px solid black; flex: 1; width: 100%;`} justify="between">
        <Flex  css={css`flex: 1;`}>
        {/*
          <Text>sort1</Text>
          <Text>sort2</Text>
          <Text>sort3</Text>
        */}
        </Flex>
        <Flex css={css`flex: 1;`}>
          
        </Flex>
      </Flex>
      <Flex direction="column" css={css`border: 1px solid black; flex: 10; padding: 1rem;`} overflowY={"auto"}>
        <Grid rows="2" columns="2">
        {lobbyRooms.map(roomInfo=>(
          <RoomListItem key={roomInfo.roomId} roomInfo={roomInfo}/>
        ))}
        </Grid>
      </Flex>
    </Flex>
  );
};

const RoomListItem = ({roomInfo}: {roomInfo: RoomInfo}) => {
  const navigate = useNavigate();
  /* const send = useWsStore(s=>s.send); */
  const roomEnter = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }
  return (
    <Flex onClick={()=>roomEnter(roomInfo.roomId)} direction="column" css={css`border: 1px solid black; flex: 1;`}>
      <Flex>
        <Text>-</Text>
        <Text>{roomInfo.gameType}</Text>
        <Text>-</Text>
        <Text>{roomInfo.roomName}</Text>
      </Flex>
      <Flex>
        <Text>host: {roomInfo.roomHostUser?.nickName}</Text>
        <Text>users: {roomInfo.roomUsers.length}</Text>
        <Text>-</Text>
      </Flex>
    </Flex>
  )
}

const CurrentUser = () => {
  const lobbyUsers = useLobbyStore(s=>s.lobbyUsers);
  return (
    <Flex direction="column"  css={css`flex: 2; border: 1px solid black; min-height: 0`}>
      <Text >접속자</Text>
      <Flex direction="column" css={css`overflow: auto;`}>
        {lobbyUsers.map(lobbyUser=>(
          <Flex key={lobbyUser.wsId}>
            <Text>{lobbyUser.nickName}</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

const LobbyChat = () => {
  return (
    <Flex direction="column" css={css`flex: 2; border: 1px solid black; min-height: 0`}>
      <Flex direction="column" css={css`flex: 1; min-height: 0`} >
        <ChatList/>
      </Flex>
      <Flex>
        <ChatSender/>
      </Flex>
    </Flex>
  )
}



const ChatList = () => {
  const lobbyChats = useLobbyStore(s=>s.lobbychats);
  return (
    <Flex direction="column" css={css`overflow: auto;`}>
      {lobbyChats.map((chat, idx)=>(
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
  const [chat, setChat] = useState('');
  const send = useWsStore(s=>s.send);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleSendChat = () => {
    const trimmed = chat.trim();
    console.log('Send: ', trimmed);
    const obj = {
      type: 'lobbyChat',
      data: {
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