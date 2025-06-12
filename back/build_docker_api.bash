#!/bin/bash
set -e

docker build . -t ghcr.io/limits1214/t2ris-back-api:latest -f api/Dockerfile --platform linux/arm64
docker push ghcr.io/limits1214/t2ris-back-api:latest