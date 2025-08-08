import type { ActionDelegation } from "./type";
import { RaTimer } from "./util";

export class GameInput {
  moveFirstStuckDelay = (1 / 60) * 1000 * 8;
  moveIntervalDelay = (1 / 60) * 1000 * 2;
  softDropDelay = (1 / 60) * 1000 * 2;
  delegation: ActionDelegation | undefined;
  isActive = true;
  private handleKeyDown = this.keydown.bind(this);
  private handleKeyUp = this.keyup.bind(this);
  raTimer = new RaTimer();

  moveLeftTimeout: number | null = null;
  moveLeftInterval: number | null = null;
  moveRightTimeout: number | null = null;
  moveRightInterval: number | null = null;
  moveSet = new Set<"L" | "R">();

  rotating = false;

  softDropInterval: number | null = null;

  keydown(e: KeyboardEvent) {
    if (!this.isActive || e.repeat) return;
    const k = e.key;
    if (k === "a" || k === "ArrowLeft") {
      const action = () => {
        const cache = [...this.moveSet];
        if (cache[cache.length - 1] === "L") {
          this.delegation?.actMoveLeft();
        }
      };

      this.moveSet.add("L");
      action();
      this.moveLeftTimeout = this.raTimer.setTimeout(() => {
        action();
        this.moveLeftInterval = this.raTimer.setInterval(() => {
          action();
        }, this.moveIntervalDelay);
      }, this.moveFirstStuckDelay);
    }

    if (k === "d" || k === "ArrowRight") {
      const action = () => {
        const cache = [...this.moveSet];
        if (cache[cache.length - 1] === "R") {
          this.delegation?.actMoveRight();
        }
      };

      this.moveSet.add("R");
      action();
      this.moveRightTimeout = this.raTimer.setTimeout(() => {
        action();
        this.moveRightInterval = this.raTimer.setInterval(() => {
          action();
        }, this.moveIntervalDelay);
      }, this.moveFirstStuckDelay);
    }

    if (k === "w" || k === "ArrowUp") {
      if (this.rotating) {
        return;
      }
      this.rotating = true;
      this.delegation?.actRotateRight();
    }

    if (k === "z") {
      if (this.rotating) {
        return;
      }
      this.rotating = true;
      this.delegation?.actRotateLeft();
    }

    if (k === "s" || k === "ArrowDown") {
      if (this.softDropInterval) {
        this.raTimer.clearInterval(this.softDropInterval);
      }
      this.delegation?.actSoftDrop();
      this.softDropInterval = this.raTimer.setInterval(() => {
        try {
          this.delegation?.actSoftDrop();
        } catch {
          //
        }
      }, this.softDropDelay);
    }

    if (k === "Shift") {
      this.delegation?.actHold();
    }

    if (k === " ") {
      this.delegation?.actHardDrop();
    }
  }
  keyup(e: KeyboardEvent) {
    // if (!this.isActive) return;
    // LRSet 비워잇으면

    const k = e.key;
    if (k === "a" || k === "ArrowLeft") {
      this.moveSet.delete("L");
      if (this.moveLeftInterval) {
        this.raTimer.clearInterval(this.moveLeftInterval);
        this.moveLeftInterval = null;
      }
      if (this.moveLeftTimeout) {
        this.raTimer.clearTimeout(this.moveLeftTimeout);
        this.moveLeftTimeout = null;
      }
    }

    if (k === "d" || k === "ArrowRight") {
      this.moveSet.delete("R");
      if (this.moveRightInterval) {
        this.raTimer.clearInterval(this.moveRightInterval);
        this.moveRightInterval = null;
      }
      if (this.moveRightTimeout) {
        this.raTimer.clearTimeout(this.moveRightTimeout);
        this.moveRightTimeout = null;
      }
    }

    if (k === "w" || k === "ArrowUp") {
      this.rotating = false;
    }

    if (k === "z") {
      this.rotating = false;
    }

    if (k === "s" || k === "ArrowDown") {
      if (this.softDropInterval) {
        this.raTimer.clearInterval(this.softDropInterval);
      }
    }
  }

  frame(delta: number) {
    this.raTimer.frame(delta);
  }

  init() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }
  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}

export class InputDispatcher {
  private dispatch = (key: string, keyEvent: string) => {
    const event = new KeyboardEvent(keyEvent, {
      key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };
  moveRightKeydownDispatch = () => {
    this.dispatch("ArrowRight", "keydown");
  };

  moveRightKeyupDispatch = () => {
    this.dispatch("ArrowRight", "keyup");
  };

  moveLeftKeydownDispatch = () => {
    this.dispatch("ArrowLeft", "keydown");
  };

  moveLeftKeyupDispatch = () => {
    this.dispatch("ArrowLeft", "keyup");
  };

  rotateRightKeydownDispatch = () => {
    this.dispatch("w", "keydown");
  };

  rotateRightKeyupDispatch = () => {
    this.dispatch("w", "keyup");
  };

  rotateLeftKeydownDispatch = () => {
    this.dispatch("z", "keydown");
  };

  rotateLeftKeyupDispatch = () => {
    this.dispatch("z", "keyup");
  };

  softDropKeydownDispatch = () => {
    this.dispatch("ArrowDown", "keydown");
  };

  softDropKeyupDispatch = () => {
    this.dispatch("ArrowDown", "keyup");
  };

  hardDropKeydownDispatch = () => {
    this.dispatch(" ", "keydown");
  };

  hardDropKeyupDispatch = () => {
    this.dispatch(" ", "keyup");
  };

  holdKeydownDispatch = () => {
    this.dispatch("Shift", "keydown");
  };

  holdKeyupDispatch = () => {
    this.dispatch("Shift", "keyup");
  };
}
