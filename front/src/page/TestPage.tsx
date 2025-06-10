import useWebSocket, { ReadyState } from "react-use-websocket";
import CanvasR3f from "../component/CanvasR3f";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";

const TestPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const testCookie = async () => {
    const f = await fetch(`${apiUrl}/api/auth/testcookie`, {
      method: 'GET',
      credentials: 'include'
    });
    const j = await f.json();
    console.log(`j:`, j);
  }
  const testcall = async () => {
    const f = await fetch(`${apiUrl}/api/auth/testcall`, {
      method: 'GET',
      credentials: 'include'
    });
    const j = await f.json();
    console.log(`j:`, j);
  }

  const {isAuthenticated, accessToken, setAuth, logout} = useAuthStore();

  const [socketUrl, setSocketUrl] = useState<string|null>(null);
  const {sendMessage, readyState} = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log('ws on open');
    },
    onClose: () => {
      console.log('ws on close');
    },
    onMessage(event) {
        console.log(event.data)
        
    },
    heartbeat: {
      interval: 1000 * 30,
      message: JSON.stringify({t: 'ping'}),
      returnMessage: JSON.stringify({t: 'pong'}),
    }
  });
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    const wsurl = `${apiUrl}/ws/room/1?token=dummy`

    console.log('wsurl', wsurl)

    const wsConnect = async () => {
      setSocketUrl(wsurl);
    }

    wsConnect();

  }, [apiUrl]);

  const [chat, setChat] = useState('');
  // const [setLatency] = useState<number | null>(null);
  const test_chat_onchg = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChat(e.target.value);
  }

  const test_chat_send = async () => {
    // setLatency(new Date().getTime());
    const obj = {
      t: 'roomChat',
      d: {
        roomId: roomId,
        msg: chat
      }
    }
    sendMessage(JSON.stringify(obj));
  }


  const [roomId, setRoomId] = useState('');
  const room_enter_onchg = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value);
  }
  const room_enter = () => {
    const obj = {
      t: 'roomEnter',
      d: {
        roomId: roomId,
      }
    }
    sendMessage(JSON.stringify(obj));
  }
  const room_leave = () => {
    const obj = {
      t: 'roomLeave',
      d: {
        roomId: roomId,
      }
    }
    sendMessage(JSON.stringify(obj));
  }
  
  return (
    <div>
      TestPage

      <button>login</button>
      <button onClick={testCookie}>test cookie</button>
      <button onClick={testcall}>test call</button>
      
      <hr />
      <div>
        <h1>로그인 상태: {isAuthenticated ? '로그인됨' : '로그아웃'}</h1>
        {isAuthenticated ? (
          <>
            <p>토큰: {accessToken}</p>
            <button onClick={logout}>로그아웃</button>
          </>
        ) : (
          <>
            <button onClick={() => setAuth('dumy')}>로그인</button>
          </>
        )}
      </div>
      <hr />
      <div>
        <h1>ws state: {connectionStatus}</h1>
        <div>
          <input onChange={room_enter_onchg}></input>
          <button onClick={room_enter}>roomenter</button>
        </div>
        <div>
          <button onClick={room_leave}>roomleave</button>
        </div>
        <br />
        <br />
        <div>
          <input onChange={test_chat_onchg}></input>
          <button onClick={test_chat_send}>sendmsg</button>
        </div>
      </div>
      <hr />

      <CanvasR3f></CanvasR3f>
    </div>
  )
}

export default TestPage