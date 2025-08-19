#!/bin/bash
set -e

docker build \
  -f api/Dockerfile \
  -t ghcr.io/limits1214/tetris-back-api:latest \
  --push \
  .

# docker buildx build \
#   -f api/Dockerfile \
#   --platform linux/arm64 \
#   -t ghcr.io/limits1214/tetris-back-api:latest \
#   --push \
#   .

# docker build . -t ghcr.io/limits1214/tetris-back-api:latest -f api/Dockerfile --platform linux/arm64
# docker push ghcr.io/limits1214/tetris-back-api:latest