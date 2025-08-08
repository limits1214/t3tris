import * as THREE from "three";
import { ActionHandler, TetrisBoard } from "./board";
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

  // setPlayer(boardId: BoardId, nickName: string) {
  //   if (this.boards[boardId]) {
  //     this.playerBoardId = boardId;
  //     this.playerNickName = nickName;
  //     this.input.delegation = this.boards[boardId].actionHandler;
  //     this.gameLoop.delegation = this.boards[boardId].tickerHandler;
  //   }
  // }

  // createBoard(boardId: BoardId, nickName: string, transform: Transform) {
  //   const newBoard = new TetrisBoard(this.render, boardId, nickName);
  //   newBoard.init(transform);
  //   this.boards[boardId] = newBoard;
  // }

  createPlayerBoard(boardId: BoardId, nickName: string) {
    this.playerBoardId = boardId;
    this.playerNickName = nickName;
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.actionHandler = new ActionHandler(newBoard);
    // newBoard.tickerHandler = new TickerHandler;
    // newBoard.ctrl = new Ctrl
    this.input.delegation = newBoard.actionHandler;
    this.gameLoop.delegation = newBoard.tickerHandler;
    newBoard.init(this.playerBoardTransform);
    this.boards[boardId] = newBoard;
  }

  // createOtherBoard(boardId: BoardId, nickName: string) {
  //   //
  // }

  deleteBoard(boardId: BoardId) {
    this.boards[boardId]?.destroy();
    delete this.boards[boardId];
  }

  frame(delta: number) {
    this.input.frame(delta);
    this.gameLoop.gameLoopUpdate(delta);

    for (const [, board] of Object.entries(this.boards)) {
      board?.timer.tick(delta);
      board?.renderHandler.frame();
    }
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
