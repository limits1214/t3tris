import type { ActionDelegation } from "./type";

export class GameInput {
  delegation: ActionDelegation | undefined;
  isActive = true;
  private handleKeyDown = this.keydown.bind(this);
  private handleKeyUp = this.keyup.bind(this);

  keydown(e: KeyboardEvent) {
    if (!this.isActive) return;
    const k = e.key;
    console.log(k);
    if (k === "a" || k === "ArrowLeft") {
      this.delegation?.actMoveLeft();
    }

    if (k === "d" || k === "ArrowRight") {
      this.delegation?.actMoveRight();
    }

    if (k === "w" || k === "ArrowUp") {
      this.delegation?.actRotateRight();
    }

    if (k === "z") {
      this.delegation?.actRotateLeft();
    }

    if (k === "s" || k === "ArrowDown") {
      this.delegation?.actSoftDrop();
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
      //
    }

    if (k === "d" || k === "ArrowRight") {
      //
    }

    if (k === "w" || k === "ArrowUp") {
      //
    }

    if (k === "z") {
      //
    }

    if (k === "s" || k === "ArrowDown") {
      //
    }
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
