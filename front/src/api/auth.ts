import { useAuthStore } from "../store/useAuthStore";
import { isTokenExpired } from "../util/jwt";

const apiUrl = import.meta.env.VITE_API_URL;

export const tokenRefresh = async (refreshToken: string): Promise<string> => {
  const url = `${apiUrl}/api/auth/token/refresh`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
  });
  if (!res.ok) {
    throw new Error("tokenRefreshError");
  }
  const resJson = await res.json();
  return resJson.data.accessToken;
};

export const emailSignup = async () => {
  // TODO
};

export const emailLogin = async () => {
  // TODO
};

export const guestLogin = async (
  nickName: string
): Promise<[string, string]> => {
  const url = `${apiUrl}/api/auth/guest/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      nickName,
    }),
  });
  const resJson = await res.json();
  return [resJson.data.accessToken, resJson.data.refreshToken];
};

export const serverLogout = async () => {
  const url = `${apiUrl}/api/auth/logout`;
  await fetch(url, {
    method: "POST",
    credentials: "include",
  });
};

export const beforeTokenCheckAndRefresh = async (): Promise<string | null> => {
  const { accessToken, setAccessToken, refreshToken } = useAuthStore.getState();
  if (accessToken === null || refreshToken === null) {
    return null;
  }

  if (isTokenExpired(accessToken)) {
    console.log("expired");
    const a = await tokenRefresh(refreshToken);

    setAccessToken(a);
    return a;
  } else {
    return accessToken;
  }
};

export const getWsToken = async (): Promise<string> => {
  const url = `${apiUrl}/api/auth/wstoken`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("getWsToken");
  }
  const resJson = await res.json();
  const token = resJson.data.accessToken;
  return token;
};
