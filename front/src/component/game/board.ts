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
  BoardSyncData,
  GarbageQueue,
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
import type { WsSender } from "./wsHandle";

export class TetrisBoard {
  board: JsBoard = new JsBoard(10, 26);
  hold: Tetrimino | null = null;
  next: Tetrimino[] = [];
  boardId: BoardId;
  nickName: string;
  info: InfoData = {};
  combo: number = 0;
  sevenBag: Tetrimino[] = [];
  isBoardActive = false;
  isAddEndCover = false;
  isCanHold = true;
  isTSpin = false;
  tick = 0;
  stepTick = 0;
  comboTick = 0;
  isPlacingDelay = false;
  placingDelayTick = 0;
  placingResetCnt = CONSTANT.rule.placingResetCnt;

  // addGarbageQueue: number[] = [];
  garbageQueue: GarbageQueue[] = [];

  timer: Timer;
  actionHandler?: ActionDelegation;
  renderHandler: RenderHandler;
  tickerHandler?: TickerDelegation; // TODO undefined
  ctrl: TetrisBoardController;

  wsSender: WsSender | undefined;
  constructor(render: GameRender, boardId: BoardId, nickName: string) {
    this.boardId = boardId;
    this.nickName = nickName;
    this.timer = new Timer(this.info);
    // this.actionHandler = new Actionhandler(this);
    this.renderHandler = new RenderHandler(this, render);
    // this.tickerHandler = new SoloTickerHandler(this);
    this.ctrl = new Controller(this);
  }

