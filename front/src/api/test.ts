import { useAuthStore } from "../store/useAuthStore";
import { beforeTokenCheckAndRefresh } from "./auth";

const apiUrl = import.meta.env.VITE_API_URL;

export const testSecureFetch = async () => {
  const {accessToken} = useAuthStore.getState();
  const url = `${apiUrl}/api/test/checkaccesstoken`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      "Authorization": `Bearer ${accessToken}`
    },
    credentials: 'include',
  });
  const resJson = await res.json();
  console.log(resJson);
}

export const testOptionalSecureFetch = async () => {
  const {accessToken} = useAuthStore.getState();
  const url = `${apiUrl}/api/test/optioncheckaccesstoken`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      "Authorization": `Bearer ${accessToken}`
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const resJson = await res.json();
  console.log(resJson);
}

export const testCheckBeforeFetch = async () => {
  const token = await beforeTokenCheckAndRefresh();

  const url = `${apiUrl}/api/test/checkaccesstoken`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      "Authorization": `Bearer ${token}`
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const resJson = await res.json();
  console.log(resJson);
}

