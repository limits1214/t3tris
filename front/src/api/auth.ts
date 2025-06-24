import { useAuthStore } from "../store/useAuthStore";
import { isTokenExpired } from "../util/jwt";

const apiUrl = import.meta.env.VITE_API_URL;

export const tokenRefresh = async (): Promise<string> => {
  const url = `${apiUrl}/api/auth/token/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error("tokenRefreshError")
  }
  const resJson = await res.json();
  const token = resJson.data.accessToken;
  return token;
}

export const emailSignup = async () => {
  // TODO
}

export const emailLogin = async () => {
  // TODO
}

export const guestLogin = async (nickName: string): Promise<string> => {
  const url = `${apiUrl}/api/auth/guest/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include',
    body: JSON.stringify({
      nickName
    }),
  });
  const resJson = await res.json();
  const token = resJson.data.accessToken;
  return token;
}

export const serverLogout = async () => {
  const url = `${apiUrl}/api/auth/logout`;
  await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
}

export const beforeTokenCheckAndRefresh = async (): Promise<string | null> => {
  const {accessToken, setAuth} = useAuthStore.getState();
  if (accessToken == null) {
    return null;
  }

  if (isTokenExpired(accessToken)) {
    console.log('expired')
    const token = await tokenRefresh();
    setAuth(token)
    return token;
  } else {
    return accessToken;
  }
}

export const getWsToken = async (): Promise<string> => {
  const url = `${apiUrl}/api/auth/wstoken`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error("getWsToken")
  }
  const resJson = await res.json();
  const token = resJson.data.accessToken;
  return token;
}