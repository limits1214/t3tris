import type { GameManager } from "./gameManager";
import type { Transform } from "./type";

export class GameBoardLayout {
  gm: GameManager;
  constructor(gm: GameManager) {
    this.gm = gm;
  }
  // const boundary = [[1, 1, 1/1], [4, 2, 1/2], [9, 3, 1/3], [16, 4, 1/4], [25, 5, 1/5], [36, 6, 1/6], [49, 7, 1/7], [64, 8, 1/8], [81, 9, 1/9], [100, 10, 1/10]]
  private boundary = Array(10)
    .fill(null)
    .map((_, idx) => {
      const v = idx + 1;
      return [v * v, v, 1 / v];
    });

  subBoardTransformLayout: { transform: Transform; boardId: string | null }[] =
    [];

  private getBoardGridLayout(count: number): {
    cols: number;
    rows: number;
    scale: number;
  } {
    let select = [1, 1, 1];
    if (count !== 1) {
      for (let i = 0; i < this.boundary.length; i++) {
        if (i < this.boundary.length - 1) {
          const l = this.boundary[i];
          const r = this.boundary[i + 1];
          const min = l[0];
          const max = r[0];
          if (min < count && count <= max) {
            select = this.boundary[i + 1];
            break;
          }
        } else {
          select = this.boundary[this.boundary.length - 1];
        }
      }
    }

    return {
      cols: select[1],
      rows: select[1],
      scale: select[2],
    };
  }

  generateBoardTransformSlot(count: number) {
    const { cols, scale } = this.getBoardGridLayout(count);
    const boardWidth = 26;
    const boardSpacing = 0;
    const boardStride = boardWidth + boardSpacing;
    const defaultXSpacing = 26 / 2 + (26 * scale) / 2;

    const getBoardPosition = (index: number) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x =
        defaultXSpacing +
        -4.5 * scale +
        /*<<spacing*/ boardStride * scale * col;
      const y =
        defaultXSpacing -
        boardStride * scale +
        15.5 * scale -
        /*<<spacing*/ boardStride * scale * row;
      return { x, y, rotation: 0 };
    };

    this.subBoardTransformLayout = Array(count)
      .fill(null)
      .map((_, idx) => {
        const pos = getBoardPosition(idx);
        return {
          transform: {
            position: [pos.x, pos.y, 0],
            rotation: [0, pos.rotation, 0],
            scale: [scale, scale, scale],
          },
          boardId: null,
        };
      });
  }

  subBoardLayoutPacking(plus: number) {
    const otherBoardLen = Object.entries(this.gm.boards).filter(
      (v) => v[0] !== this.gm.mainBoardId
    ).length;

    const currOtherBoardTrasnformSlot = [
      ...this.subBoardTransformLayout.filter((v) => v.boardId !== null),
    ];
    this.generateBoardTransformSlot(otherBoardLen + plus);

    currOtherBoardTrasnformSlot.forEach((slot, idx) => {
      this.subBoardTransformLayout[idx].boardId = slot.boardId;
      const newSlot = this.subBoardTransformLayout[idx];
      if (newSlot.boardId) {
        this.gm.boards[newSlot.boardId]?.renderHandler.move(newSlot.transform);
      }
    });
  }
}
