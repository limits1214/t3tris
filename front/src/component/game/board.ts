import { format } from "date-fns";
import { CONSTANT } from "./constant";
import type { GameRender } from "./render";
import type {
  ActionDelegation,
  BoardId,
  InfoData,
  TetrisIMesh,
  Transform,
  TickerDelegation,
  BoardSetup,
} from "./type";
import * as THREE from "three";
import { JsBoard } from "tetris-lib";
import type { Board, Tetrimino } from "tetris-lib/bindings";

export class TetrisBoard {
  render: GameRender;
  board: JsBoard;
  hold: Tetrimino | null = null;
  next: Tetrimino[] = [];
  boardId: BoardId;
  nickName: string;
  info: InfoData = {};
  isBoardActive = false;

  timer: Timer;
  actionHandler: Actionhandler;
  renderHandler: RenderHandler;
  tickerHandler: TickerHandler;
  controller: Controller;
  constructor(render: GameRender, boardId: BoardId, nickName: string) {
    this.render = render;
    this.boardId = boardId;
    this.nickName = nickName;
    this.board = new JsBoard(10, 26);
    this.timer = new Timer(this.info);
    this.tickerHandler = new TickerHandler(this);
    this.actionHandler = new Actionhandler(this);
    this.renderHandler = new RenderHandler(this);
    this.controller = new Controller(this);
  }
  // evtSetup(setup: BoardSetup): void {
  //   this.hold = setup.hold;
  //   this.next = setup.next;
  //   this.renderHandler.update();
  //   // TODO board mapping
  // }

  init(transform: Transform) {
    this.renderHandler.create(transform);
  }

  destroy() {
    this.renderHandler.destroy();
  }
}

