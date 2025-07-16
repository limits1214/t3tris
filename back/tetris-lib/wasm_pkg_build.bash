#!/bin/bash

wasm-pack build --release --target bundler --out-dir ./pkg --features wasm
cargo test --features wasm
mv  bindings pkg

echo "
export * from './Board'
export * from './FallingBlock'
export * from './FallingBlockAt'
export * from './FallingBlockPlan'
export * from './Location'
export * from './MoveDirection'
export * from './MoveError'
export * from './Rotate'
export * from './RotateDirection'
export * from './RotateError'
export * from './SpawnError'
export * from './StepError'
export * from './Tetrimino'
export * from './Tile'
export * from './TileAt'
" >> pkg/bindings/index.ts