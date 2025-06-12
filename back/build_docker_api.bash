#!/bin/bash
set -e

docker buildx build \
  --platform linux/arm64 \
  -t ghcr.io/limits1214/t2ris-back-api:latest \
  --push \
  .

# docker build . -t ghcr.io/limits1214/t2ris-back-api:latest -f api/Dockerfile --platform linux/arm64
# docker push ghcr.io/limits1214/t2ris-back-api:latest