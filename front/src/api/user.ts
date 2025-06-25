import { beforeTokenCheckAndRefresh } from "./auth";

const apiUrl = import.meta.env.VITE_API_URL;

export type UserInfo = {
  userId: string;
  nickName: string;
  avatarUrl: string | null;
  email: string | null;
  provider: string;
  createdAt: string;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  const accessToken = await beforeTokenCheckAndRefresh();
  const url = `${apiUrl}/api/user/info`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    credentials: 'include',
  });
  const resJson = await res.json();
  return resJson.data;
}
