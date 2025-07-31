import { create } from "zustand"

type RoomState = {
  isRoomEnterd: boolean,
  roomId: string | null,
  roomName: string | null,
  hostUser: RoomUser | null,
  users: RoomUser[],
  roomStatus: string | null,
  chats: RoomChat[],
  games: string[],
  gameType: string | null,
  gameResult: GameResult[],
  isGameResultOpen: boolean,
  gameStartTimer: number,
  leave: () => void,
  addChat: (chat: RoomChat) => void,
  update: (info: RoomInfo) => void,
  clear: () => void,
  updateIsRoomEntered: (isRoomEntered: boolean) => void
  addRoomGameResult: (result: GameResult) => void,
  setRoomGameResult: (result: GameResult[]) => void
  setIsGameResultOpen: (isGameResultOpen: boolean) => void,
  setGameStartTimer: (time: number) => void
}

export type RoomUser = {
  userId: string,
  wsId: string,
  nickName: string,
}

export type RoomInfo = {
  roomId: string,
  roomName: string,
  roomHostUser: RoomUser,
  roomUsers: RoomUser[]
  roomStatus: string,
  games: string[],
  gameType: string
}

export type RoomChat = {
  timestamp: string,
  user: RoomUser,
  msg: string
}

export type GameResult = {
  gameType: string,
  gameResultInfo: GameResultInfo[],
}

export type GameResultInfo = {
  wsId: string,
  nickName: string,
  score?: number,
  elapsed?: number,
  isLine40Clear?: boolean,
  isBattleWin?: boolean,
}

export const useRoomStore = create<RoomState>(
    (set) => ({
      isRoomEnterd: false,
      roomId: null,
      roomName: null,
      hostUser: null,
      users: [],
      chats: [],
      roomStatus: null,
      games: [],
      gameType: null,
      gameResult: [],
      isGameResultOpen: false,
      gameStartTimer: 0,
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
          users: [],
          gameResult: []
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
          roomStatus: info.roomStatus,
          games: info.games,
          gameType: info.gameType,
        })
      },
      clear: () => {
        set({
          roomId: null,
          roomName: null,
          hostUser: null,
          users: [],
          chats: [],
        })
      },
      updateIsRoomEntered: (isRoomEnterd) => {
        set({
          isRoomEnterd
        })
      },
      addRoomGameResult: (result: GameResult) => {
        set((state) => ({
          gameResult: [...state.gameResult, result]
        }))
      },
      setRoomGameResult: (result: GameResult[]) => {
          set(()=>({
            gameResult: result
          }))
      },
      setIsGameResultOpen: (isGameResultOpen) =>{
          set(()=>({
            isGameResultOpen
          }))
      },
      setGameStartTimer(time) {
          set(()=>({
            gameStartTimer: time
          }))
      },
    }),
)