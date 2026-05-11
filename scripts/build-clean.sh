#!/usr/bin/env bash
set -euo pipefail

unset npm_config_devdir
export NODE_ENV=production

exec npx next build