  boardSync(syncData: BoardSyncData) {
    // boardSet
    for (const [lineIdx, line] of syncData.board.entries()) {
      for (const [tileIdx, tile] of line.entries()) {
        this.board.setLocation(tileIdx, lineIdx, tile);
      }
    }
    // hold set
    this.hold = syncData.hold;

    // next set
    this.next = syncData.next;
    // TODO garbage q set

    // score set
    this.info.level = syncData.level;
    this.info.score = syncData.score;
    this.info.line = syncData.line;
    this.info.time = syncData.elapsed / 1000;
    this.timer.set(this.info.time);

    if (syncData.isBoardEnd) {
      this.timer.off();
      this.renderHandler.removeEndCover();
      this.renderHandler.addEndCover();
      this.isAddEndCover = true;
    } else {
      this.timer.on();
    }

    this.renderHandler.isDirty = true;
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

  placing(): [number, string | null] {
    this.ctrl.placing();

    const clear = this.board.tryLineClear() as number[];
    const clearlen = clear.length;

    if (clear.length) {
      if (this.info.line !== undefined) {
        this.info.line += clearlen;
      } else {
        this.info.line = 0;
      }

      if (this.info.level !== undefined) {
        const clamp = (value: number, min: number, max: number) => {
          return Math.min(Math.max(value, min), max);
        };
        const LVUP_LINE = 10;

        this.info.level = clamp(
          Math.floor(this.info.line / LVUP_LINE) + 1,
          1,
          20
        );
      }

      // combo
      if (this.comboTick > 0) {
        this.combo += 1;
      }
      this.comboTick = 150; //2.5sec
    }
    this.ctrl.lineClear();

    //
    let score = null;
    let scoreNum = 0;
    if (this.isTSpin) {
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
      const lv = this.info.level ?? 1;
      if (this.info.score !== undefined) {
        this.info.score += scoreNum * lv + 200 * this.combo;
      }
    }

    this.ctrl.setInfo({
      line: this.info.line,
      level: this.info.level,
      score: this.info.score,
    });

    this.isCanHold = true;
    this.isTSpin = false;

    this.renderHandler.isDirty = true;
    return [clearlen, score];
  }

  spawnFromNext(): boolean {
    const nextTetr = this.ctrl.shiftNext();
    if (nextTetr) {
      console.log("spawnFromNext", nextTetr);
      try {
        if (!this.spawnWithGameOverCheck(nextTetr)) {
          return false;
        }

        this.ctrl.spawn(nextTetr);

        this.stepTick = 999;

        this.ctrl.pushNext(this.getTetriminoFromSevenBag());

        this.renderHandler.isDirty = true;
        return true;
      } catch (e) {
        console.error("spawnWithGameOverCheck catch", e, "nextTetr", nextTetr);
        return false;
      }
    } else {
      return false;
    }
  }

  spawnWithGameOverCheck(tetrimino: Tetrimino): boolean {
    const plan = this.board.trySpawnFalling(tetrimino) as TileAt[];
    for (const { location } of plan) {
      if (
        (this.board.getLocation(location.x, location.y) as Tile) !== "Empty"
      ) {
        return false;
      }
    }

    return true;
  }

  tSpinCheck() {
    const fallings = this.board.getFallingBlocks() as FallingBlockAt[];

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
        const b = this.board;
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
  showFallingHint() {
    if (!this.isBoardActive) return;
    this.board.removeFallingHint();
    this.board.showFallingHint();
  }

  init(transform: Transform) {
    this.renderHandler.create(transform);
    this.renderHandler.updateNickNameText(this.nickName);
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
  boardStart(): void;
  boardEnd(elapsed?: number): void;
  shiftNext(): Tetrimino | undefined;
  pushNext(tetrimino: Tetrimino): void;
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
  garbageQueue(gq: GarbageQueue[]): void;
  garbageAdd(empty: number[]): void;
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

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        setup: {
          next: setup.next,
          hold: setup.hold,
        },
      });
    }
  }
  sync(): void {
    throw new Error("Method not implemented.");
  }
  countdown(count: number): void {
    throw new Error("Method not implemented." + count);
  }
  garbageQueue(gq: GarbageQueue[]): void {
    this.tb.garbageQueue = gq;
    this.tb.renderHandler.garbageQueueSet(gq);
  }
  garbageAdd(empty: number[]): void {
    for (const e of empty) {
      if (!this.tb.board.pushGarbageLine(e)) {
        this.boardEnd();
      }
    }

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        addGarbageQueue: {
          empty: empty,
        },
      });
    }
    this.tb.renderHandler.isDirty = true;
  }

  boardStart(): void {
    console.log("boardStart");
    this.tb.timer.reset();
    this.tb.renderHandler.removeEndCover();
    this.tb.isAddEndCover = false;
    this.tb.renderHandler.removeGarbageQueue();
    this.tb.timer.on();
    this.tb.isBoardActive = true;
    // this.tb.spawnFromNext();
  }
  boardEnd(elapsed?: number): void {
    console.log("gameEnd");
    this.tb.renderHandler.removeEndCover();
    this.tb.renderHandler.addEndCover();
    this.tb.isAddEndCover = true;
    this.tb.timer.off();
    if (elapsed) {
      this.tb.info.time = elapsed;
    }
    this.tb.isBoardActive = false;
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("boardEnd");
    }
  }
  shiftNext(): Tetrimino | undefined {
    const next = this.tb.next.shift();
    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        shiftNext: {
          next: next,
        },
      });
    }
    return next;
  }
  pushNext(tetrimino: Tetrimino): void {
    this.tb.next.push(tetrimino);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        pushNext: {
          next: tetrimino,
        },
      });
    }
  }
  spawn(tetrimino: Tetrimino): void {
    const b = this.tb.board;
    const plan = b.trySpawnFalling(tetrimino);
    b.applySpawnFalling(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        spawn: {
          spawn: tetrimino,
        },
      });
    }
  }
  placing(): void {
    const b = this.tb.board;
    b.placeFalling();

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("placing");
    }
  }
  lineClear(): void {
    const b = this.tb.board;
    const plan = b.tryLineClear();
    b.applyLineClear(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("lineClear");
    }
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
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        setInfo: {
          line: info.line,
          score: info.score,
          level: info.level,
        },
      });
    }
  }
  scoreEffect(kind: string, combo: number): void {
    this.tb.renderHandler.scoreEffect(kind, combo);
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        scoreEffect: {
          kind,
          combo,
        },
      });
    }
  }
  step(): void {
    const b = this.tb.board;
    const plan = b.tryStep();
    b.applyStep(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("step");
    }
  }
  moveLeft(): void {
    const b = this.tb.board;
    const plan = b.tryMoveFalling("Left");
    b.applyMoveFalling(plan);

    this.tb.renderHandler.isDirty = true;
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("moveLeft");
    }
  }
  moveRight(): void {
    const b = this.tb.board;
    const plan = b.tryMoveFalling("Right");
    b.applyMoveFalling(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("moveRight");
    }
  }
  rotateLeft(): void {
    const b = this.tb.board;
    const plan = b.tryRotateFalling("Left");
    b.applyRotateFalling(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("rotateLeft");
    }
  }
  rotateRight(): void {
    const b = this.tb.board;
    const plan = b.tryRotateFalling("Right");
    b.applyRotateFalling(plan);

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("rotateRight");
    }
  }
  softDrop(): void {
    const b = this.tb.board;
    try {
      const plan = b.tryStep();
      b.applyStep(plan);
      this.tb.renderHandler.isDirty = true;

      if (this.tb.wsSender) {
        this.tb.wsSender.wsSend("softDrop");
      }
    } catch (e) {
      console.error("softDrop", e);
    }
  }
  hardDrop(): number {
    const dropcnt = this.tb.board.hardDrop();
    this.tb.renderHandler.isDirty = true;
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("hardDrop");
    }
    return dropcnt;
  }
  addHold(tetrimino: Tetrimino): void {
    this.tb.hold = tetrimino;

    this.tb.renderHandler.isDirty = true;

    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend({
        addHold: {
          hold: tetrimino,
        },
      });
    }
  }
  removeFalling(): void {
    const b = this.tb.board;
    b.removeFallingBlocks();
    this.tb.renderHandler.isDirty = true;
    if (this.tb.wsSender) {
      this.tb.wsSender.wsSend("removeFalling");
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
        this.timerLastUpdated = this.timerAccumulate; // 오차포함
      }
    }
  }
  set(time: number) {
    this.timerAccumulate = time;
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

// ticking은 solo ticker와 같음
export class MultiTickerHandler implements TickerDelegation {
  tb: TetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tb = tetrisBoard;
  }
  initTicking(): void {
    // throw new Error("Method not implemented.");
  }
  endTicking(): void {
    // throw new Error("Method not implemented.");
  }
  ticking(): void {
    if (!this.tb.isBoardActive) return;

    if (!this.tb.board.getFallingBlocks().length) {
      const isSuccess = this.tb.spawnFromNext();
      if (!isSuccess) {
        this.tb.ctrl.boardEnd();
      }
    }

    this.tb.tick += 1;
    this.tb.stepTick += 1;

    // combo tick
    if (this.tb.comboTick > 0) {
      this.tb.comboTick -= 1;
    } else {
      this.tb.comboTick = 0;
      this.tb.combo = 0;
    }

    if (this.tb.isPlacingDelay) {
      try {
        this.tb.board.tryStep();
      } catch {
        this.tb.placingDelayTick += 1;
        if (this.tb.placingDelayTick >= 30) {
          this.tb.isPlacingDelay = false;
          const [, score] = this.tb.placing();

          if (score) {
            this.tb.ctrl.scoreEffect(score, this.tb.combo);
          }
        }
      }
    }

    const lv = this.tb.info.level ?? 1;
    if (this.tb.stepTick >= CONSTANT.levelGravityTick[lv > 20 ? 20 : lv]) {
      this.tb.stepTick = 0;

      try {
        this.tb.ctrl.step();
      } catch {
        if (!this.tb.isPlacingDelay) {
          this.tb.isPlacingDelay = true;
          this.tb.placingDelayTick = 0;
          this.tb.placingResetCnt = 15;
        }
      }
    }
  }
}

