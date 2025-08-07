export class RaTimer {
  timeoutMap = new Map<
    number,
    {
      acc: number;
      last: number;
      ms: number;
      isTimeout: boolean;
      callback: () => void;
    }
  >();

  timeoutSeq = 0;

  frame(delta: number) {
    for (const [seq, val] of this.timeoutMap.entries()) {
      val.acc += delta;
      if (val.acc - val.last >= val.ms) {
        val.callback();
        if (val.isTimeout) {
          this.timeoutMap.delete(seq);
        } else {
          val.last += val.ms;
        }
      }
    }
  }

  setTimeout(callback: () => void, ms: number) {
    this.timeoutSeq += 1;
    this.timeoutMap.set(this.timeoutSeq, {
      callback,
      ms: ms / 1000,
      acc: 0,
      last: 0,
      isTimeout: true,
    });

    return this.timeoutSeq;
  }

  setInterval(callback: () => void, ms: number) {
    this.timeoutSeq += 1;
    this.timeoutMap.set(this.timeoutSeq, {
      callback,
      ms: ms / 1000,
      acc: 0,
      last: 0,
      isTimeout: false,
    });

    return this.timeoutSeq;
  }

  clearTimeout(seq: number) {
    this.timeoutMap.delete(seq);
  }

  clearInterval(seq: number) {
    this.timeoutMap.delete(seq);
  }
}
