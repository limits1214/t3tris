import * as THREE from "three";
import { TetrisBoard } from "./board";
import { GameInput } from "./input";
import { GameRender } from "./render";
import type { BoardId, Transform } from "./type";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { GameLoop } from "./gameLoop";

export class GameManager {
  render: GameRender;
  input: GameInput;
  boards: Partial<Record<BoardId, TetrisBoard>> = {};
  gameLoop: GameLoop;

  playerBoardId: BoardId | undefined;
  playerNickName: string | undefined;
  playerBoardTransform: Transform = {
    position: [-4.5, 15.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };

  constructor() {
    this.render = new GameRender();
    this.input = new GameInput();
    this.gameLoop = new GameLoop();
  }

  init({
    tetriminoGeo,
    scene,
    font3d,
  }: {
    tetriminoGeo: THREE.BufferGeometry;
    scene: THREE.Scene;
    font3d: Font;
  }) {
    this.render.init({ tetriminoGeo, scene, font3d });
    this.input.init();
  }

  setPlayer(boardId: BoardId, nickName: string) {
    if (this.boards[boardId]) {
      this.playerBoardId = boardId;
      this.playerNickName = nickName;
      this.input.delegation = this.boards[boardId].actionHandler;
      this.gameLoop.delegation = this.boards[boardId].tickerHandler;
    }
  }

  createBoard(boardId: BoardId, nickName: string, transform: Transform) {
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.init(transform);
    this.boards[boardId] = newBoard;
  }

  deleteBoard(boardId: BoardId) {
    this.boards[boardId]?.destroy();
    delete this.boards[boardId];
  }

  frame(delta: number) {
    for (const [, board] of Object.entries(this.boards)) {
      board?.timer.tick(delta);

      board?.renderHandler.frame();
    }
    this.gameLoop.gameLoopUpdate(delta);
    this.render.updateInstancedMeshs();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMessage(_msg: string) {
    //
  }
  sendMessage() {
    //
  }

  destroy() {
    this.render.destroy();
    this.input.destroy();
    for (const [boardId] of Object.entries(this.boards)) {
      this.deleteBoard(boardId);
    }
  }
}
