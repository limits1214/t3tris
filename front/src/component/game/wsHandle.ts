import type { GameManager } from "./gameManager";

export class WsSender {
  gm: GameManager;
  _sender: ((msg: string) => void) | undefined;
  constructor(gm: GameManager) {
    this.gm = gm;
  }
  set sender(send: (msg: string) => void) {
    this._sender = send;
  }
  get sender(): ((msg: string) => void) | undefined {
    return this._sender;
  }
  gameId: string | undefined;

  wsSend(action: unknown) {
    console.log("wsSend!", action, this.gameId);
    if (this.gameId) {
      const obj = {
        type: "gameAction",
        data: {
          action,
          gameId: this.gameId,
        },
      };
      if (this._sender) {
        this._sender(JSON.stringify(obj));
      }
    } else {
      console.log("gameId is not set");
    }
  }
}

export class WsReceiver {
  gm: GameManager;
  constructor(gm: GameManager) {
    this.gm = gm;
  }

  onWsMessage(msg: string) {
    const { type, data } = JSON.parse(msg);
    if (type !== "gameAction2") {
      return;
    }
    for (const [k, v] of Object.entries(data.action as string | object)) {
      for (const { action } of v) {
        if (
          typeof action === "object" &&
          action !== null &&
          "setup" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const next = action["setup"].next;
          this.gm.boards[k]?.ctrl.setup({ next, hold: null });
        } else if (
          typeof action === "object" &&
          action !== null &&
          "spawn" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const spawn = action["spawn"].spawn;
          this.gm.boards[k]?.ctrl.spawn(spawn);
        } else if (typeof action === "string" && action === "moveLeft") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.moveLeft();
        } else if (typeof action === "string" && action === "moveRight") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.moveRight();
        } else if (typeof action === "string" && action === "rotateLeft") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.rotateLeft();
        } else if (typeof action === "string" && action === "rotateRight") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.rotateRight();
        } else if (typeof action === "string" && action === "placing") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.placing();
        } else if (typeof action === "string" && action === "lineClear") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.lineClear();
        } else if (typeof action === "string" && action === "step") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.step();
        } else if (typeof action === "string" && action === "doStep") {
          if (k !== this.gm.mainBoardId) continue;
          console.log("doStep");

          if (this.gm.boards[k]) {
            try {
              this.gm.boards[k].stepTick = 0;
              this.gm.boards[k].ctrl.step();
            } catch {
              if (!this.gm.boards[k].isPlacingDelay) {
                this.gm.boards[k].isPlacingDelay = true;
                this.gm.boards[k].placingDelayTick = 0;
                this.gm.boards[k].placingResetCnt = 15;

                // out focus 일경우 강제 티킹해버리기 ticking 이 호출되지 않는다 hidden 이여서
                if (document.hidden) {
                  this.gm.boards[k].placingDelayTick = 999;
                  this.gm.boards[k].tickerHandler?.ticking();
                }
              }
            }
          }
        } else if (typeof action === "string" && action === "softDrop") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.softDrop();
        } else if (typeof action === "string" && action === "hardDrop") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.hardDrop();
        } else if (typeof action === "string" && action === "removeFalling") {
          if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.ctrl.removeFalling();
        } else if (typeof action === "string" && action === "ticking") {
          // if (k === this.gm.mainBoardId) continue;
          this.gm.boards[k]?.tickerHandler?.ticking();
        } else if (typeof action === "string" && action === "boardStart") {
          // if (k !== this.gm.mainBoardId) continue;
          const next = Array(5)
            .fill(null)
            .map(() => {
              return this.gm.boards[k]!.getTetriminoFromSevenBag();
            });

          this.gm.boards[k]?.ctrl.setup({
            hold: null,
            next: next,
          });
          this.gm.boards[k]?.ctrl.boardStart();
        } else if (
          typeof action === "object" &&
          action !== null &&
          "pushNext" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const t = action["pushNext"].next;
          this.gm.boards[k]?.ctrl.pushNext(t);
        } else if (
          typeof action === "object" &&
          action !== null &&
          "shiftNext" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          // const next = action["shiftNext"].next;
          this.gm.boards[k]?.ctrl.shiftNext();
        } else if (
          typeof action === "object" &&
          action !== null &&
          "addHold" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const hold = action["addHold"].hold;

          this.gm.boards[k]?.ctrl.addHold(hold);
        } else if (
          typeof action === "object" &&
          action !== null &&
          "setInfo" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const line = action["setInfo"].line;
          const score = action["setInfo"].score;
          const level = action["setInfo"].level;
          this.gm.boards[k]?.ctrl.setInfo({
            level,
            score,
            line,
          });
        } else if (
          typeof action === "object" &&
          action !== null &&
          "scoreEffect" in action
        ) {
          if (k === this.gm.mainBoardId) continue;
          const kind = action["scoreEffect"].kind;
          const combo = action["scoreEffect"].combo;
          this.gm.boards[k]?.ctrl.scoreEffect(kind, combo);
        } else if (
          typeof action === "object" &&
          action !== null &&
          "boardEnd" in action
        ) {
          // if (k === this.gm.mainBoardId) continue;
          const elapsed = action["boardEnd"].elapsed;
          console.log("boardEnd elapsed: ", elapsed);
          this.gm.boards[k]?.ctrl.boardEnd(elapsed / 1000);
        } else if (
          typeof action === "object" &&
          action !== null &&
          "garbageQueue" in action
        ) {
          // if (k !== this.gm.mainBoardId) continue;
          const queue = action["garbageQueue"].queue;
          this.gm.boards[k]?.ctrl.garbageQueue(queue);
          console.log("GARBAGE QUEUE, ", k, queue);
        } else if (
          typeof action === "object" &&
          action !== null &&
          "doGarbageAdd" in action
        ) {
          // if (k !== this.gm.mainBoardId) continue;
          // const empty = action["doGarbageAdd"].empty;
          // console.log("doGarbageAdd", empty);
          // this.gm.boards[k]?.ctrl.garbageAdd(empty);
          // if (this.gm.boards[k]) {
          //   this.gm.boards[k].addGarbageQueue = [
          //     ...this.gm.boards[k].addGarbageQueue,
          //     ...empty,
          //   ];
          // }
        } else if (
          typeof action === "object" &&
          action !== null &&
          "addGarbage" in action
        ) {
          // if (k === this.gm.mainBoardId) continue;
          // const empty = action["addGarbage"].empty;
          // this.gm.boards[k]?.ctrl.garbageAdd(empty);
        }
      }
    }
  }
}
