#!/bin/bash
set -e

docker build \
  -f api/Dockerfile \
  -t ghcr.io/limits1214/t3tris-back-ws:latest \
  --push \
  .
