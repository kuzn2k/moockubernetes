#!/bin/sh
set -eu

CONFIG_REPO_URL="${CONFIG_REPO_URL:-https://github.com/kuzn2k/moockubernetes-configs.git}"
CONFIG_REPO_BRANCH="${CONFIG_REPO_BRANCH:-main}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "Cloning config repo: $CONFIG_REPO_URL"
git clone --branch "$CONFIG_REPO_BRANCH" "$CONFIG_REPO_URL" "$WORK_DIR/config-repo"

# Mirror only configuration paths needed by ArgoCD.
mkdir -p "$WORK_DIR/config-repo/argocd" "$WORK_DIR/config-repo/todo-app" "$WORK_DIR/config-repo/log-app"
rsync -a --delete "$ROOT_DIR/gke/argocd/argocd-root.yaml" "$WORK_DIR/config-repo/argocd/"
rsync -a --delete "$ROOT_DIR/gke/argocd/apps/" "$WORK_DIR/config-repo/argocd/apps/"
rsync -a --delete "$ROOT_DIR/todo-app/base/" "$WORK_DIR/config-repo/todo-app/base/"
rsync -a --delete "$ROOT_DIR/todo-app/overlays/" "$WORK_DIR/config-repo/todo-app/overlays/"
rsync -a --delete "$ROOT_DIR/app4.7/" "$WORK_DIR/config-repo/log-app/"

cd "$WORK_DIR/config-repo"

if git status --short | grep -q .; then
  git add .
  git commit -m "Bootstrap config repo from code repo"
  git push origin "$CONFIG_REPO_BRANCH"
  echo "Bootstrap complete."
else
  echo "No changes to push."
fi
