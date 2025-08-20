import type { TickerDelegation } from "./type";

export class GameLoop {
  private accumulatedDelta = 0;
  private readonly oneTick = 1 / 60; // seconds per tick
  private readonly maxCatchUpSteps = 5; // spiral-of-death 방지
  delegation?: TickerDelegation;

  gameLoopStart() {
    this.accumulatedDelta = 0;
    this.delegation?.initTicking();
  }

  // fixed update
  // 소모 방식
  gameLoopUpdate(delta: number) {
    // 한 프레임에 지나친 누적 방지
    this.accumulatedDelta = Math.min(
      this.accumulatedDelta + delta,
      this.oneTick * 10
    );

    let steps = 0;
    while (
      this.accumulatedDelta >= this.oneTick &&
      steps < this.maxCatchUpSteps
    ) {
      this.delegation?.ticking();
      this.accumulatedDelta -= this.oneTick;
      steps++;
    }
  }

  gameLoopEnd() {
    this.delegation?.endTicking();
  }
}
