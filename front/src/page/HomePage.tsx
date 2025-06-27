/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Text, Avatar, Flex, Grid, TextField, Button, Dialog } from "@radix-ui/themes"
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
  // const isWsLogined = useUserStore(s=>s.isWsLogined);
  const wsReadyState = useWsStore(s=>s.readyState)

  useEffect(() => {
    if (wsReadyState === ReadyState.OPEN) {
      console.log('lobby sub')
        const obj = {
          type: 'lobbySubscribe'
        }
        send(JSON.stringify(obj))
      if (isInitialWsLoginEnd) {
        // console.log('lobby sub')
        // const obj = {
        //   type: 'subscribeTopic',
        //   data: {
        //     topic: 'lobby'
        //   }
        // }
        // send(JSON.stringify(obj))
        // if (isLogined) {
        //   console.log('lobby enter')
        //   const obj = {
        //     type: 'lobbyEnter'
        //   }
        //   send(JSON.stringify(obj))
        // } else {
        //   console.log('lobby sub')
        //   const obj = {
        //     type: 'subscribeTopic',
        //     data: {
        //       topic: 'lobby'
        //     }
        //   }
        //   send(JSON.stringify(obj))
        // }
        
      }
    }
    return () => {
      if (wsReadyState === ReadyState.OPEN) {
        console.log('lobby unsub')
          const obj = {
            type: 'lobbyUnSubscribe'
          }
          send(JSON.stringify(obj))
        if (isInitialWsLoginEnd) {
          // console.log('lobby unsub')
          // const obj = {
          //   type: 'unSubscribeTopic',
          //   data: {
          //     topic: 'lobby'
          //   }
          // }
          // send(JSON.stringify(obj))


          // if (isLogined) {
          //   console.log('lobby leave')
          //   const obj = {
          //     type: 'lobbyLeave'
          //   }
          //   send(JSON.stringify(obj))
          // } else {
          //   console.log('lobby unsub')
          //   const obj = {
          //     type: 'unSubscribeTopic',
          //     data: {
          //       topic: 'lobby'
          //     }
          //   }
          //   send(JSON.stringify(obj))
          // }
        }
      }
    }
  }, [isInitialWsLoginEnd, send, wsReadyState])
  return (
    <Flex direction="column" css={css`height: 100vh; padding: 1rem; min-height: 0`}>
      <Flex css={css`border: 1px solid black; flex: 1; `}>
        <Flex css={css`border: 1px solid red; flex: 2.5;`}>
          <LobbyHeader/>
        </Flex>
        <Flex css={css`border: 1px solid red; flex: 1;`}>
          <UserInfo/>
        </Flex>
      </Flex>
      <Flex css={css`border: 1px solid black; flex: 2.5; min-height: 0; `}>
        <Flex css={css`border: 1px solid red; flex: 2.5;`}>
          <RoomList/> 
        </Flex>
        <Flex css={css`border: 1px solid red; flex: 1;`}>
          <LobbyInfo/>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default HomePage;

const LobbyHeader = () => {
  return (
    <Flex justify="between" css={css`width: 100%`}>
      <Flex css={css`flex: 1;`}>Logo</Flex>
      <Flex direction="column" css={css`flex: 1;`} justify="center">
        <CreateRoom/>
      </Flex>
    </Flex>
  );
};

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

const UserInfo = () => {
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

      /* const obj2 = {
        type: 'lobbyEnter'
      }
      send(JSON.stringify(obj2)) */
    } catch (e) {
      console.error('e', e);
    }
  }

  const handleLogout = async () => {
    try {
      await serverLogout();
      logout();


      /* const obj2 = {
        type: 'lobbyLeave'
      }
      send(JSON.stringify(obj2)) */

      //ws login
      const obj = {
        type: 'userLogout',
      }
      send(JSON.stringify(obj));

    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <Flex direction="row" css={css`flex: 1; padding: 1rem`}>
      <Text>{JSON.stringify(wsUserId)}</Text>
      {wsUserId && userInfo ? (
        <>
          <Avatar fallback="A" css={css`flex: 1; height: 100%`}>asdf</Avatar>
          <Flex css={css`flex: 1;`} direction="column" align="center" justify="center">
            <Text>{userInfo?.userId}</Text>
            <Text>별명: {userInfo?.nickName}</Text>
            <Text>승률: x</Text>
            <Button onClick={handleLogout}>로그아웃</Button>
          </Flex>
        </>
      ) : (
        <>
          <Flex direction="column" css={css`width: 100%; min-height: 0; overflow: hidden`}>
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
    <Flex direction="column" css={css`padding: 1rem; width:100%;`}>
      <Flex css={css`border: 1px solid black; flex: 1; width: 100%;`} justify="between">
        <Flex  css={css`flex: 1;`}>
          <Text>sort1</Text>
          <Text>sort2</Text>
          <Text>sort3</Text>
        </Flex>
        <Flex css={css`flex: 1;`}>
          <Text>공지</Text>
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

const LobbyInfo = () => {
  return (
    <Flex direction="column" css={css`width: 100%;`}>
      <CurrentUser/>
      <LobbyChat/>
    </Flex>
  );
}

const CurrentUser = () => {
  const lobbyUsers = useLobbyStore(s=>s.lobbyUsers);
  return (
    <Flex direction="column"  css={css`flex: 1; border: 1px solid black;`}>
      <Text >접속자</Text>
      <Flex direction="column" >
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
    <Flex direction="column" css={css`flex: 1; border: 1px solid black;`}>
      <Flex direction="column" css={css`flex: 1;`} >
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
    <Flex direction="column">
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