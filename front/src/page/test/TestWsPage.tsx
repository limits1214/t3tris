import {  useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { readyStateString } from "../../util/ws";
import WebSocketInitializer from "../../component/WebSocketInitializer";
import { useWsStore } from "../../store/useWsStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useRoomListStore } from "../../store/useRoomListStore";


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
      <Rooms/>
      <hr />
      <Room/>
    </div>
  )
}

export default TestWsPage

const Topic = () => {
  const send = useWsStore(s=>s.send);
  const [topic, setTopic] = useState('');
  const [echo, setEcho] = useState('');

  const subscribe = () => {
    console.log('subscribe click! topic: ', topic);
    const obj = {
      t: 'subscribeTopic',
      d: {
        topic
      }
    };
    send(JSON.stringify(obj));
  }

  const unsubscribe = () => {
    console.log('unsubscribe click! topic: ', topic)
    const obj = {
      t: 'unSubscribeTopic',
      d: {
        topic
      }
    };
    send(JSON.stringify(obj));
  }

  const topicEcho = () => {
    console.log('topicEcho click! topic: ', topic)
    const obj = {
      t: 'topicEcho',
      d: {
        topic,
        msg: echo
      }
    };
    send(JSON.stringify(obj));
  }

  return (
    <div>
      <h4>Topic</h4>
      <div>
        <input type="text" onChange={e=>setTopic(e.target.value)}/>
        <button onClick={subscribe}>subscribe</button>
        <button onClick={unsubscribe}>unsubscribe</button>
      </div>
      <div>
        <input type="text" onChange={e=>setEcho(e.target.value)}/>
        <button onClick={topicEcho}>topic echo</button>
      </div>
    </div>
  )
}

const Rooms = () => {
  const rooms = useRoomListStore(s=>s.rooms);

  const [roomName, setRoomName] = useState('');
  const send = useWsStore(s=>s.send);
  const createRoom = () => {
    const obj = {
      t: 'roomCreate',
      d: {
        roomName
      }
    }
    send(JSON.stringify(obj));
  }
  const fetchRoom = () => {
    const obj = {
      t: 'roomListFetch',
    }
    send(JSON.stringify(obj));
  }

  const enterRoom = (roomId: string) => {
     const obj = {
      t: 'roomEnter',
      d: {
        roomId
      }
    }
    send(JSON.stringify(obj));
  }
  return (
    <div>
      <div>
        <label htmlFor="">roomName</label>
        <input type="text" onChange={e=>setRoomName(e.target.value)} />
        <button onClick={createRoom}>create</button>
      </div>
      <div>
        <button onClick={fetchRoom}>fetchRoom</button>
      </div>
      
      <div>
        {rooms.map(room=>(
          <div key={room.roomId}>
            <span>{room.roomName}</span>
            <button onClick={()=>enterRoom(room.roomId)}>enter</button>
          </div>
        ))}
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
      t: 'roomChat',
      d: {
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
      t: 'roomLeave',
      d: {
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
      <br />
      {chats.map(v=>(
        <div key={v.timestamp}>
          {v.msg}
        </div>
      ))}
    </div>
  )
}