#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
MODE="${1:-start}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm 未安装。先执行: npm i -g pnpm"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "首次启动，正在安装依赖..."
  pnpm install
fi

case "$MODE" in
  dev)
    echo "启动开发模式: http://localhost:${PORT}"
    PORT="$PORT" pnpm dev
    ;;
  start)
    echo "启动游戏服务: http://localhost:${PORT}"
    PORT="$PORT" pnpm start
    ;;
  *)
    echo "用法: ./run.sh [start|dev]"
    exit 1
    ;;
esac
