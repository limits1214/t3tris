#!/bin/bash
set -e
rm -rf ./tetris-lib-pkg
cp -r ../back/tetris-lib/pkg ./tetris-lib-pkg

npm install
npm run gh-build

# ghpage refresh 404 issue
cp build/index.html build/404.html