import { create } from "zustand";
import{ ReadyState } from "react-use-websocket";
type WsStore = {
  readyState: ReadyState
  send: (msg: string) => void;
  lastMessage: string | null;
  setSend: (fn: WsStore['send']) => void;
  setLastMessage: (msg: string | null) => void;
  setReadyState: (readyState: ReadyState) => void
}

export const useWsStore = create<WsStore>(set=>({
  readyState: ReadyState.UNINSTANTIATED,
  send: () => {},
  lastMessage: null,
  setSend: (fn) => set({send:fn}),
  setLastMessage: (msg) => set({lastMessage: msg}),
  setReadyState: (readyState) => set({readyState})
}));