import { create } from "zustand";
import{ ReadyState } from "react-use-websocket";
type WsStore = {
  socketUrl: string | null,
  readyState: ReadyState
  send: (msg: string) => void;
  lastMessage: string | null;
  setSend: (fn: WsStore['send']) => void;
  setLastMessage: (msg: string | null) => void;
  setReadyState: (readyState: ReadyState) => void
  setSocketUrl: (socketUrl: string | null) => void,
}

export const useWsStore = create<WsStore>(set=>({
  socketUrl: null,
  readyState: ReadyState.UNINSTANTIATED,
  send: () => {},
  lastMessage: null,
  setSend: (fn) => set({send:fn}),
  setLastMessage: (msg) => set({lastMessage: msg}),
  setReadyState: (readyState) => set({readyState}),
  setSocketUrl: (socketUrl) => set({socketUrl})
}));