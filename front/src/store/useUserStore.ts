import { create } from "zustand"

type UserState = {
  isInitialLoginEnd: boolean,
  isLogined: boolean,
  setIsLogined: (isLogined: boolean) => void
  setIsInitialLoginEnd: (isInitialLoginEnd: boolean) => void
}

export const useUserStore = create<UserState>(
    (set) => ({
      isInitialLoginEnd: false,
      isLogined: false,
      setIsLogined: (isLogined) => {
        set({
          isLogined
        })
      },
      setIsInitialLoginEnd: (isInitialLoginEnd) => {
        set({
          isInitialLoginEnd
        })
      }
    }),
    
)