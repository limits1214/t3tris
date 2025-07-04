import { create } from 'zustand'

type GameState = {
  serverGameMsg: ServerGameMsg | null,
  setServerGameMsg: (serverGameMsg: ServerGameMsg | null)=>void
}

export type ServerGameMsg = {
  gameId: string,
  roomId: string,
  tetries: Record<string ,ServerTetris>
}

export type ServerTetris= {
  board: number[][],
  next: number[],
  hold: number | null,
  isCanHold: boolean,
  isGameOver: boolean,
}

export const useGameStore = create<GameState>()(
  (set) => ({
    serverGameMsg: null,
    setServerGameMsg: (newServerGameMsg)=>{ 
      set(state => {
        if (newServerGameMsg == null) {
          return {
            serverGameMsg: null
          }
        }
        const prev = state.serverGameMsg;
        if (prev?.gameId != newServerGameMsg.gameId || prev.roomId != newServerGameMsg.roomId) {
          return {serverGameMsg: newServerGameMsg}
        }
        
        return {
          serverGameMsg: {
            ...prev,
            tetries: {
              ...prev.tetries,
              ...newServerGameMsg.tetries
            }
          }
        }
      })
    }
  }),
)