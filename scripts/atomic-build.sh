#!/bin/bash
# Atomic Next.js rebuild
# Builds to .next_building, then hands activation to a transient systemd job.
# This avoids both the live-manifest mismatch window and the self-termination
# problem from stopping tech-pulse-test inside its own service cgroup.

SITE="/opt/openclaw/workspace/tech-pulse-css"
LOCK="/tmp/nextjs_build.lock"
LOCK_DIR="/tmp/nextjs_build.lock.dir"
PENDING="/tmp/nextjs_rebuild_needed"
LOG="/tmp/atomic_rebuild.log"
ACTIVATE_SCRIPT="$SITE/scripts/activate-build.sh"

cleanup() {
  rm -f "$LOCK"
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '{"pid":%s,"time":"%s"}\n' "$$" "$(date -Iseconds)" > "$LOCK"
    return 0
  fi

  echo "1" > "$PENDING"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build already running — queued pending rebuild" >> "$LOG"
  return 1
}

do_build() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting atomic build..." >> "$LOG"

  # Build to staging dir (service keeps running with old .next).
  # Run Next directly under a cleaned environment so an inherited TURBOPACK
  # flag cannot conflict with the explicit --webpack build mode.
  env -i \
    PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
    HOME="${HOME:-/root}" \
    NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=768" \
    NEXT_DIST_DIR=.next_building \
    NEXT_PUBLIC_AGENT_PANEL="${NEXT_PUBLIC_AGENT_PANEL:-true}" \
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://techand.space}" \
    /bin/bash --noprofile --norc -c "cd '$SITE' && exec ./node_modules/.bin/next build --webpack" >> "$LOG" 2>&1
  if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build FAILED — keeping old .next" >> "$LOG"
    rm -rf "$SITE/.next_building"
    return 1
  fi

  # Run activation in a separate transient unit outside the app cgroup.
  if systemd-run --quiet --wait --collect \
    --unit "tech-pulse-test-activate-$(date +%s)" \
    --service-type=oneshot \
    "$ACTIVATE_SCRIPT" >> "$LOG" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation job finished successfully" >> "$LOG"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activation job FAILED" >> "$LOG"
    rm -rf "$SITE/.next_building"
    return 1
  fi
  return 0
}

acquire_lock || exit 0

do_build

# Check if another change was queued while we were building
while [ -f "$PENDING" ]; do
  rm -f "$PENDING"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pending rebuild detected — running again" >> "$LOG"
  do_build
done
