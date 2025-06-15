import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

type AuthState = {
  isInitialRefreshDone: boolean,
  isAuthenticated: boolean,
  accessToken: string | null,
  setAuth: (token: string | null) => void,
  logout: () => void,
  setIsInitialRefeshDone: () => void,
}

export const useAuthStore = create<AuthState>()(
  // persist(
    (set) => ({
      isInitialRefreshDone: false,
      isAuthenticated: false,
      accessToken: null,
      setAuth: (token: string | null) => {
        set({isAuthenticated: true, accessToken: token})
      },
      logout: () => {
        set({isAuthenticated: false, accessToken: null})
      },
      setIsInitialRefeshDone: () => {
        set({isInitialRefreshDone: true})
      }
    }),
    // {
    //   name: 'auth-store',
    //   partialize: (state) =>({
    //     isAuthenticated: state.isAuthenticated,
    //     accessToken: state.accessToken
    //   })
    // }
  // )
)