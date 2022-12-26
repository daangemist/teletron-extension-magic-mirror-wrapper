#!/bin/bash

set -e

if [ ! -d "$PWD/node_modules" ]; then
    npm ci
fi

if [ ! -d "$PWD/../node_modules" ]; then
    cd ..
    npm ci
    cd -
fi

npm run watch