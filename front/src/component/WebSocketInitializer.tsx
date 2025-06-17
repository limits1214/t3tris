import { useEffect, useState } from "react";
// import { useAuthStore } from "../store/useAuthStore";
import useWebSocket from "react-use-websocket";
import { useWsStore } from "../store/useWsStore";
import { tokenRefresh } from "../api/auth";
const apiUrl = import.meta.env.VITE_WS_URL;

const WebSocketInitializer = () => {
  // const {accessToken} = useAuthStore();
  const [socketUrl, setSocketUrl] = useState<string|null>(null);

  const setSend = useWsStore(s=>s.setSend);
  const setLastMessage = useWsStore(s=>s.setLastMessage);
  const setReadyState = useWsStore(s=>s.setReadyState);

  const {sendMessage, lastMessage, readyState} = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log('ws on open');
    },
    onClose: () => {
      console.log('ws on close');
    },
    // onMessage(event) {
    //     console.log(event.data)
    // },
    heartbeat: {
      interval: 1000 * 30,
      message: JSON.stringify({t: 'ping'}),
      returnMessage: JSON.stringify({t: 'pong'}),
    }
  });

    // todo accessToken이 바뀐다고 재연결하지 않고
    // 연결이 되면 액세스토큰 바뀌어도 재연결하지않게
    // 만약 연결이 안됬다면, 액세스토큰 바뀔때마다 재연결
  useEffect(() => {
    // if ((readyState === ReadyState.CLOSED || readyState === ReadyState.UNINSTANTIATED)
    //     && accessToken && !isTokenExpired(accessToken)) {
    //   setSocketUrl(`${apiUrl}/ws/hahaha?access_token=${accessToken}`);
    // }
    const connect = async () => {
      try {
        const accessToken = await tokenRefresh();
        setSocketUrl(`${apiUrl}/ws/hahaha?access_token=${accessToken}`);
      } catch (e) {
        console.error(e)
      }
    }
    connect();
  }, [])

  useEffect(() => {
    setReadyState(readyState)
  }, [readyState])

  useEffect(() => {
    setSend(sendMessage);
  }, [sendMessage])

  useEffect(() => {
    if (!lastMessage) {
      return;
    }
    const lastMessageData = lastMessage.data;
    // console.log(lastMessageData)
    setLastMessage(lastMessageData)
    const {t, d} = JSON.parse(lastMessageData)
    
    switch (t) {
      case 'echo':
        console.log('echo message: ', d)
        break;
      case 'topicEcho':
        console.log('topicEcho', d)
        break;
      default:
        console.log('ws t not match, t: ', t)
    }
    
  }, [lastMessage])

  return null;
}

export default WebSocketInitializer