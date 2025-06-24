/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Text, Avatar, Flex, Grid, TextField, Button } from "@radix-ui/themes"
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { getUserInfo, type UserInfo } from "../api/user";
import { GoogleLoginButton } from "react-social-login-buttons";
import { guestLogin, serverLogout } from "../api/auth";
import { useWsStore } from "../store/useWsStore";
import { readyStateString } from "../util/ws";
import { useLobbyStore } from "../store/useLobbyStore";
import {format} from 'date-fns'

const HomePage = () => {
  // const userIsLogined = useUserStore(s=>s.isLogined);
  // const send = useWsStore(s=>s.send);
  // useEffect(() => {
  //   if(userIsLogined) {

  //   }
  // }, [userIsLogined])
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
      <Flex direction="column" css={css`flex: 1;`}>
        <Text>방만들기</Text>
      </Flex>
    </Flex>
  );
};

const UserInfo = () => {
  const {isAuthenticated, accessToken, logout, setAuth} = useAuthStore();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const send = useWsStore(s=>s.send);
  const readyState = useWsStore(s=>s.readyState);
  useEffect(() => {
    if (isAuthenticated && accessToken && readyStateString(readyState) == 'Open') {
      const fetch = async () => {
        const userInfo = await getUserInfo(accessToken);
        console.log(userInfo)
        setUserInfo(userInfo);
      }
      fetch();

      //ws login
      const obj = {
        type: 'userLogin',
        data: {
          accessToken
        }
      }
      send(JSON.stringify(obj));
    } else {
      setUserInfo(null)
    }
  }, [isAuthenticated, accessToken, readyState])

  const [nickName, setNickName] = useState('');
  const handleGuestLogin = async () =>  {
    if (nickName === '') {
      return;
    }
    try {
      const token = await guestLogin(nickName);
      setAuth(token)
    } catch (e) {
      console.error('e', e);
    }
  }

  const handleLogout = async () => {
    try {
      await serverLogout();
      logout();

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
      {isAuthenticated && userInfo ? (
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
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
        </Grid>
      </Flex>
    </Flex>
  );
};

const RoomListItem = () => {
  return (
    <Flex direction="column" css={css`border: 1px solid black; flex: 1;`}>
      <Flex>
        <Text>001</Text>
        <Text>방제목방제목</Text>
      </Flex>
      <Flex>
        <Text>대기중</Text>
        <Text>노템전</Text>
        <Text>개인전</Text>
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
          <Flex key={lobbyUser.userId}>
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