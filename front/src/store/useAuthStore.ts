import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  isAuthenticated: boolean,
  accessToken: string | null,
  setAuth: (token: string) => void,
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      setAuth: (token: string) => {
        set({isAuthenticated: true, accessToken: token})
      },
      logout: () => {
        set({isAuthenticated: false, accessToken: null})
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) =>({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      })
    }
  )
)