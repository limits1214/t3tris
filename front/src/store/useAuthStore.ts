import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  // isInitialRefreshDone: boolean;
  // isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  // setAuth: (token: string) => void;
  logout: () => void;
  // setIsInitialRefeshDone: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // isInitialRefreshDone: false,
      // isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      setAccessToken(token) {
        set({ accessToken: token });
      },
      setRefreshToken(token) {
        set({ refreshToken: token });
      },
      // setAuth: (token: string) => {
      //   set({ isAuthenticated: true, accessToken: token });
      // },
      logout: () => {
        set({ accessToken: null, refreshToken: null });
      },
      // setIsInitialRefeshDone: () => {
      //   set({ isInitialRefreshDone: true });
      // },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
