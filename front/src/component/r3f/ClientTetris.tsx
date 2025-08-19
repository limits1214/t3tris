import { useGLTF } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { GameManager } from "../game/gameManager";
import { CONSTANT } from "../game/constant";
import type {
  BoardId,
  BoardSetup,
  BoardSyncData,
  Transform,
} from "../game/type";
import type { TetrisBoard } from "../game/board";

export type ClientTetrisController = {
  createMulitPlayerBoard: (boardId: BoardId, nickName: string) => void;
  createMultiSubBoard: (boardId: BoardId, nickName: string) => void;
  createPlayerBoard: (boardId: BoardId, nickName: string) => void;
  createSubBoard: (boardId: BoardId, nickName: string) => void;
  moveBoard: (boardId: BoardId, newTransform: Transform) => void;
  deleteBoard: (boardId: BoardId) => void;
  setPlayer: (boardId: BoardId, nickName: string) => void;
  getBoards: () => Partial<Record<BoardId, TetrisBoard>>;
  boardTimerOn: (boardId: BoardId) => void;
  boardTimerOff: (boardId: BoardId) => void;
  boardTimerReset: (boardId: BoardId) => void;
  gameStart: (boardId: BoardId) => void;
  gameEnd: (boardId: BoardId) => void;
  spawnFromNext: (boardId: BoardId) => void;
  spawnFromHold: (boardId: BoardId) => void;
  step: (boardId: BoardId) => void;
  setup: (boardId: BoardId, setup: BoardSetup) => void;
  onWsMessage: (msg: string) => void;
  setWsSenderGameId: (gameId: string | undefined) => void;
  gameSync: (gameSyncData: Record<string, BoardSyncData>) => void;
};
export type ClientTetrisParam = {
  send?: (msg: string) => void;
};
export const ClientTetris = forwardRef<
  ClientTetrisController,
  ClientTetrisParam
>(({ send }, ref) => {
  const gameManager = useRef(new GameManager());
  const { nodes } = useGLTF(CONSTANT.gfx.url.tetriminoGlb);
  const font3d = useLoader(FontLoader, CONSTANT.gfx.url.font3d);
  const { scene } = useThree();
  useEffect(() => {
    const gm = gameManager.current;
    const tetriminoGeo = (nodes.Cube as THREE.Mesh).geometry;
    gm.init({ tetriminoGeo, scene, font3d });
    if (send) {
      gm.setWsSender(send);
    }

    return () => {
      gm.destroy();
    };
  }, [font3d, nodes.Cube, scene, send]);

  useFrame((_state, delta) => {
    gameManager.current.frame(delta);
  });

  const clientTetrisController: ClientTetrisController = {
    createPlayerBoard(boardId, nickName) {
      gameManager.current.createPlayerBoard(boardId, nickName);
    },
    createSubBoard(boardId, nickName) {
      gameManager.current.createSubBoard(boardId, nickName);
    },
    deleteBoard(boardId) {
      gameManager.current.deleteBoard(boardId);
    },
    boardTimerOn: function (boardId: BoardId): void {
      gameManager.current.boards[boardId]?.timer.on();
    },
    boardTimerOff: function (boardId: BoardId): void {
      gameManager.current.boards[boardId]?.timer.off();
    },
    boardTimerReset: function (boardId: BoardId): void {
      gameManager.current.boards[boardId]?.timer.reset();
    },
    gameStart(boardId: BoardId) {
      gameManager.current.gameLoop.gameLoopStart();
    },
    gameEnd(boardId: BoardId) {
      throw new Error("Function not implemented.");
    },
    spawnFromNext: function (boardId: BoardId): void {
      gameManager.current.boards[boardId]?.controller.spawnFromNext();
    },
    spawnFromHold: function (boardId: BoardId): void {
      throw new Error("Function not implemented.");
    },
    step: function (boardId: BoardId): void {
      gameManager.current.boards[boardId]?.controller.step();
    },
    setup(boardId: BoardId, setup: BoardSetup) {
      gameManager.current.boards[boardId]?.controller.setup(setup);
    },
    onWsMessage(msg) {
      gameManager.current.onWsMessage(msg);
    },
    createMulitPlayerBoard(boardId, nickName) {
      gameManager.current.createMultiPlayerBoard(boardId, nickName);
    },
    createMultiSubBoard(boardId, nickName) {
      gameManager.current.createMultiSubBoard(boardId, nickName);
    },
    setWsSenderGameId(gameId) {
      gameManager.current.setWsSenderGameId(gameId);
    },
    getBoards() {
      return gameManager.current.boards;
    },

    moveBoard(boardId, newTransform) {
      gameManager.current.moveBoard(boardId, newTransform);
    },
    gameSync(gameSyncData) {
      gameManager.current.multiGameSync(gameSyncData);
    },
  };

  useImperativeHandle(ref, () => clientTetrisController);
  return null;
});
