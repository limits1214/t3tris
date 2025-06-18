import { create } from "zustand"
import type { RoomInfo } from "./useRoomStore"

type RoomListState = {
  rooms: RoomInfo[],
  updateRoomList: (rooms: RoomInfo[]) => void
}


export const useRoomListStore = create<RoomListState>(
    (set) => ({
      rooms: [],
      updateRoomList: (rooms) => {
        set({
          rooms
        })
      }
    }),
)