import type { TickerDelegation } from "./type";
//
// setup
// start timer 3, 2, 1
// start
// loop
// end
export class GameLoop {
  accumulatedDelta = 0;
  lastTicking = 0;
  oneTick = 1 / 60; //fps

  // ticker = new Ticker();
  delegation: TickerDelegation | undefined;

  gameLoopStart() {
    this.delegation?.initTicking();
  }

  gameLoopUpdate(delta: number) {
    this.accumulatedDelta += delta;
    if (this.accumulatedDelta - this.lastTicking > this.oneTick) {
      this.delegation?.ticking();
      this.lastTicking = this.accumulatedDelta;
    }
  }

  gameLoopEnd() {
    // this.delegation?.evtGameOver();
  }
}