class Controller {
  tetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }

  setup(setup: BoardSetup) {
    //
    this.tetrisBoard.hold = setup.hold;
    this.tetrisBoard.next = setup.next;

    this.tetrisBoard.renderHandler.isDirty = true;
  }
  nextAdd(block: Tetrimino) {
    this.tetrisBoard.next.push(block);

    this.tetrisBoard.renderHandler.isDirty = true;
  }

  spawnFromNext() {
    const nextTetr = this.tetrisBoard.next.shift();
    if (nextTetr) {
      const b = this.tetrisBoard.board;
      const plan = b.trySpawnFalling(nextTetr);
      b.applySpawnFalling(plan);

      this.tetrisBoard.renderHandler.isDirty = true;
    }
  }

  placing() {
    this.tetrisBoard.board.placeFalling();
    this.tetrisBoard.renderHandler.isDirty = true;
  }
  score(data: InfoData) {
    if (data.level) {
      this.tetrisBoard.info.level = data.level;
    }
    if (data.score) {
      this.tetrisBoard.info.score = data.score;
    }
    if (data.line) {
      this.tetrisBoard.info.line = data.line;
    }
  }
  step() {
    try {
      const plan = this.tetrisBoard.board.tryStep();
      this.tetrisBoard.board.applyStep(plan);
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  moveLeft() {
    try {
      const plan = this.tetrisBoard.board.tryMoveFalling("Left");
      this.tetrisBoard.board.applyMoveFalling(plan);
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  moveRight() {
    try {
      const plan = this.tetrisBoard.board.tryMoveFalling("Right");
      this.tetrisBoard.board.applyMoveFalling(plan);
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  rotateLeft() {
    try {
      const plan = this.tetrisBoard.board.tryRotateFalling("Left");
      this.tetrisBoard.board.applyRotateFalling(plan);
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  rotateRight() {
    try {
      const plan = this.tetrisBoard.board.tryRotateFalling("Right");
      this.tetrisBoard.board.applyRotateFalling(plan);
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
}

class Timer {
  isTimerOn = false;
  timerLastUpdated = 0;
  timerAccumulate = 0;
  info: InfoData;
  constructor(info: InfoData) {
    this.info = info;
  }
  tick(delta: number) {
    if (this.isTimerOn) {
      this.timerAccumulate += delta;
      if (this.timerAccumulate - this.timerLastUpdated > 0.05) {
        this.info.time = this.timerAccumulate;
        this.timerLastUpdated += 0.05;
      }
    }
  }
  on() {
    this.isTimerOn = true;
  }
  off() {
    this.isTimerOn = false;
  }
  reset() {
    this.timerAccumulate = 0;
    this.timerLastUpdated = 0;
    this.info.time = 0;
  }
}

class TickerHandler implements TickerDelegation {
  tick = 0;
  stepTick = 0;
  comboTick = 0;
  isPlacingDelay = false;
  placingDelayTick = 0;
  placingResetCnt = CONSTANT.rule.placingResetCnt;
  tetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }
  endTicking(): void {
    // throw new Error("Method not implemented.");
  }
  initTicking(): void {
    // throw new Error("Method not implemented.");
  }

  ticking() {
    this.tick += 1;
    this.stepTick += 1;

    if (this.isPlacingDelay) {
      // if (this.tetrisBoard.board.tryStep()) {
      //   //
      // } else {
      //   //
      //   this.placingDelayTick += 1;
      //   if (this.placingDelayTick >= 30) {
      //     this.isPlacingDelay = false;
      //     // this.delegation.pl
      //   }
      // }
    }

    const lv = this.tetrisBoard.info.level ?? 1;
    if (this.stepTick >= CONSTANT.levelGravityTick[lv > 20 ? 20 : lv]) {
      this.stepTick = 0;

      // if (this.tetrisBoard.board.tryStep()) {
      //   // this.tetrisBoard.board.applyStep();
      // } else {
      //   //
      //   if (!this.isPlacingDelay) {
      //     this.isPlacingDelay = true;
      //     this.placingDelayTick = 0;
      //     this.placingResetCnt = CONSTANT.rule.placingResetCnt;
      //   }
      // }
    }
  }
}

class Actionhandler implements ActionDelegation {
  tetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }
  actMoveLeft(): void {
    this.tetrisBoard.controller.moveLeft();
  }
  actMoveRight(): void {
    this.tetrisBoard.controller.moveRight();
  }
  actRotateLeft(): void {
    this.tetrisBoard.controller.rotateLeft();
  }
  actRotateRight(): void {
    this.tetrisBoard.controller.rotateRight();
  }
  actSoftDrop(): void {
    this.tetrisBoard.controller.step();
  }
  actHardDrop(): void {
    throw new Error("Method not implemented.");
  }
  actHold(): void {
    throw new Error("Method not implemented.");
  }
}

class RenderHandler {
  meshList: ("Grid" | "Case" | "Next" | "Hold" | "Cover")[] = [
    "Grid",
    "Case",
    "Next",
    "Hold",
    "Cover",
  ];
  textList: ("nickNameText" | "infoText")[] = ["nickNameText", "infoText"];
  isDirty = false;
  tetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }
  object = new THREE.Object3D();
  create(transform: Transform) {
    this.object.position.set(...transform.position);
    this.object.rotation.set(...transform.rotation);
    this.object.scale.set(...transform.scale);

    const group = new THREE.Group();
    group.position.copy(this.object.position);
    group.rotation.copy(this.object.rotation);
    group.scale.copy(this.object.scale);

    const dummy = new THREE.Object3D();
    group.add(dummy);

    const finalPos = new THREE.Vector3();
    const finalQuat = new THREE.Quaternion();
    const finalScale = new THREE.Vector3();

    const trsToObj = (trs: { position: number[]; scale: number[] }) => {
      const position = trs.position as [number, number, number];
      const scale = trs.scale as [number, number, number];
      dummy.position.set(...position);
      dummy.scale.set(...scale);

      dummy.getWorldPosition(finalPos);
      dummy.getWorldScale(finalScale);
      dummy.getWorldQuaternion(finalQuat);

      const obj = new THREE.Object3D();
      obj.position.copy(finalPos);
      obj.quaternion.copy(finalQuat);
      obj.scale.copy(finalScale);
      return obj;
    };

    this.meshList.forEach((each) => {
      CONSTANT.gfx.boardCoord[each].forEach((trs) => {
        const obj = trsToObj(trs);
        this.tetrisBoard.render.pushInstancedMeshInfo(each, {
          id: `${this.tetrisBoard.boardId}`,
          object: obj,
        });
      });
    });

    this.textList.forEach((each) => {
      CONSTANT.gfx.boardCoord[each].forEach((trs) => {
        const obj = trsToObj(trs);
        this.tetrisBoard.render.addText(
          `${this.tetrisBoard.boardId}_${each}`,
          each,
          obj
        );
      });
    });
  }

  update() {
    const group = new THREE.Group();
    group.position.copy(this.object.position);
    group.rotation.copy(this.object.rotation);
    group.scale.copy(this.object.scale);

    const dummy = new THREE.Object3D();
    group.add(dummy);

    const finalPos = new THREE.Vector3();
    const finalQuat = new THREE.Quaternion();
    const finalEuler = new THREE.Euler();
    const finalScale = new THREE.Vector3();

    const tetriminos: TetrisIMesh[] = ["I", "O", "T", "J", "L", "S", "Z"];
    for (const tetrimino of tetriminos) {
      this.tetrisBoard.render.removeInstancedMeshInfoByFilterId(
        tetrimino,
        this.tetrisBoard.boardId
      );
    }

    for (const [idx, next] of this.tetrisBoard.next.entries()) {
      for (const [dx, dy] of CONSTANT.gfx.blockLocation[next]) {
        dummy.position.set(12 + dx, -7 + -idx * 3 + dy, 0);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        finalEuler.setFromQuaternion(finalQuat);
        dummy.getWorldScale(finalScale);

        const obj = new THREE.Object3D();
        obj.position.copy(finalPos);
        obj.quaternion.copy(finalQuat);
        obj.scale.copy(finalScale);
        this.tetrisBoard.render.pushInstancedMeshInfo(next, {
          id: `${this.tetrisBoard.boardId}`,
          object: obj,
        });
      }
    }

    if (this.tetrisBoard.hold) {
      for (const [dx, dy] of CONSTANT.gfx.blockLocation[
        this.tetrisBoard.hold
      ]) {
        dummy.position.set(-6 + dx, -7 + dy, 0);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        finalEuler.setFromQuaternion(finalQuat);
        dummy.getWorldScale(finalScale);

        const obj = new THREE.Object3D();
        obj.position.copy(finalPos);
        obj.quaternion.copy(finalQuat);
        obj.scale.copy(finalScale);
        this.tetrisBoard.render.pushInstancedMeshInfo(this.tetrisBoard.hold, {
          id: `${this.tetrisBoard.boardId}`,
          object: obj,
        });
      }
    }

    for (const [lineIdx, line] of (
      this.tetrisBoard.board.getBoard() as Board
    ).entries()) {
      for (const [tileIdx, tile] of line.entries()) {
        if (tile === "Empty") {
          //
        } else if ("Falling" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          const obj = new THREE.Object3D();
          obj.position.copy(finalPos);
          obj.quaternion.copy(finalQuat);
          obj.scale.copy(finalScale);

          const kind = tile["Falling"].kind;

          this.tetrisBoard.render.pushInstancedMeshInfo(kind, {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
        } else if ("Placed" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          const obj = new THREE.Object3D();
          obj.position.copy(finalPos);
          obj.quaternion.copy(finalQuat);
          obj.scale.copy(finalScale);

          const pid = tile.Placed as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
          const tetr = CONSTANT.gfx.placeIdMap[pid] as TetrisIMesh;

          this.tetrisBoard.render.pushInstancedMeshInfo(tetr, {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
        } else if ("Hint" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          const obj = new THREE.Object3D();
          obj.position.copy(finalPos);
          obj.quaternion.copy(finalQuat);
          obj.scale.copy(finalScale);

          this.tetrisBoard.render.pushInstancedMeshInfo("Hint", {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
        } else {
          //
        }
      }
    }
  }

  infoTextMake({ level, score, time, line }: InfoData) {
    const parts: string[] = [];

    parts.push(`level:\n${level ?? 1}`);
    parts.push(`line:\n${line ?? 0}`);
    parts.push(`score:\n${score ?? 0}`);
    parts.push(`time:\n${format(new Date((time ?? 0) * 1000), "mm:ss:SS")}`);

    return parts.join("\n");
  }

  updateInfoText() {
    this.tetrisBoard.render.updateText(
      `${this.tetrisBoard.boardId}_infoText`,
      this.infoTextMake(this.tetrisBoard.info)
    );
  }

  frame() {
    if (this.isDirty) {
      this.update();
      this.isDirty = false;
    }
    this.updateInfoText();
  }
  destroy() {
    this.meshList.forEach((each) => {
      this.tetrisBoard.render.updateInstancedMeshInfos(
        each,
        this.tetrisBoard.boardId,
        []
      );
    });
    this.textList.forEach((each) => {
      this.tetrisBoard.render.removeText(`${this.tetrisBoard.boardId}_${each}`);
    });
  }
}
