import {  useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { readyStateString } from "../../util/ws";
import WebSocketInitializer from "../../component/WebSocketInitializer";
import { useWsStore } from "../../store/useWsStore";
import { useRoomStore } from "../../store/useRoomStore";


const TestWsPage = () => {
  const {accessToken} = useAuthStore();
  const readyState = useWsStore(s=>s.readyState);
  const connectionStatus = readyStateString(readyState)

  return (
    <div>
      <WebSocketInitializer/>
      <h1>TestWsPage</h1>
      <p>connectionStatus: {connectionStatus}</p>
      <p>access_token: {accessToken}</p>
      <hr />
      <Topic/>
      <hr />
      {/* <Rooms/> */}
      <hr />
      <Room/>
    </div>
  )
}

export default TestWsPage

const Topic = () => {
  const send = useWsStore(s=>s.send);
  const [topic, setTopic] = useState('');
  const [topicEcho, setTopicEcho] = useState('');

  const subscribe = () => {
    console.log('subscribe click! topic: ', topic);
    const obj = {
      type: 'subscribeTopic',
      data: {
        topic
      }
    };
    send(JSON.stringify(obj));
  }

  const unsubscribe = () => {
    console.log('unsubscribe click! topic: ', topic)
    const obj = {
      type: 'unSubscribeTopic',
      data: {
        topic
      }
    };
    send(JSON.stringify(obj));
  }

  const hanleTopicEcho = () => {
    console.log('topicEcho click! topic: ', topicEcho)
    const obj = {
      type: 'topicEcho',
      data: {
        topic,
        msg: topicEcho
      }
    };
    send(JSON.stringify(obj));
  }

  const [echo, setEcho] = useState('');
  const handleEcho = () => {
    const obj = {
      type: 'echo',
      data: {
        msg: echo
      }
    };
    send(JSON.stringify(obj));
  }
  return (
    <div>
      <h4>Topic</h4>
      <div>
        <p>echo</p>
        <input type="text" onChange={e=>setEcho(e.target.value)}/>
        <button onClick={handleEcho}>echo</button>
      </div>
      <hr />
      <div>
        <p>subscribe/unsubscribe topic</p>
        <input type="text" onChange={e=>setTopic(e.target.value)}/>
        <button onClick={subscribe}>subscribe</button>
        <button onClick={unsubscribe}>unsubscribe</button>
      </div>
      <div>
        <p>topicEhco</p>
        <input type="text" onChange={e=>setTopicEcho(e.target.value)}/>
        <button onClick={hanleTopicEcho}>topic echo</button>
      </div>
    </div>
  )
}


const Room = () => {
  const send = useWsStore(s=>s.send);

  const roomId = useRoomStore(s=>s.roomId);
  const roomName = useRoomStore(s=>s.roomName);
  const hostUser = useRoomStore(s=>s.hostUser);
  const users = useRoomStore(s=>s.users);
  const chats = useRoomStore(s=>s.chats);
  const roomLeave = useRoomStore(s=>s.leave);

  const [chat, setChat] = useState('');

  const sendChat = () => {
    if (!roomId) {
      return;
    }
    const obj = {
      type: 'roomChat',
      data: {
        roomId,
        msg: chat
      }
    };
    send(JSON.stringify(obj));
  }

  const sendRoomLeave = () => {
    if (!roomId) {
      return;
    }
    const obj = {
      type: 'roomLeave',
      data: {
        roomId
      }
    };
    send(JSON.stringify(obj));
    roomLeave();
  }

  return (
    <div>
      <h4>Room</h4>
      <p>roomId: {roomId}</p>
      <p>roomName: {roomName}</p>
      <p>hostUser: {JSON.stringify(hostUser)}</p>
      <p>users: {JSON.stringify(users)}</p>
      <label>chat</label>
      <input type="text" onChange={e=>setChat(e.target.value)} />
      <button onClick={sendChat}>chat</button>
      <br />
      <button onClick={sendRoomLeave}>roomLeave</button>
      <button onClick={() => {
        const obj = {
          type: 'roomGameReady',
          data: {
            roomId
          }
        };
        send(JSON.stringify(obj));
      }}>game ready</button>
      <button onClick={() => {
        const obj = {
          type: 'roomGameUnReady',
          data: {
            roomId
          }
        };
        send(JSON.stringify(obj));
      }}>game unready</button>
      <button onClick={() => {
        const obj = {
          type: 'roomGameStart',
          data: {
            roomId
          }
        };
        send(JSON.stringify(obj));
      }}>game start</button>
      <br />
      {chats.map(v=>(
        <div key={v.timestamp}>
          [{v.timestamp}][{v.user.nickName}]: {v.msg}
        </div>
      ))}
    </div>
  )
}

