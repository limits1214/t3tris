import { create } from "zustand"
import type { RoomInfo } from "./useRoomStore"

type LobbyState = {
  isEntered: boolean,
  rooms: RoomInfo[],
  lobbyUsers: LobbyUser[]
  lobbychats: LobbyChat[],
  updatedIsEnterd: (isEnterd: boolean) => void,
  updateRooms: (rooms: RoomInfo[]) => void
  updateLobbyUsers: (lobbyUsers: LobbyUser[]) => void
  addLobbyChats: (lobbychats: LobbyChat) => void,
  updateLobbyChats: (lobbychats: LobbyChat[]) => void,
}

type LobbyUser = {
  userId: string,
  wsId: string,
  nickName: string,
}
type LobbyChat = {
  timestamp: string,
  user: LobbyUser,
  msg: string
}
export const useLobbyStore = create<LobbyState>(
    (set) => ({
      isEntered: false,
      rooms: [],
      lobbyUsers: [],
      lobbychats: [],
      updatedIsEnterd: (isEntered) => {
        set({
          isEntered
        })
      },
      updateRooms: (rooms) => {
        set({
          rooms,
        })
      },
      updateLobbyUsers: (lobbyUsers) => {
        set({
          lobbyUsers,
        })
      },
      addLobbyChats: (newChat) => {
        set((state) => {
          const updatedChats = [...state.lobbychats, newChat];
          const trimmedChats = updatedChats.slice(-100); // 뒤에서 100개만 유지
          return { lobbychats: trimmedChats };
        });
      },
      updateLobbyChats(lobbychats) {
          set({
            lobbychats
          })
      },
    }),
)