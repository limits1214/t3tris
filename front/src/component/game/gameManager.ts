import * as THREE from "three";
import { ActionHandler, TetrisBoard } from "./board";
import { GameInput } from "./input";
import { GameRender } from "./render";
import type { BoardId, Transform } from "./type";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { GameLoop } from "./gameLoop";
import { WsReceiver, WsSender } from "./wsHandle";
import { GameBoardLayout } from "./boardLayout";

export class GameManager {
  render: GameRender = new GameRender();
  input: GameInput = new GameInput();
  boards: Partial<Record<BoardId, TetrisBoard>> = {};
  gameLoop: GameLoop = new GameLoop();
  wsReceiver: WsReceiver = new WsReceiver(this);
  wsSender: WsSender = new WsSender(this);
  layout: GameBoardLayout = new GameBoardLayout(this);

  mainBoardId: BoardId | undefined;
  mainNickName: string | undefined;
  mainBoardTransform: Transform = {
    position: [-4.5, 15.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };

  constructor() {}

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

  createMultiPlayerBoard(boardId: BoardId, nickName: string) {
    this.mainBoardId = boardId;
    this.mainNickName = nickName;
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.actionHandler = new ActionHandler(newBoard);
    this.input.delegation = newBoard.actionHandler;
    this.gameLoop.delegation = newBoard.tickerHandler;
    newBoard.wsSender = this.wsSender;
    newBoard.init(this.mainBoardTransform);
    this.boards[boardId] = newBoard;
  }

  createMultiSubBoard(boardId: BoardId, nickName: string) {
    this.layout.subBoardLayoutPacking(1);
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.actionHandler = new ActionHandler(newBoard);
    this.boards[boardId] = newBoard;
    let trs;
    for (const slot of this.layout.subBoardTransformLayout) {
      if (slot.boardId === null) {
        trs = slot.transform;
        slot.boardId = boardId;
        break;
      }
    }
    if (trs) {
      newBoard.init(trs);
    }
  }

  createPlayerBoard(boardId: BoardId, nickName: string) {
    this.mainBoardId = boardId;
    this.mainNickName = nickName;
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.actionHandler = new ActionHandler(newBoard);
    this.input.delegation = newBoard.actionHandler;
    this.gameLoop.delegation = newBoard.tickerHandler;

    newBoard.init(this.mainBoardTransform);
    this.boards[boardId] = newBoard;
  }

  createSubBoard(boardId: BoardId, nickName: string) {
    const newBoard = new TetrisBoard(this.render, boardId, nickName);
    newBoard.actionHandler = new ActionHandler(newBoard);
    newBoard.init(this.mainBoardTransform);
    this.boards[boardId] = newBoard;
  }

  deleteBoard(boardId: BoardId) {
    this.boards[boardId]?.destroy();
    delete this.boards[boardId];

    this.layout.subBoardTransformLayout.forEach((item) => {
      if (item.boardId === boardId) {
        item.boardId = null;
      }
    });
    this.layout.subBoardLayoutPacking(0);
  }

  moveBoard(boardId: BoardId, newTransform: Transform) {
    this.boards[boardId]?.renderHandler.move(newTransform);
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

  setWsSender(sender: (msg: string) => void) {
    this.wsSender.sender = sender;
  }
  setWsSenderGameId(gameId: string | undefined) {
    if (gameId) {
      this.wsSender.gameId = gameId;
    }
  }

  onWsMessage(msg: string) {
    this.wsReceiver.onWsMessage(msg);
  }

  destroy() {
    this.render.destroy();
    this.input.destroy();
    for (const [boardId] of Object.entries(this.boards)) {
      this.deleteBoard(boardId);
    }
  }
}
