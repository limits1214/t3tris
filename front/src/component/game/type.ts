import type { Board, Tetrimino } from "tetris-lib/bindings";
import * as THREE from "three";

export type BoardId = string;

export type TetrisIMeshObject = {
  id: string;
  object: THREE.Object3D;
  // isDirty: boolean;
};
export type TetrisIMeshInfo = {
  objects: TetrisIMeshObject[];
  isDirty: boolean;
};
export type TetrisIMesh =
  | "Cover"
  | "EndCover"
  | "Grid"
  | "Case"
  | "Hint"
  | "GarbageQueue"
  | "GarbageReady"
  | "Garbage"
  | "Next"
  | "Hold"
  | Tetrimino;
export type Transform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};
export type InfoData = {
  level?: number;
  score?: number;
  time?: number;
  line?: number;
};

export interface ActionDelegation {
  actMoveLeft(): void;
  actMoveRight(): void;
  actRotateLeft(): void;
  actRotateRight(): void;
  actSoftDrop(): void;
  actHardDrop(): void;
  actHold(): void;
}

export interface WsSendDelegation {
  send(): void;
}

export interface BoardDelegatin {
  setup(setup: BoardSetup): void;
  getLevel(): number;
  tryStep(): boolean;
  applyStep(): void;
  placefalling(): void;
  tryClearLine(): number[];
}

export type BoardSetup = {
  hold: Tetrimino | null;
  next: Tetrimino[];
};

export interface TickerDelegation {
  initTicking(): void;
  ticking(): void;
  endTicking(): void;
}
export type BoardSyncData = {
  board: Board;
  garbageQueue: GarbageQueue[];
  hold: Tetrimino | null;
  level: number;
  next: Tetrimino[];
  score: number;
  line: number;
  isBoardEnd: boolean;
  elapsed: number;
};
export type GarbageQueue = {
  kind: "Queued" | "Ready";
  line: number;
};
