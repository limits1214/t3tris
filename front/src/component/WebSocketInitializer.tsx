import { useCallback, useEffect } from "react";
// import { useAuthStore } from "../store/useAuthStore";
import useWebSocket from "react-use-websocket";
import { useWsStore } from "../store/useWsStore";
import { beforeTokenCheckAndRefresh, getWsToken } from "../api/auth";
import { useRoomStore, type GameResult, type GameResultInfo } from "../store/useRoomStore";
import { useLobbyStore } from "../store/useLobbyStore";
import { useWsUserStore } from "../store/useWsUserStore";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
const apiUrl = import.meta.env.VITE_WS_URL;

const WebSocketInitializer = () => {
  const wsToken = useWsStore(s=>s.wsToken);
  const setWsToken = useWsStore(s=>s.setWsToken);

  const setSend = useWsStore(s=>s.setSend);
  const setReadyState = useWsStore(s=>s.setReadyState);

  const setIsInitialLoginEnd = useWsUserStore(s=>s.setIsInitialLoginEnd);
  const setIsLogined = useWsUserStore(s=>s.setIsLogined);
  const setWsUserId = useWsUserStore(s=>s.setWsUserId);
  const setWsUserNickName = useWsUserStore(s=>s.setWsUserNickName);
  const setWsId = useWsUserStore(s=>s.setWsId);

  const lobbyUpdateIsEnterd = useLobbyStore(s=>s.updatedIsEnterd);
  const lobbyUpdateUsers = useLobbyStore(s=>s.updateLobbyUsers);
  const lobbyUpdateRooms = useLobbyStore(s=>s.updateRooms);
  const lobbyUpdateChats = useLobbyStore(s=>s.updateLobbyChats);

  // const roomEnter = useRoomStore(s=>s.enter);
  const roomAddChat = useRoomStore(s=>s.addChat);
  const roomUpdate = useRoomStore(s=>s.update);
  const roomAddGameResult = useRoomStore(s=>s.addRoomGameResult)
  const roomSetGameResult = useRoomStore(s=>s.setRoomGameResult);
  const roomSetIsGameResultOpen = useRoomStore(s=>s.setIsGameResultOpen);
  const roomGameStartTimer = useRoomStore(s=>s.setGameStartTimer);

  const setServerGameMsg = useGameStore(s=>s.setServerGameMsg);
  const gameRef = useGameStore(s=>s.gameRef);

  const navigate = useNavigate();

  const getSocketUrl = useCallback( async () => { 
    const wsToken = await getWsToken();
    setWsToken(wsToken)
    return `${apiUrl}/ws/haha?ws_token=${wsToken}`
  }, [wsToken])

// const getSocketUrl = useCallback(async () => {
//   const ws_token = await getWsToken();
//   return `${apiUrl}/ws/haha?ws_token=${ws_token}`
// }, []);
  
  const {sendMessage, readyState} = useWebSocket(getSocketUrl, {
    // shouldReconnect: () => false,
    onOpen: () => {
      console.log('ws on open');
      const afterOpen = async () => {
        const accessToken = await beforeTokenCheckAndRefresh();
        if (accessToken) {
          const obj = {
            type: 'userLogin',
            data: {
              accessToken
            }
          }
          sendMessage(JSON.stringify(obj));
        } else {
          setIsInitialLoginEnd(true)
        }
      }
      afterOpen();
    },
    onClose: () => {
      console.log('ws on close');
    },
    onMessage(event) {
        // console.log('eee',event.data)
        const lastMessageData = event.data;
        // setLastMessage(lastMessageData)
        const {type, data} = JSON.parse(lastMessageData)
        if (type === 'pong') return;
        console.log('lm',lastMessageData)
        switch (type) {
          case 'echo':
            break;
          case 'topicEcho':
            break;

          case 'userLogined':
            setIsInitialLoginEnd(true);
            setIsLogined(true);
            setWsUserId(data.userId);
            setWsUserNickName(data.nickName);
            setWsId(data.wsId);
            break;
          case 'userLoginFailed':
            setIsInitialLoginEnd(true);
            setIsLogined(false);
            setWsUserId(null)
            setWsUserNickName(null);
            setWsId(null);
            break;
          case 'userLogouted':
            setIsInitialLoginEnd(true);
            setIsLogined(false);
            setWsUserId(null);
            setWsUserNickName(null);
            setWsId(null);
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

          case 'roomCreated':
            navigate(`/room/${data.roomId}`);
            break;
          case 'roomEntered':
            break;
          case 'roomLeaved':
            // navigate(`/`);
            break;
          case 'roomUpdated':
            roomUpdate(data.room)
            break;
          case 'roomChat':
            roomAddChat({
              timestamp: data.timestamp,
              user: data.user,
              msg: data.msg
            })
            break;

          case 'gameMsg':
            setServerGameMsg(data)
            console.log('s', data)
            break;
          case 'gameSync':
            // const data = data;
            // console.log('data!!',data.data)
            gameRef?.current?.gameSync(data.data);
            console.log('sync', data.roomResult)
            {
              
              if (Array.isArray(data.roomResult)) {
                const gameResult: GameResult[] = []
                for (const rr of data.roomResult) {
                  const gameResultInfos: GameResultInfo[] = [];
                  if(!rr.result) {
                    continue;
                  }
                  for (const r of rr.result) {
                    if (rr.gameType === "MultiScore") {
                      const result: GameResultInfo = {
                        wsId: r[0],
                        nickName: r[1],
                        score: r[2],
                        elapsed: r[3],
                      };
                      gameResultInfos.push(result);
                    } else if (rr.gameType === "Multi40Line") {
                      const result: GameResultInfo = {
                        wsId: r[0],
                        nickName: r[1],
                        score: r[2],
                        elapsed: r[3],
                        isLine40Clear: r[4],
                      };
                      gameResultInfos.push(result);
                    } else if (rr.gameType === "MultiBattle") {
                      const result: GameResultInfo = {
                        wsId: r[0],
                        nickName: r[1],
                        score: r[2],
                        elapsed: r[3],
                        isBattleWin: r[4],
                      };
                      gameResultInfos.push(result);
                    }
                  }
                  gameResult.push({
                    gameType: rr.gameType,
                    gameResultInfo: gameResultInfos
                  })
                }
                console.log('sync result',gameResult);
                roomSetGameResult(gameResult)
              }
              
            }
            break;
          case 'gameStartTimer':
            // if(data.time === 2) {
            //   //
            // } else if (data.time === 1) {
            //   //
            // } else {
            //   //
            // }
            roomGameStartTimer(data.time)
            break;
          case 'gameEnd':
            {
              const gameResultInfos: GameResultInfo[] = [];
              if (Array.isArray(data.result)) {
                for (const r of data.result) {
                  if (data.gameType === "MultiScore") {
                    const result: GameResultInfo = {
                      wsId: r[0],
                      nickName: r[1],
                      score: r[2],
                      elapsed: r[3],
                    };
                    gameResultInfos.push(result);
                  } else if (data.gameType === "Multi40Line") {
                    const result: GameResultInfo = {
                      wsId: r[0],
                      nickName: r[1],
                      score: r[2],
                      elapsed: r[3],
                      isLine40Clear: r[4],
                    };
                    gameResultInfos.push(result);
                  } else if (data.gameType === "MultiBattle") {
                    const result: GameResultInfo = {
                      wsId: r[0],
                      nickName: r[1],
                      score: r[2],
                      elapsed: r[3],
                      isBattleWin: r[4],
                    };
                    gameResultInfos.push(result);
                  }
                }
              }

              roomAddGameResult({
                gameType: data.gameType,
                gameResultInfo: gameResultInfos,
              });
              roomSetIsGameResultOpen(true)
            }
            
            break;
          case 'gameAction':
            /*w
              {
                "type":"gameAction",
                "data":{
                  "game_id":"ppnuEnBLwqX81ge-mQ-9B",
                  "room_id":"VWEgR-WHTLwkrUcX9QpGG",
                  "action":{
                    "Reqp_9gOX8veBzmzXF4J7":[
                      {"Setup":{"next":["Z","Z","Z","O","S"]}},
                      {"SpawnNext":{"spawned":"Z","added_next":"T"}}
                    ]
                  }
                }
              }

            */
            for (const [k, v] of Object.entries(data.action as string | object)) {
              for (const {action} of v) {
                console.log('action:', action)
                if (typeof action === "object" && action !== null && "setup" in action) {
                  gameRef?.current?.boardReset(k)
                  // v["gameSetup"]
                  // gameRef?.current?.boardSpawnNext(k, )
                  const nexts = action["setup"].next;
                  for (const next of nexts) {
                    gameRef?.current?.nextAdd(k, next)
                  }
                } else if (typeof action === "object" && action !== null && "nextAdd" in action) {
                  const t = action["nextAdd"].next;
                  gameRef?.current?.nextAdd(k, t);
                } else if (typeof action === "object" && action !== null && "spawnFromNext" in action) {
                  const t = action["spawnFromNext"].spawn;
                  gameRef?.current?.spawnFromNext(k, t);
                } else if (typeof action === "object" && action !== null && "spawnFromHold" in action) {
                  const t = action["spawnFromHold"].spawn;
                  const hold = action["spawnFromHold"].hold;
                  gameRef?.current?.spawnFromHold(k, t, hold);
                } else if (typeof action === "object" && action !== null && "holdFalling" in action) {
                  const t = action["holdFalling"].hold
                  gameRef?.current?.holdFalling(k, t);
                } else if (typeof action === "object" && action !== null && "score" in action) {
                  const kind = action["score"].kind
                  const level = action["score"].level
                  const score = action["score"].score
                  const line = action["score"].line
                  const combo = action["score"].combo
                  gameRef?.current?.infoTextUpdate(k, {level, score, line});
                  if (kind === "single" || kind === "double" || kind === "triple" || kind === "tetris"
                    || kind === "tSpinZero" || kind === "tSpinSingle" || kind === "tSpinDouble" || kind === "tSpinTriple" 
                  ) {
                    gameRef?.current?.scoreEffect(k, kind + combo + 'combo')
                  }
                } else if (typeof action === "object" && action !== null && "boardEnd" in action) {
                  const elapsed = action["boardEnd"].elapsed;
                  gameRef?.current?.addEndCover(k, "t");
                  gameRef?.current?.timerOff(k);
                  gameRef?.current?.infoTextUpdate(k, {time: elapsed/1000});
                } else if (typeof action === "object" && action !== null && "garbage" in action) {
                  const queue = action["garbage"].queue;
                  gameRef?.current?.garbageQueueSet(k, queue)
                } else if (typeof action === "object" && action !== null && "garbageAdd" in action) {
                  const emptyx = action["garbageAdd"].empty;
                  gameRef?.current?.garbageAdd(k, emptyx)
                } else if (typeof action === "string" && action === "removeFalling") {
                  gameRef?.current?.removeFalling(k,);
                } else if (typeof action === "string" && action === "moveLeft") {
                  gameRef?.current?.moveLeft(k)
                } else if (typeof action === "string" && action === "moveRight") {
                  gameRef?.current?.moveRight(k)
                } else if (typeof action === "string" && action === "rotateRight") {
                  gameRef?.current?.rotateRight(k)
                } else if (typeof action === "string" && action === "rotateLeft") {
                  gameRef?.current?.rotateLeft(k)
                } else if (typeof action === "string" && action === "softDrop") {
                  gameRef?.current?.step(k)
                } else if (typeof action === "string" && action === "hardDrop") {
                  gameRef?.current?.hardDrop(k)
                } else if (typeof action === "string" && action === "step") {
                  gameRef?.current?.step(k)
                } else if (typeof action === "string" && action === "placing") {
                  gameRef?.current?.placing(k)
                } else if (typeof action === "string" && action === "lineClear") {
                  gameRef?.current?.lineClear(k)
                } 
              }
            }
            
            break;

          default:
            console.log('ws t not match, t: ', type)
        }
    },
    heartbeat: {
      interval: 1000 * 30,
      message: JSON.stringify({type: 'ping'}),
      returnMessage: JSON.stringify({type: 'pong'}),
    }
  });

    // todo accessToken이 바뀐다고 재연결하지 않고
    // 연결이 되면 액세스토큰 바뀌어도 재연결하지않게
    // 만약 연결이 안됬다면, 액세스토큰 바뀔때마다 재연결
  // useEffect(() => {
  //   // if ((readyState === ReadyState.CLOSED || readyState === ReadyState.UNINSTANTIATED)
  //   //     && accessToken && !isTokenExpired(accessToken)) {
  //   //   setSocketUrl(`${apiUrl}/ws/hahaha?access_token=${accessToken}`);
  //   // }
    
  //   connect();
  //   return () => {
  //     console.log('CLEAN')
  //   }
  // }, [socketUrl])

  useEffect(() => {
    setReadyState(readyState)
  }, [readyState, setReadyState])

  useEffect(() => {
    setSend(sendMessage);
  }, [sendMessage, setSend])


  return null;
}

export default WebSocketInitializer