#!/bin/sh
export PATH="/Users/mac/.nvm/versions/node/v22.20.0/bin:$PATH"
cd "$(dirname "$0")"
exec npm run dev
