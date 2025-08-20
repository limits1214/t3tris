import { useCallback, useEffect } from "react";
import useWebSocket from "react-use-websocket";
import { useWsStore } from "../store/useWsStore";
import { beforeTokenCheckAndRefresh, getWsToken } from "../api/auth";
import {
  useRoomStore,
  type GameResult,
  type GameResultInfo,
} from "../store/useRoomStore";
import { useLobbyStore } from "../store/useLobbyStore";
import { useWsUserStore } from "../store/useWsUserStore";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
const apiUrl = import.meta.env.VITE_WS_URL;

const WebSocketInitializer = () => {
  const setWsToken = useWsStore((s) => s.setWsToken);

  const setSend = useWsStore((s) => s.setSend);
  const setReadyState = useWsStore((s) => s.setReadyState);

  const setIsInitialLoginEnd = useWsUserStore((s) => s.setIsInitialLoginEnd);
  const setIsLogined = useWsUserStore((s) => s.setIsLogined);
  const setWsUserId = useWsUserStore((s) => s.setWsUserId);
  const setWsUserNickName = useWsUserStore((s) => s.setWsUserNickName);
  const setWsId = useWsUserStore((s) => s.setWsId);

  const lobbyUpdateIsEnterd = useLobbyStore((s) => s.updatedIsEnterd);
  const lobbyUpdateUsers = useLobbyStore((s) => s.updateLobbyUsers);
  const lobbyUpdateRooms = useLobbyStore((s) => s.updateRooms);
  const addLobbyChats = useLobbyStore((s) => s.addLobbyChats);

  // const roomEnter = useRoomStore(s=>s.enter);
  const roomAddChat = useRoomStore((s) => s.addChat);
  const roomUpdate = useRoomStore((s) => s.update);
  const roomAddGameResult = useRoomStore((s) => s.addRoomGameResult);
  const roomSetGameResult = useRoomStore((s) => s.setRoomGameResult);
  const roomSetIsGameResultOpen = useRoomStore((s) => s.setIsGameResultOpen);
  const roomGameStartTimer = useRoomStore((s) => s.setGameStartTimer);

  const setServerGameMsg = useGameStore((s) => s.setServerGameMsg);
  const gameRef = useGameStore((s) => s.gameRef);

  const navigate = useNavigate();
  const wsToken = useWsStore((s) => s.wsToken);
  const getSocketUrl = useCallback(async () => {
    const wt = await getWsToken();
    setWsToken(wt);
    return `${apiUrl}/ws/haha?ws_token=${wt}`;
  }, [wsToken]);

  const { sendMessage, readyState } = useWebSocket(getSocketUrl, {
    shouldReconnect: (closeEvent) => {
      // 정상 종료(1000)면 재연결 안 함
      return closeEvent.code !== 1000;
    },
    reconnectAttempts: 4000,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    onOpen: () => {
      console.log("ws on open");
      const afterOpen = async () => {
        const accessToken = await beforeTokenCheckAndRefresh();
        if (accessToken) {
          const obj = {
            type: "userLogin",
            data: {
              accessToken,
            },
          };
          sendMessage(JSON.stringify(obj));
        } else {
          setIsInitialLoginEnd(true);
        }
      };
      afterOpen();
    },
    onClose: () => {
      console.log("ws on close");
    },
    onMessage(event) {
      // console.log('eee',event.data)
      const lastMessageData = event.data;
      // setLastMessage(lastMessageData)
      const { type, data } = JSON.parse(lastMessageData);
      if (type === "pong") return;
      // console.log("lm", lastMessageData);
      switch (type) {
        case "echo":
          break;
        case "topicEcho":
          break;

        case "userLogined":
          setIsInitialLoginEnd(true);
          setIsLogined(true);
          setWsUserId(data.userId);
          setWsUserNickName(data.nickName);
          setWsId(data.wsId);
          break;
        case "userLoginFailed":
          setIsInitialLoginEnd(true);
          setIsLogined(false);
          setWsUserId(null);
          setWsUserNickName(null);
          setWsId(null);
          break;
        case "userLogouted":
          setIsInitialLoginEnd(true);
          setIsLogined(false);
          setWsUserId(null);
          setWsUserNickName(null);
          setWsId(null);
          break;

        case "lobbyEntered":
          lobbyUpdateIsEnterd(true);
          break;
        case "lobbyLeaved":
          lobbyUpdateIsEnterd(false);
          break;
        case "lobbyUpdated":
          // rooms, user
          lobbyUpdateRooms(data.rooms);
          lobbyUpdateUsers(data.users);
          break;
        case "lobbyChat":
          addLobbyChats({
            timestamp: data.timestamp,
            user: data.user,
            msg: data.msg,
          });
          break;

        case "roomCreated":
          navigate(`/room/${data.roomId}`);
          break;
        case "roomEntered":
          break;
        case "roomLeaved":
          // navigate(`/`);
          break;
        case "roomUpdated":
          roomUpdate(data.room);
          break;
        case "roomChat":
          roomAddChat({
            timestamp: data.timestamp,
            user: data.user,
            msg: data.msg,
          });
          break;

        case "gameMsg":
          setServerGameMsg(data);
          console.log("s", data);
          break;
        case "gameSync":
          // const data = data;
          // console.log('data!!',data.data)
          gameRef?.current?.gameSync(data.data);
          console.log("sync", data.roomResult);
          {
            if (Array.isArray(data.roomResult)) {
              const gameResult: GameResult[] = [];
              for (const rr of data.roomResult) {
                const gameResultInfos: GameResultInfo[] = [];
                if (!rr.result) {
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
                  gameResultInfo: gameResultInfos,
                });
              }
              console.log("sync result", gameResult);
              roomSetGameResult(gameResult);
            }
          }
          break;
        case "gameBoardSync":
          // {
          //   const myboardId = gameRef?.current?.getMyBoardId();
          //   if (myboardId) {
          //     gameRef?.current?.gameBoardSync(myboardId, data.data);
          //     gameRef?.current?.boardSyncUnLock();
          //   }
          // }
          break;
        case "gameStartTimer":
          roomGameStartTimer(data.time);
          break;
        case "gameEnd":
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
                    clearLine: r[4],
                  };
                  gameResultInfos.push(result);
                } else if (data.gameType === "Multi40Line") {
                  const result: GameResultInfo = {
                    wsId: r[0],
                    nickName: r[1],
                    score: r[2],
                    elapsed: r[3],
                    isLine40Clear: r[4],
                    clearLine: r[5],
                  };
                  gameResultInfos.push(result);
                } else if (data.gameType === "MultiBattle") {
                  const result: GameResultInfo = {
                    wsId: r[0],
                    nickName: r[1],
                    score: r[2],
                    elapsed: r[3],
                    isBattleWin: r[4],
                    clearLine: r[5],
                  };
                  gameResultInfos.push(result);
                }
              }
            }

            roomAddGameResult({
              gameType: data.gameType,
              gameResultInfo: gameResultInfos,
            });
            roomSetIsGameResultOpen(true);
          }

          break;

        case "gameAction2":
          gameRef?.current?.onWsMessage(lastMessageData);
          break;

        default:
          console.log("ws t not match, t: ", type);
      }
    },
    heartbeat: {
      interval: 1000 * 20,
      message: JSON.stringify({ type: "ping" }),
      returnMessage: JSON.stringify({ type: "pong" }),
    },
  });

  useEffect(() => {
    setReadyState(readyState);
  }, [readyState, setReadyState]);

  useEffect(() => {
    setSend(sendMessage);
  }, [sendMessage, setSend]);

  return null;
};

export default WebSocketInitializer;
