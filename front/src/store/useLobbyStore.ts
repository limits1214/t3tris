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
  updateLobbyChats: (lobbychats: LobbyChat) => void
}

type LobbyUser = {
  userId: string,
  // wsId: string,
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
      updateLobbyChats: (lobbychats) => {
        set((state)=>({
          lobbychats: [...state.lobbychats, lobbychats]
        }))
      }
    }),
)