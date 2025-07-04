import { create } from "zustand";
import{ ReadyState } from "react-use-websocket";
import { getWsToken } from "../api/auth";
type WsStore = {
  wsToken: string | null,
  socketUrl: string | null,
  readyState: ReadyState
  send: (msg: string) => void;
  lastMessage: string | null;
  setSend: (fn: WsStore['send']) => void;
  setLastMessage: (msg: string | null) => void;
  setReadyState: (readyState: ReadyState) => void
  setSocketUrl: (socketUrl: string | null) => void,
  setWsToken: (wsToken: string | null) => void,
  getSocketUrl: () => Promise<string>,
}
const apiUrl = import.meta.env.VITE_WS_URL;
export const useWsStore = create<WsStore>(set=>({
  wsToken: null,
  socketUrl: null,
  readyState: ReadyState.UNINSTANTIATED,
  send: () => {},
  lastMessage: null,
  setSend: (fn) => set({send:fn}),
  setLastMessage: (msg) => set({lastMessage: msg}),
  setReadyState: (readyState) => set({readyState}),
  setSocketUrl: (socketUrl) => set({socketUrl}),
  getSocketUrl: async () => {
    const ws_token = await getWsToken();
    return `${apiUrl}/ws/haha?ws_token=${ws_token}`
  },
  setWsToken: (wsToken) => {
    set({wsToken})
  }
}));