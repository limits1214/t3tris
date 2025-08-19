#!/bin/bash
set -e

docker build \
  -f ws/Dockerfile \
  -t ghcr.io/limits1214/tetris-back-ws:latest \
  --push \
  .
