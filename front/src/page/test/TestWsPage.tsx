import {  useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { readyStateString } from "../../util/ws";
import WebSocketInitializer from "../../component/WebSocketInitializer";
import { useWsStore } from "../../store/useWsStore";


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
  const [roomName, setRoomName] = useState('');
  const send = useWsStore(s=>s.send);
  const createRoom = () => {
    const obj = {
      t: 'createRoom',
      d: {

      }
    }
  }
  const fetchRoom = () => {
    const obj = {
      t: 'createRoom',
      d: {

      }
    }
    
  }
  return (
    <div>
      <div>
        <label htmlFor="">roomName</label>
        <input type="text" onChange={e=>setRoomName(e.target.value)} />
        <button>create</button>
      </div>
      <div>
        <button>fetchRoom</button>
      </div>
    </div>
  )
}