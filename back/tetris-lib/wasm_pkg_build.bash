#!/bin/bash

wasm-pack build --release --target bundler --out-dir ./pkg --features wasm
cargo test --features wasm
mv  bindings pkg