import type { ActionDelegation } from "./type";
import { RaTimer } from "./util";

export class GameInput {
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
    if (!this.isActive) return;
    const k = e.key;
    // console.log(k);
    if (k === "a" || k === "ArrowLeft") {
      if (this.moveSet.has("L")) {
        return;
      }
      const action = () => {
        this.delegation?.actMoveLeft();
      };
      this.moveSet.add("L");
      action();
      this.moveLeftTimeout = this.raTimer.setTimeout(() => {
        action();
        this.moveLeftInterval = this.raTimer.setInterval(() => {
          if ([...this.moveSet][this.moveSet.size - 1] === "L") {
            action();
          }
        }, 20);
      }, 150);
    }

    if (k === "d" || k === "ArrowRight") {
      if (this.moveSet.has("R")) {
        return;
      }
      const action = () => {
        this.delegation?.actMoveRight();
      };
      this.moveSet.add("R");
      action();
      this.moveRightTimeout = this.raTimer.setTimeout(() => {
        action();
        this.moveRightInterval = this.raTimer.setInterval(() => {
          if ([...this.moveSet][this.moveSet.size - 1] === "R") {
            action();
          }
        }, 20);
      }, 150);
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
        this.delegation?.actSoftDrop();
      }, 50);
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
