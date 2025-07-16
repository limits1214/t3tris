#!/bin/bash
set -e

docker build \
  -f ws/Dockerfile \
  -t ghcr.io/limits1214/t3tris-back-ws:latest \
  --push \
  .
