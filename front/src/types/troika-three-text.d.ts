/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'troika-three-text' {
  import { Mesh } from 'three';

  export class Text extends Mesh {
    text: string;
    anchorX: string;
    anchorY: string;
    fontSize: number;
    font: string;
    color: any;
    curveRadius: number;
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    outlineWidth: number;
    outlineColor: any;
    outlineBlur: number;
    outlineOffsetX: number;
    outlineOffsetY: number;
    sync(callback?: () => void): void;
  }
}