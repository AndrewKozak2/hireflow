#!/usr/bin/env bash
# Deploys the laptop production stack (docker/laptop/docker-compose.yml).
#
# Meant to run from a dedicated production clone of the repository, either by
# hand or every few minutes from launchd (docker/laptop/launchd.plist.template).
# When origin/main has new commits it fast-forwards the clone and rebuilds and
# restarts the stack; the API applies pending migrations on start. Otherwise it
# only makes sure the stack is up.
#
# Usage: docker/laptop/deploy.sh [--force]
#   --force   rebuild and restart even when main has not changed
#
# Config: HIREFLOW_PROD_CONFIG (default ~/.config/hireflow-prod) must contain
# api.env, minio.env and tunnel.env. See docker/laptop/README.md.

set -euo pipefail

export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BRANCH="${HIREFLOW_DEPLOY_BRANCH:-main}"
export HIREFLOW_PROD_CONFIG="${HIREFLOW_PROD_CONFIG:-$HOME/.config/hireflow-prod}"
COMPOSE=(docker compose -f "$REPO_DIR/docker/laptop/docker-compose.yml")
LOCK_DIR="$HIREFLOW_PROD_CONFIG/deploy.lock"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

for file in api.env minio.env tunnel.env; do
  if [[ ! -f "$HIREFLOW_PROD_CONFIG/$file" ]]; then
    log "Missing $HIREFLOW_PROD_CONFIG/$file — see docker/laptop/README.md"
    exit 1
  fi
done

# One deploy at a time; a lock older than an hour is left over from a crash.
if [[ -d "$LOCK_DIR" ]] && [[ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +60)" ]]; then
  rmdir "$LOCK_DIR"
fi
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "Another deploy is running, skipping."
  exit 0
fi
trap 'rmdir "$LOCK_DIR"' EXIT

if ! docker info >/dev/null 2>&1; then
  log "Docker is not running, will retry next time."
  exit 0
fi

cd "$REPO_DIR"

# Never touch a working copy someone is developing in.
current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "$BRANCH" ]]; then
  log "Refusing to deploy: $REPO_DIR is on '$current_branch', not '$BRANCH'."
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  log "Refusing to deploy: $REPO_DIR has uncommitted changes."
  exit 1
fi

if ! git fetch --quiet origin "$BRANCH"; then
  log "git fetch failed (offline?), will retry next time."
  exit 0
fi

local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse "origin/$BRANCH")"
running="$("${COMPOSE[@]}" ps --status running --quiet | wc -l | tr -d ' ')"

if [[ "$local_sha" == "$remote_sha" && "$FORCE" -eq 0 && "$running" -ge 4 ]]; then
  exit 0
fi

if [[ "$local_sha" != "$remote_sha" ]]; then
  log "Updating ${local_sha:0:7} -> ${remote_sha:0:7}"
  git merge --ff-only --quiet "origin/$BRANCH"
fi

log "Building and starting the stack at $(git rev-parse --short HEAD)..."
"${COMPOSE[@]}" up -d --build --remove-orphans
docker image prune -f >/dev/null
log "Deployed $(git log -1 --format='%h %s')"
