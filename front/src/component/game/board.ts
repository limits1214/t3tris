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
import type {
  Board,
  FallingBlockAt,
  Tetrimino,
  Tile,
  TileAt,
} from "tetris-lib/bindings";

export class TetrisBoard {
  render: GameRender;
  board: JsBoard = new JsBoard(10, 26);
  hold: Tetrimino | null = null;
  next: Tetrimino[] = [];
  boardId: BoardId;
  nickName: string;
  info: InfoData = {};
  combo: number = 0;
  sevenBag: Tetrimino[] = [];
  isBoardActive = false;
  isCanHold = true;
  isTSpin = false;

  timer: Timer;
  actionHandler: Actionhandler;
  renderHandler: RenderHandler;
  tickerHandler: TickerHandler;
  ctrl: Controller;
  constructor(render: GameRender, boardId: BoardId, nickName: string) {
    this.render = render;
    this.boardId = boardId;
    this.nickName = nickName;
    this.timer = new Timer(this.info);
    this.actionHandler = new Actionhandler(this);
    this.renderHandler = new RenderHandler(this);
    this.tickerHandler = new TickerHandler(this);
    this.ctrl = new Controller(this);
  }

  getTetriminoFromSevenBag(): Tetrimino {
    if (this.sevenBag.length === 0) {
      const tetriminos: Tetrimino[] = ["I", "O", "T", "J", "L", "S", "Z"];
      const randTetriminos: Tetrimino[] = [];
      while (tetriminos.length) {
        const idx = Math.floor(Math.random() * tetriminos.length);
        randTetriminos.push(tetriminos.splice(idx, 1)[0]);
      }
      this.sevenBag = randTetriminos;
    }
    return this.sevenBag.shift()!;
  }

  showFallingHint() {
    this.board.removeFallingHint();
    this.board.showFallingHint();
  }

  init(transform: Transform) {
    this.renderHandler.create(transform);
  }

  destroy() {
    // this.board = new JsBoard(10, 26);
    this.renderHandler.destroy();
  }
}

interface TetrisBoardController {
  setup(setup: BoardSetup): void;
  sync(): void;
  countdown(count: number): void;
  gameStart(): void;
  gameEnd(): void;
  addNext(tetrimino: Tetrimino): void;
  spawn(tetrimino: Tetrimino): void;
  placing(): void;
  lineClear(): void;
  setInfo(info: InfoData): void;
  scoreEffect(kind: string, combo: number): void;
  step(): void;
  moveLeft(): void;
  moveRight(): void;
  rotateLeft(): void;
  rotateRight(): void;
  softDrop(): void;
  hardDrop(): number;
  addHold(tetrimino: Tetrimino): void;
  removeFalling(): void;
  //addGargabeQueue
}

