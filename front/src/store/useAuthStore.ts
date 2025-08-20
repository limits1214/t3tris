import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "../api/user";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  logout: () => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userInfo: null,
      accessToken: null,
      refreshToken: null,
      setAccessToken(token) {
        set({ accessToken: token });
      },
      setRefreshToken(token) {
        set({ refreshToken: token });
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, userInfo: null });
      },
      setUserInfo(userInfo) {
        set({ userInfo });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        userInfo: state.userInfo,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
