import { create } from "zustand"

type RoomState = {
  roomId: string | null,
  roomName: string | null,
  hostUser: RoomUser | null,
  users: RoomUser[],
  chats: RoomChat[],
  // enter: (info: RoomInfo) => void,
  leave: () => void,
  addChat: (chat: RoomChat) => void,
  update: (info: RoomInfo) => void,
}

type RoomUser = {
  userId: string,
  wsId: string,
  nickName: string,
}

export type RoomInfo = {
  roomId: string,
  roomName: string,
  roomHostUser: RoomUser,
  roomUsers: RoomUser[]
}

type RoomChat = {
  timestamp: string,
  user: RoomUser,
  msg: string
}


export const useRoomStore = create<RoomState>(
    (set) => ({
      roomId: null,
      roomName: null,
      hostUser: null,
      users: [],
      chats: [],
      // enter: (info) => {
      //   set({
      //     roomId: info.roomId,
      //     roomName: info.roomName,
      //     hostUser: info.hostUser,
      //     users: info.users,
      //   })
      // },
      leave: () => {
        set({
          roomId: null,
          roomName: null,
          hostUser: null,
          users: []
        })
      },
      addChat: (chat) => {
        set((state) => ({
          chats: [...state.chats, chat]
        }))
      },
      update: (info) => {
        set({
          roomId: info.roomId,
          roomName: info.roomName,
          hostUser: info.roomHostUser,
          users: info.roomUsers,
        })
      }
    }),
)