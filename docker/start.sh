#!/bin/sh

set -e

echo "Deploying prisma migrations"

node /app/node_modules/prisma/build/index.js migrate deploy --config /app/apps/web/prisma.config.ts

echo "Starting web server"

node apps/web/server.js