class Controller implements TetrisBoardController {
  tb;
  constructor(tetrisBoard: TetrisBoard) {
    this.tb = tetrisBoard;
  }
  setup(setup: BoardSetup): void {
    this.tb.hold = setup.hold;
    this.tb.next = setup.next;
    this.tb.board = new JsBoard(10, 26);

    this.tb.info.level = 1;
    this.tb.info.score = 0;
    this.tb.info.time = 0;
    this.tb.info.line = 0;
    // TODO: etc setup

    this.tb.renderHandler.isDirty = true;
  }
  sync(): void {
    throw new Error("Method not implemented.");
  }
  countdown(count: number): void {
    throw new Error("Method not implemented.");
  }
  gameStart(): void {
    console.log("gameStart");
    this.tb.timer.reset();
    this.tb.timer.on();
    this.tb.isBoardActive = true;
  }
  gameEnd(): void {
    console.log("gameEnd");
    this.tb.timer.off();
    this.tb.isBoardActive = false;
  }
  addNext(tetrimino: Tetrimino): void {
    this.tb.next.push(tetrimino);

    this.tb.renderHandler.isDirty = true;
  }
  spawn(tetrimino: Tetrimino): void {
    const b = this.tb.board;
    b.applySpawnFalling(b.trySpawnFalling(tetrimino));

    this.tb.renderHandler.isDirty = true;
  }
  placing(): void {
    const b = this.tb.board;
    b.placeFalling();

    this.tb.renderHandler.isDirty = true;
  }
  lineClear(): void {
    const b = this.tb.board;
    b.applyLineClear(b.tryLineClear());

    this.tb.renderHandler.isDirty = true;
  }
  setInfo(info: InfoData): void {
    if (info.level) {
      this.tb.info.level = info.level;
    }
    if (info.score) {
      this.tb.info.score = info.score;
    }
    if (info.line) {
      this.tb.info.line = info.line;
    }
  }
  scoreEffect(kind: string, combo: number): void {
    this.tb.renderHandler.scoreEffect(kind, combo);
  }
  step(): void {
    const b = this.tb.board;
    b.applyStep(b.tryStep());

    this.tb.renderHandler.isDirty = true;
  }
  moveLeft(): void {
    const b = this.tb.board;
    b.applyMoveFalling(b.tryMoveFalling("Left"));

    this.tb.renderHandler.isDirty = true;
  }
  moveRight(): void {
    const b = this.tb.board;
    b.applyMoveFalling(b.tryMoveFalling("Right"));

    this.tb.renderHandler.isDirty = true;
  }
  rotateLeft(): void {
    const b = this.tb.board;
    b.applyRotateFalling(b.tryRotateFalling("Left"));

    this.tb.renderHandler.isDirty = true;
  }
  rotateRight(): void {
    const b = this.tb.board;
    b.applyRotateFalling(b.tryRotateFalling("Right"));

    this.tb.renderHandler.isDirty = true;
  }
  softDrop(): void {
    this.step();
  }
  hardDrop(): number {
    const dropcnt = this.tb.board.hardDrop();
    this.tb.renderHandler.isDirty = true;
    return dropcnt;
  }
  addHold(tetrimino: Tetrimino): void {
    this.tb.hold = tetrimino;
    this.tb.renderHandler.isDirty = true;
  }
  removeFalling(): void {
    const b = this.tb.board;
    b.removeFallingBlocks();
    this.tb.renderHandler.isDirty = true;
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
        this.timerLastUpdated = this.timerAccumulate; // 오차포함
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
  tetrisBoard: TetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }
  endTicking(): void {
    // throw new Error("Method not implemented.");
  }
  initTicking(): void {
    const next = Array(5)
      .fill(null)
      .map(() => {
        return this.tetrisBoard.getTetriminoFromSevenBag();
      });

    this.tetrisBoard.ctrl.setup({
      hold: null,
      next: next,
    });
    console.log("3");
    setTimeout(() => {
      console.log("2");
      setTimeout(() => {
        console.log("1");
        setTimeout(() => {
          this.tetrisBoard.ctrl.gameStart();
          this.stepTick = 999;
        }, 1000);
      }, 1000);
    }, 1000);
  }

  ticking() {
    if (!this.tetrisBoard.isBoardActive) return;

    this.tick += 1;
    this.stepTick += 1;

    // combo tick
    if (this.comboTick > 0) {
      this.comboTick -= 1;
    } else {
      this.comboTick = 0;
      this.tetrisBoard.combo = 0;
    }

    if (this.isPlacingDelay) {
      try {
        this.tetrisBoard.board.tryStep();
      } catch {
        this.placingDelayTick += 1;
        if (this.placingDelayTick >= 30) {
          this.isPlacingDelay = false;
          const [clearLen, score] = this.placing();

          if (score) {
            this.tetrisBoard.ctrl.scoreEffect(score, this.tetrisBoard.combo);
          }

          //
          const isSuccess = this.spawnFromNext();

          if (!isSuccess) {
            this.tetrisBoard.ctrl.gameEnd();
          }
        }
      }
    }

    const lv = this.tetrisBoard.info.level ?? 1;
    if (this.stepTick >= CONSTANT.levelGravityTick[lv > 20 ? 20 : lv]) {
      this.stepTick = 0;

      try {
        this.tetrisBoard.ctrl.step();
      } catch {
        if (!this.isPlacingDelay) {
          this.isPlacingDelay = true;
          this.placingDelayTick = 0;
          this.placingResetCnt = 15;
        }
      }
    }
  }

