#!/bin/bash
set -e
rm -rf ./tetris-lib-pkg
cp -r ../back/tetris-lib/pkg ./tetris-lib-pkg

npm run gh-build