export class SoloTickerHandler implements TickerDelegation {
  tb: TetrisBoard;
  constructor(tetrisBoard: TetrisBoard) {
    this.tb = tetrisBoard;
  }
  endTicking(): void {
    // throw new Error("Method not implemented.");
  }
  initTicking(): void {
    const next = Array(5)
      .fill(null)
      .map(() => {
        return this.tb.getTetriminoFromSevenBag();
      });

    this.tb.ctrl.setup({
      hold: null,
      next: next,
    });

    this.tb.ctrl.boardStart();
    this.tb.stepTick = 999;
    // console.log("3");
    // setTimeout(() => {
    //   console.log("2");
    //   setTimeout(() => {
    //     console.log("1");
    //     setTimeout(() => {
    //       this.tb.ctrl.boardStart();

    //       this.tb.stepTick = 999;
    //     }, 1000);
    //   }, 1000);
    // }, 1000);
  }

  ticking() {
    if (!this.tb.isBoardActive) return;

    if (!this.tb.board.getFallingBlocks().length) {
      const isSuccess = this.tb.spawnFromNext();
      if (!isSuccess) {
        this.tb.ctrl.boardEnd();
      }
    }

    this.tb.tick += 1;
    this.tb.stepTick += 1;

    // combo tick
    if (this.tb.comboTick > 0) {
      this.tb.comboTick -= 1;
    } else {
      this.tb.comboTick = 0;
      this.tb.combo = 0;
    }

    if (this.tb.isPlacingDelay) {
      try {
        this.tb.board.tryStep();
      } catch {
        this.tb.placingDelayTick += 1;
        if (this.tb.placingDelayTick >= 30) {
          this.tb.isPlacingDelay = false;
          const [, score] = this.tb.placing();

          if (score) {
            this.tb.ctrl.scoreEffect(score, this.tb.combo);
          }
        }
      }
    }

    const lv = this.tb.info.level ?? 1;
    if (this.tb.stepTick >= CONSTANT.levelGravityTick[lv > 20 ? 20 : lv]) {
      this.tb.stepTick = 0;

      try {
        this.tb.ctrl.step();
      } catch {
        if (!this.tb.isPlacingDelay) {
          this.tb.isPlacingDelay = true;
          this.tb.placingDelayTick = 0;
          this.tb.placingResetCnt = 15;
        }
      }
    }
  }
}

