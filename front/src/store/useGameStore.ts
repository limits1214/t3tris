import { create } from 'zustand'
import type { OptTetrisController } from '../component/r3f/OptTetris';

type GameState = {
  gameRef: React.RefObject<OptTetrisController | null>| null ;
  setGameRef: (ref: React.RefObject<OptTetrisController | null>) => void;
  
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
    gameRef: null,
    setGameRef: (ref) => set({ gameRef: ref }),

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