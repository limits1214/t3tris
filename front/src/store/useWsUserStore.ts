import { create } from "zustand"

type WsUserState = {
  isInitialWsLoginEnd: boolean,
  isWsLogined: boolean,
  wsUserId: string | null,
  wsNickName: string | null,
  wsId: string | null,
  setIsLogined: (isLogined: boolean) => void
  setIsInitialLoginEnd: (isInitialLoginEnd: boolean) => void
  setWsUserId: (userId: string | null) => void
  setWsUserNickName: (nickName: string | null) => void
  setWsId: (wsId: string | null) => void
}

export const useWsUserStore = create<WsUserState>(
    (set) => ({
      isInitialWsLoginEnd: false,
      isWsLogined: false,
      wsUserId: null,
      wsNickName: null,
      wsId: null,
      setIsLogined: (isWsLogined) => {
        set({
          isWsLogined
        })
      },
      setIsInitialLoginEnd: (isInitialWsLoginEnd) => {
        set({
          isInitialWsLoginEnd
        })
      },
      setWsUserId: (wsUserId) => {
        set({
          wsUserId
        })
      },
      setWsUserNickName: (wsNickName) => {
        set({
          wsNickName
        })
      },
      setWsId: (wsId) => {
        set({
          wsId
        })
      }
    }),
    
)