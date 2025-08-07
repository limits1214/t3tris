export class GameBoardLayout {
  //
  boundary = Array(10)
    .fill(null)
    .map((_, idx) => {
      const v = idx + 1;
      return [v * v, v, 1 / v];
    });

  playerTransform = null;
  otherTransform = null;
}
