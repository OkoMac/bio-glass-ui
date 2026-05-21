#!/bin/sh
# Xcode Cloud post-clone hook for BION iOS builds.
#
# Xcode Cloud's build runners have Xcode + Homebrew preinstalled but
# NO Node.js, and they don't run `npm install` automatically. Without
# this hook, SPM fails to resolve Capacitor's plugin packages because
# their Package.swift files live inside node_modules/@capacitor/* —
# which doesn't exist on a fresh clone.
#
# This script (auto-detected by Xcode Cloud when placed at
# ci_scripts/ci_post_clone.sh in the repo root) runs immediately
# after the clone and before xcodebuild starts, so by the time SPM
# resolution begins, node_modules + dist/ + the synced iOS bundle
# are all in place.

set -e
set -x

echo "🍃 [ci_post_clone] BION iOS build — installing Node + JS deps"

# Install Node 22 (matches local dev). Homebrew is preinstalled on
# Xcode Cloud workers.
brew install node@22
brew link --overwrite --force node@22

# Sanity check
node --version
npm --version

# CI_PRIMARY_REPOSITORY_PATH points at the cloned bio-glass-ui root
cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "🍃 Working in $(pwd)"

# Install JS deps — `npm ci` uses package-lock.json for reproducibility
# and is faster than `npm install` because it skips dep resolution.
npm ci --no-audit --no-fund

# Build the web app (Vite → dist/)
npm run build

# Sync to ios/App/App/public/ + regenerate
# ios/App/CapApp-SPM/Package.swift with the right
# node_modules paths for the cloud build's filesystem.
npx cap sync ios

echo "🍃 [ci_post_clone] Done — node_modules + dist + iOS sync ready for xcodebuild"
