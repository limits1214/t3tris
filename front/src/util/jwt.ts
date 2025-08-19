import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  exp: number; // UNIX timestamp (in seconds)
}

// 30초 여유
export const isTokenExpired = (access: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(access);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - now < 30;
  } catch (e) {
    console.error("Invalid JWT:", e);
    return true;
  }
};
