import { create } from "zustand"

type UserState = {
  isLogined: boolean,
  updatedIsLogined: (isLogined: boolean) => void
}

export const useUserStore = create<UserState>(
    (set) => ({
      isLogined: false,
      updatedIsLogined: (isLogined) => {
        set({
          isLogined
        })
      }
    }),
)