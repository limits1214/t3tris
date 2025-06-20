import { useEffect, useState } from "react";
// import { useAuthStore } from "../store/useAuthStore";
import useWebSocket from "react-use-websocket";
import { useWsStore } from "../store/useWsStore";
import { tokenRefresh } from "../api/auth";
import { useRoomStore } from "../store/useRoomStore";
import { useRoomListStore } from "../store/useRoomListStore";
const apiUrl = import.meta.env.VITE_WS_URL;

const WebSocketInitializer = () => {
  // const {accessToken} = useAuthStore();
  const [socketUrl, setSocketUrl] = useState<string|null>(null);

  const setSend = useWsStore(s=>s.setSend);
  const setLastMessage = useWsStore(s=>s.setLastMessage);
  const setReadyState = useWsStore(s=>s.setReadyState);

  // const roomEnter = useRoomStore(s=>s.enter);
  const roomAddChat = useRoomStore(s=>s.addChat);
  const roomUpdate = useRoomStore(s=>s.update);
  

  const roomListUpdate = useRoomListStore(s=>s.updateRoomList);

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
      message: JSON.stringify({type: 'ping'}),
      returnMessage: JSON.stringify({type: 'pong'}),
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
        setSocketUrl(`${apiUrl}/ws/haha?access_token=${accessToken}`);
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
    console.log('lm',lastMessageData)
    setLastMessage(lastMessageData)
    const {type, data} = JSON.parse(lastMessageData)
    
    switch (type) {
      case 'echo':
        console.log('echo message: ', data)
        break;
      case 'topicEcho':
        console.log('topicEcho', data)
        break;
      case 'roomEnter':
        // roomEnter(data.room);
        break;
      case 'roomChat':
        roomAddChat(data);
        break;
      case 'roomListFetch':
        roomListUpdate(data.rooms)
        break;
      case 'roomUpdated':
        roomUpdate(data.room)
        break;
      case 'roomListUpdated':
        roomListUpdate(data.rooms)
        break;
      default:
        console.log('ws t not match, t: ', type)
    }
    
  }, [lastMessage])

  return null;
}

export default WebSocketInitializer