#!/bin/bash

SITE="/opt/openclaw/workspace/tech-pulse-css"
LOG="/tmp/atomic_rebuild.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation job started" >> "$LOG"

if ! timeout 20s systemctl stop tech-pulse-test >> "$LOG" 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation FAILED — service stop failed or timed out" >> "$LOG"
  exit 1
fi

rm -rf "$SITE/.next_old" 2>/dev/null

if [ -d "$SITE/.next" ]; then
  mv "$SITE/.next" "$SITE/.next_old"
fi

if [ ! -d "$SITE/.next_building" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation FAILED — .next_building missing" >> "$LOG"
  if ! timeout 20s systemctl start tech-pulse-test >> "$LOG" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation FAILED — could not restore service after missing build" >> "$LOG"
  fi
  exit 1
fi

mv "$SITE/.next_building" "$SITE/.next"

if timeout 20s systemctl start tech-pulse-test >> "$LOG" 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build OK — service started with fresh .next" >> "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build OK — WARNING: service start failed or timed out" >> "$LOG"
  exit 1
fi

(sleep 10 && rm -rf "$SITE/.next_old") &