  placing(): [number, string | null] {
    this.tetrisBoard.ctrl.placing();

    const clear = this.tetrisBoard.board.tryLineClear() as number[];
    const clearlen = clear.length;

    if (clear.length) {
      if (this.tetrisBoard.info.line !== undefined) {
        this.tetrisBoard.info.line += clearlen;
      } else {
        this.tetrisBoard.info.line = 0;
      }

      if (this.tetrisBoard.info.level !== undefined) {
        const clamp = (value: number, min: number, max: number) => {
          return Math.min(Math.max(value, min), max);
        };
        const LVUP_LINE = 10;

        this.tetrisBoard.info.level = clamp(
          Math.floor(this.tetrisBoard.info.line / LVUP_LINE) + 1,
          1,
          20
        );
      }

      this.tetrisBoard.ctrl.lineClear();

      // combo
      if (this.tetrisBoard.tickerHandler.comboTick > 0) {
        this.tetrisBoard.combo += 1;
      }
      this.tetrisBoard.tickerHandler.comboTick = 150; //2.5sec
    }

    //
    let score = null;
    let scoreNum = 0;
    if (this.tetrisBoard.isTSpin) {
      if (clearlen === 0) {
        score = "TSpinZero";
        scoreNum = CONSTANT.score["TSpinZero"];
      } else if (clearlen === 1) {
        score = "TSpinSingle";
        scoreNum = CONSTANT.score["TSpinSingle"];
      } else if (clearlen === 2) {
        score = "TSpinDouble";
        scoreNum = CONSTANT.score["TSpinDouble"];
      } else if (clearlen === 3) {
        score = "TSpinTriple";
        scoreNum = CONSTANT.score["TSpinTriple"];
      }
    } else {
      if (clearlen === 1) {
        score = "Single";
        scoreNum = CONSTANT.score["Single"];
      } else if (clearlen === 2) {
        score = "Double";
        scoreNum = CONSTANT.score["Double"];
      } else if (clearlen === 3) {
        score = "Triple";
        scoreNum = CONSTANT.score["Triple"];
      } else if (clearlen === 4) {
        score = "Tetris";
        scoreNum = CONSTANT.score["Tetris"];
      }
    }

    if (score) {
      const lv = this.tetrisBoard.info.level ?? 1;
      if (this.tetrisBoard.info.score !== undefined) {
        this.tetrisBoard.info.score +=
          scoreNum * lv + 200 * this.tetrisBoard.combo;
      }
    }

    this.tetrisBoard.ctrl.setInfo({
      line: this.tetrisBoard.info.line,
      level: this.tetrisBoard.info.level,
      score: this.tetrisBoard.info.score,
    });

    this.tetrisBoard.isCanHold = true;
    this.tetrisBoard.isTSpin = false;

    this.tetrisBoard.renderHandler.isDirty = true;
    return [clearlen, score];
  }