export class ActionHandler implements ActionDelegation {
  tb;
  constructor(tetrisBoard: TetrisBoard) {
    this.tb = tetrisBoard;
  }
  actMoveLeft(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    try {
      this.tb.ctrl.moveLeft();

      if (this.tb.placingResetCnt > 0) {
        this.tb.placingDelayTick = 0;
        this.tb.placingResetCnt -= 1;
      }
      this.tb.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actMoveRight(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    try {
      this.tb.ctrl.moveRight();

      if (this.tb.placingResetCnt > 0) {
        this.tb.placingDelayTick = 0;
        this.tb.placingResetCnt -= 1;
      }

      this.tb.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actRotateLeft(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    try {
      this.tb.ctrl.rotateLeft();

      this.tb.isTSpin = this.tb.tSpinCheck();

      if (this.tb.placingResetCnt > 0) {
        this.tb.placingDelayTick = 0;
        this.tb.placingResetCnt -= 1;
      }

      this.tb.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }

  actRotateRight(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    try {
      this.tb.ctrl.rotateRight();

      this.tb.isTSpin = this.tb.tSpinCheck();

      if (this.tb.placingResetCnt > 0) {
        this.tb.placingDelayTick = 0;
        this.tb.placingResetCnt -= 1;
      }

      this.tb.renderHandler.isDirty = true;
    } catch (e) {
      if (e instanceof Error) {
        // console.error(e.message); // OK
      } else {
        // console.error("Unknown error", e);
      }
    }
  }
  actSoftDrop(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    try {
      this.tb.ctrl.step();

      if (this.tb.info.score !== undefined) {
        this.tb.info.score += CONSTANT.score.SoftDrop;
      }
    } catch {
      // console.error("actSoftDrop", e);
    }

    //TODO setinfo
  }
  actHardDrop(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    // console.log(fallings.length);
    if (fallings.length === 0) return;
    const dropcnt = this.tb.ctrl.hardDrop();

    if (this.tb.info.score !== undefined) {
      this.tb.info.score += CONSTANT.score.HardDrop * dropcnt;
    }

    this.tb.isPlacingDelay = false;
    this.tb.renderHandler.isDirty = true;

    const [, score] = this.tb.placing();
    if (score) {
      this.tb.ctrl.scoreEffect(score, this.tb.combo);
    }
  }
  actHold(): void {
    if (!this.tb.isBoardActive) return;
    const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
    if (fallings.length === 0) return;
    if (!this.tb.isCanHold) {
      return;
    }
    this.tb.isCanHold = false;
    const hold = this.tb.hold;
    if (hold) {
      const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
      const firstFalling = fallings.shift();
      if (firstFalling) {
        this.tb.ctrl.addHold(firstFalling.falling.kind);
      }
      this.tb.ctrl.removeFalling();

      this.tb.ctrl.spawn(hold);
    } else {
      const fallings = this.tb.board.getFallingBlocks() as FallingBlockAt[];
      const firstFalling = fallings.shift();
      if (firstFalling) {
        this.tb.ctrl.addHold(firstFalling.falling.kind);
        this.tb.ctrl.removeFalling();
      }
    }

    this.tb.isPlacingDelay = false;
  }
}

class RenderHandler {
  render: GameRender;
  meshList: ("Grid" | "Case" | "Next" | "Hold" | "Cover")[] = [
    "Grid",
    "Case",
    "Next",
    "Hold",
    "Cover",
  ];
  textList: ("nickNameText" | "infoText")[] = ["infoText", "nickNameText"];
  tetriminos: TetrisIMesh[] = [
    "I",
    "O",
    "T",
    "J",
    "L",
    "S",
    "Z",
    "Hint",
    "Garbage",
  ];
  isDirty = false;
  tetrisBoard;
  isScoreEffectOn = false;
  scoreEffectTimeout: number | null = null;
  constructor(tetrisBoard: TetrisBoard, render: GameRender) {
    this.tetrisBoard = tetrisBoard;
    this.render = render;
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
        this.render.pushInstancedMeshInfo(each, {
          id: `${this.tetrisBoard.boardId}`,
          object: obj,
        });
      });
    });

    this.textList.forEach((each) => {
      CONSTANT.gfx.boardCoord[each].forEach((trs) => {
        const obj = trsToObj(trs);
        this.render.addText(`${this.tetrisBoard.boardId}_${each}`, "", obj);
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

    for (const tetrimino of this.tetriminos) {
      this.render.removeInstancedMeshInfoByFilterId(
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
        this.render.pushInstancedMeshInfo(next, {
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
        this.render.pushInstancedMeshInfo(this.tetrisBoard.hold, {
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

          this.render.pushInstancedMeshInfo(kind, {
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

          this.render.pushInstancedMeshInfo(tetr, {
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

          this.render.pushInstancedMeshInfo("Hint", {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
        } else {
          //
        }
      }
    }
  }

  addEndCover() {
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

    CONSTANT.gfx.boardCoord["EndCover"].forEach((trs) => {
      const obj = trsToObj(trs);
      this.render.pushInstancedMeshInfo("EndCover", {
        id: `${this.tetrisBoard.boardId}`,
        object: obj,
      });
    });
  }
  removeEndCover() {
    this.render.removeInstancedMeshInfoByFilterId(
      "EndCover",
      `${this.tetrisBoard.boardId}`
    );
  }

  removeGarbageQueue() {
    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageQueue",
      `${this.tetrisBoard.boardId}`
    );
    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageReady",
      `${this.tetrisBoard.boardId}`
    );
  }

  move(newTransform: Transform) {
    // "Cover" |"CoverLine"| "Case" | "E" | "H" | "GarbageQueue" | "GarbageReady" | "Garbage" |Tetrimino;
    /*
      Cover: {}_Block
      CoverLine: {}_Block
      Case: {}_Block
      E: {}_Block
      H: {}_Block,
      GarbageQueue: {}_Block,
      GarbageReady: {}_Block,
      Garbage: 
      Tetrimino: {}_Block,
      {}_Next,
      {}_Hold,
      Cover: {}_Block_EndCover
    */

    this.object.position.set(...newTransform.position);
    this.object.rotation.set(...newTransform.rotation);
    this.object.scale.set(...newTransform.scale);

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

    this.textList.forEach((each) => {
      CONSTANT.gfx.boardCoord[each].forEach((trs) => {
        const obj = trsToObj(trs);
        this.render.moveText(`${this.tetrisBoard.boardId}_${each}`, obj);
      });
    });

    this.meshList.forEach((each) => {
      this.render.removeInstancedMeshInfoByFilterId(
        each,
        `${this.tetrisBoard.boardId}`
      );
      CONSTANT.gfx.boardCoord[each].forEach((trs) => {
        const obj = trsToObj(trs);
        this.render.pushInstancedMeshInfo(each, {
          id: `${this.tetrisBoard.boardId}`,
          object: obj,
        });
      });
    });

    this.garbageQueueSet(this.tetrisBoard.garbageQueue);

    if (this.tetrisBoard.isAddEndCover) {
      this.removeEndCover();
      this.addEndCover();
    } else {
      this.removeEndCover();
    }

    // tetrimino
    this.update();
  }

  garbageQueueSet(garbageQueue: GarbageQueue[]) {
    const group = new THREE.Group();
    group.position.copy(this.object.position);
    group.rotation.copy(this.object.rotation);
    group.scale.copy(this.object.scale);

    const dummy = new THREE.Object3D();
    group.add(dummy);

    const finalPos = new THREE.Vector3();
    const finalQuat = new THREE.Quaternion();
    const finalScale = new THREE.Vector3();
    // const finalEuler = new THREE.Euler();

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

    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageQueue",
      `${this.tetrisBoard.boardId}`
    );
    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageReady",
      `${this.tetrisBoard.boardId}`
    );

    const yBase = -26;
    let y = 0;
    console.log("garbageQueue", garbageQueue);
    for (const gq of garbageQueue) {
      for (let i = 0; i < gq.line; i++) {
        y += 1;
        // dummy.position.set(-1.0, yBase + y, 0);
        // dummy.scale.set(0.5, 1, 1);

        // dummy.getWorldPosition(finalPos);
        // dummy.getWorldQuaternion(finalQuat);
        // finalEuler.setFromQuaternion(finalQuat);
        // dummy.getWorldScale(finalScale);

        const obj = trsToObj({
          position: [-1, yBase + y, 0],
          scale: [0.5, 1, 1],
        });

        if (gq.kind === "Queued") {
          this.render.pushInstancedMeshInfo("GarbageQueue", {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
        } else if (gq.kind === "Ready") {
          this.render.pushInstancedMeshInfo("GarbageReady", {
            id: `${this.tetrisBoard.boardId}`,
            object: obj,
          });
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
    this.render.updateText(
      `${this.tetrisBoard.boardId}_infoText`,
      this.infoTextMake(this.tetrisBoard.info)
    );
  }

  updateNickNameText(nickName: string) {
    this.render.updateText(
      `${this.tetrisBoard.boardId}_nickNameText`,
      nickName
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
      this.render.removeText(`${this.tetrisBoard.boardId}_ScoreEffectText`);
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
    let txt;
    if (combo) {
      txt = `${kind}\n${combo} Combo`;
    } else {
      txt = `${kind}`;
    }

    this.isScoreEffectOn = true;
    this.render.addText(
      `${this.tetrisBoard.boardId}_ScoreEffectText`,
      txt,
      obj
    );

    this.scoreEffectTimeout = setTimeout(() => {
      this.render.removeText(`${this.tetrisBoard.boardId}_ScoreEffectText`);
      this.isScoreEffectOn = false;
    }, 1500);
  }

  frame() {
    if (this.isDirty) {
      this.tetrisBoard.showFallingHint();
      this.update();
      this.isDirty = false;
    }
    this.updateInfoText();
  }

  destroy() {
    [...this.meshList, ...this.tetriminos].forEach((each) => {
      this.render.removeInstancedMeshInfoByFilterId(
        each,
        `${this.tetrisBoard.boardId}`
      );
    });
    this.render.removeInstancedMeshInfoByFilterId(
      "EndCover",
      `${this.tetrisBoard.boardId}`
    );
    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageQueue",
      `${this.tetrisBoard.boardId}`
    );
    this.render.removeInstancedMeshInfoByFilterId(
      "GarbageReady",
      `${this.tetrisBoard.boardId}`
    );
    this.textList.forEach((each) => {
      this.render.removeText(`${this.tetrisBoard.boardId}_${each}`);
    });
  }
}
