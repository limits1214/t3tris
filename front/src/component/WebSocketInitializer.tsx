import { useEffect, useState } from "react";
// import { useAuthStore } from "../store/useAuthStore";
import useWebSocket from "react-use-websocket";
import { useWsStore } from "../store/useWsStore";
import { getWsToken } from "../api/auth";
import { useRoomStore } from "../store/useRoomStore";
import { useLobbyStore } from "../store/useLobbyStore";
import { useUserStore } from "../store/useUserStore";
const apiUrl = import.meta.env.VITE_WS_URL;

const WebSocketInitializer = () => {
  // const {accessToken} = useAuthStore();
  const [socketUrl, setSocketUrl] = useState<string|null>(null);

  const setSend = useWsStore(s=>s.setSend);
  const setLastMessage = useWsStore(s=>s.setLastMessage);
  const setReadyState = useWsStore(s=>s.setReadyState);

  const userUpdatedIsLogined = useUserStore(s=>s.updatedIsLogined);

  const lobbyUpdateIsEnterd = useLobbyStore(s=>s.updatedIsEnterd);
  const lobbyUpdateUsers = useLobbyStore(s=>s.updateLobbyUsers);
  const lobbyUpdateRooms = useLobbyStore(s=>s.updateRooms);
  const lobbyUpdateChats = useLobbyStore(s=>s.updateLobbyChats);

  // const roomEnter = useRoomStore(s=>s.enter);
  const roomAddChat = useRoomStore(s=>s.addChat);
  const roomUpdate = useRoomStore(s=>s.update);
  


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
        const ws_token = await getWsToken();
        setSocketUrl(`${apiUrl}/ws/haha?ws_token=${ws_token}`);
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
        break;
      case 'topicEcho':
        break;
      case 'userLogined':
        userUpdatedIsLogined(true);
        break;
      case 'userLogouted':
        userUpdatedIsLogined(false);
        break;

      case 'lobbyEntered':
        lobbyUpdateIsEnterd(true);
        break;
      case 'lobbyLeaved':
        lobbyUpdateIsEnterd(false);
        break;
      case 'lobbyUpdated':
        // rooms, user
        lobbyUpdateRooms(data.rooms);
        lobbyUpdateUsers(data.users);
        break;
      case 'lobbyChat':
        lobbyUpdateChats({
          timestamp: data.timestamp,
          user: data.user,
          msg: data.msg
        });
        break;

      case 'roomEntered':
        break;
      case 'roomLeaved':
        break;
      case 'roomUpdated':
        break;
      case 'roomChat':
        break;

      default:
        console.log('ws t not match, t: ', type)
    }
    
  }, [lastMessage])

  return null;
}

export default WebSocketInitializer