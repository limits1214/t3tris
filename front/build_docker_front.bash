#!/bin/bash
set -e
rm -rf ./tetris-lib-pkg
cp -r ../back/tetris-lib/pkg ./tetris-lib-pkg

docker build \
  -t ghcr.io/limits1214/tetris-front:latest \
  --push \
  .

# docker buildx build \
#   --platform linux/arm64 \
#   -t ghcr.io/limits1214/tetris-front:latest \
#   --push \
#   .

# docker build . -t ghcr.io/limits1214/tetris-front:latest --platform linux/arm64
# docker push ghcr.io/limits1214/tetris-front:latest