  spawnFromNext(): boolean {
    const nextTetr = this.tetrisBoard.next.shift();
    if (nextTetr) {
      try {
        if (!this.spawnWithGameOverCheck(nextTetr)) {
          return false;
        }

        this.tetrisBoard.ctrl.spawn(nextTetr);

        this.tetrisBoard.tickerHandler.stepTick = 999;

        this.tetrisBoard.ctrl.addNext(
          this.tetrisBoard.getTetriminoFromSevenBag()
        );

        this.tetrisBoard.renderHandler.isDirty = true;
        return true;
      } catch {
        return false;
      }
    } else {
      return false;
    }
  }
  spawnWithGameOverCheck(tetrimino: Tetrimino): boolean {
    const plan = this.tetrisBoard.board.trySpawnFalling(tetrimino) as TileAt[];
    for (const { location } of plan) {
      if (
        (this.tetrisBoard.board.getLocation(location.x, location.y) as Tile) !==
        "Empty"
      ) {
        return false;
      }
    }

    return true;
  }

  tSpinCheck() {
    const fallings =
      this.tetrisBoard.board.getFallingBlocks() as FallingBlockAt[];

    if (fallings.length && fallings[0].falling.kind === "T") {
      //
      let isTSpin = false;
      let is3Corner = false;

      const offsets = [
        [-1, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
      ];

      const centerLoc = fallings
        .filter((f) => f.falling.id === 2)
        .map((m) => m.location);

      let placedCnt = 0;
      if (centerLoc.length) {
        const b = this.tetrisBoard.board;
        for (const [x, y] of offsets) {
          const findX = centerLoc[0].x + x;
          const findY = centerLoc[0].y + y;
          if (findX < b.xLen && findY < b.yLen) {
            const tile = b.getLocation(findX, findY) as Tile;
            if (typeof tile === "object" && "Placed" in tile) {
              placedCnt += 1;
            } else {
              //
            }
          } else {
            //wall
            placedCnt += 1;
          }
        }

        if (placedCnt >= 3) {
          is3Corner = true;
        }
      }

      if (is3Corner) {
        isTSpin = true;
      }
      return isTSpin;
    } else {
      return false;
    }
  }
}

class Actionhandler implements ActionDelegation {
  tetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tetrisBoard = tetrisBoard;
  }
  actMoveLeft(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    try {
      this.tetrisBoard.ctrl.moveLeft();

      if (this.tetrisBoard.tickerHandler.placingResetCnt > 0) {
        this.tetrisBoard.tickerHandler.placingDelayTick = 0;
        this.tetrisBoard.tickerHandler.placingResetCnt -= 1;
      }
      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actMoveRight(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    try {
      this.tetrisBoard.ctrl.moveRight();

      if (this.tetrisBoard.tickerHandler.placingResetCnt > 0) {
        this.tetrisBoard.tickerHandler.placingDelayTick = 0;
        this.tetrisBoard.tickerHandler.placingResetCnt -= 1;
      }

      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actRotateLeft(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    try {
      this.tetrisBoard.ctrl.rotateLeft();

      this.tetrisBoard.isTSpin = this.tetrisBoard.tickerHandler.tSpinCheck();

      if (this.tetrisBoard.tickerHandler.placingResetCnt > 0) {
        this.tetrisBoard.tickerHandler.placingDelayTick = 0;
        this.tetrisBoard.tickerHandler.placingResetCnt -= 1;
      }

      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }

  actRotateRight(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    try {
      this.tetrisBoard.ctrl.rotateRight();

      this.tetrisBoard.isTSpin = this.tetrisBoard.tickerHandler.tSpinCheck();

      if (this.tetrisBoard.tickerHandler.placingResetCnt > 0) {
        this.tetrisBoard.tickerHandler.placingDelayTick = 0;
        this.tetrisBoard.tickerHandler.placingResetCnt -= 1;
      }

      this.tetrisBoard.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actSoftDrop(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    this.tetrisBoard.ctrl.step();

    if (this.tetrisBoard.info.score !== undefined) {
      this.tetrisBoard.info.score += CONSTANT.score.SoftDrop;
    }
    //TODO setinfo
  }
  actHardDrop(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    const dropcnt = this.tetrisBoard.ctrl.hardDrop();

    if (this.tetrisBoard.info.score !== undefined) {
      this.tetrisBoard.info.score += CONSTANT.score.HardDrop * dropcnt;
    }

    this.tetrisBoard.tickerHandler.isPlacingDelay = false;
    this.tetrisBoard.renderHandler.isDirty = true;

    const [clearLen, score] = this.tetrisBoard.tickerHandler.placing();
    if (score) {
      this.tetrisBoard.ctrl.scoreEffect(score, this.tetrisBoard.combo);
    }

    const isSuccess = this.tetrisBoard.tickerHandler.spawnFromNext();

    if (!isSuccess) {
      this.tetrisBoard.ctrl.gameEnd();
    }
  }
  actHold(): void {
    if (!this.tetrisBoard.isBoardActive) return;
    if (!this.tetrisBoard.isCanHold) {
      return;
    }
    this.tetrisBoard.isCanHold = false;
    const hold = this.tetrisBoard.hold;
    if (hold) {
      const fallings =
        this.tetrisBoard.board.getFallingBlocks() as FallingBlockAt[];
      const firstFalling = fallings.shift();
      if (firstFalling) {
        this.tetrisBoard.ctrl.addHold(firstFalling.falling.kind);
      }
      this.tetrisBoard.ctrl.removeFalling();

      this.tetrisBoard.tickerHandler.spawnFromNext();
    } else {
      const fallings =
        this.tetrisBoard.board.getFallingBlocks() as FallingBlockAt[];
      const firstFalling = fallings.shift();
      if (firstFalling) {
        this.tetrisBoard.ctrl.addHold(firstFalling.falling.kind);
        this.tetrisBoard.board.removeFallingBlocks();
        this.tetrisBoard.tickerHandler.spawnFromNext();
      }
    }

    this.tetrisBoard.tickerHandler.isPlacingDelay = false;
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
  tetriminos: TetrisIMesh[] = ["I", "O", "T", "J", "L", "S", "Z", "Hint"];
  isDirty = false;
  tetrisBoard;
  isScoreEffectOn = false;
  scoreEffectTimeout: number | null = null;
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

    this.tetrisBoard.showFallingHint();

    for (const tetrimino of this.tetriminos) {
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

  scoreEffect(kind: string, combo: number) {
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

    if (this.isScoreEffectOn) {
      if (this.scoreEffectTimeout) {
        clearTimeout(this.scoreEffectTimeout);
      }
      this.tetrisBoard.render.removeText(
        `${this.tetrisBoard.boardId}_ScoreEffectText`
      );
    }

    dummy.position.set(-4, -10, 0);
    dummy.getWorldPosition(finalPos);
    dummy.getWorldQuaternion(finalQuat);
    finalEuler.setFromQuaternion(finalQuat);
    dummy.getWorldScale(finalScale);

    const obj = new THREE.Object3D();
    obj.position.copy(finalPos);
    obj.quaternion.copy(finalQuat);
    obj.scale.copy(finalScale);
    const txt = `${kind}${combo}`;

    this.isScoreEffectOn = true;
    this.tetrisBoard.render.addText(
      `${this.tetrisBoard.boardId}_ScoreEffectText`,
      txt,
      obj
    );

    this.scoreEffectTimeout = setTimeout(() => {
      this.tetrisBoard.render.removeText(
        `${this.tetrisBoard.boardId}_ScoreEffectText`
      );
      this.isScoreEffectOn = false;
    }, 1500);
  }

  frame() {
    if (this.isDirty) {
      this.update();
      this.isDirty = false;
    }
    this.updateInfoText();
  }

  destroy() {
    [...this.meshList, ...this.tetriminos].forEach((each) => {
      this.tetrisBoard.render.removeInstancedMeshInfoByFilterId(
        each,
        `${this.tetrisBoard.boardId}`
      );
    });
    this.textList.forEach((each) => {
      this.tetrisBoard.render.removeText(`${this.tetrisBoard.boardId}_${each}`);
    });
  }
}
