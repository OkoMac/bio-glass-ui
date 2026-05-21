#!/bin/sh
# Xcode Cloud post-clone hook for BION iOS builds.
#
# Lives at ios/App/ci_scripts/ — Xcode Cloud's documented location
# is "next to the .xcodeproj or .xcworkspace", so this is here AND
# a duplicate copy at the repo root to cover either lookup path.
#
# Without this, SPM resolution fails on the cloud worker because
# Capacitor's plugin packages live inside node_modules/@capacitor/*
# and the worker has no Node + never runs npm install.

set -e
set -x

echo "════════════════════════════════════════════════════════════════"
echo "🍃 [ci_post_clone] BION iOS build — installing Node + JS deps"
echo "════════════════════════════════════════════════════════════════"

brew install node@22
brew link --overwrite --force node@22

node --version
npm --version

cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "🍃 Working dir: $(pwd)"
ls -la

echo "════════════════════════════════════════════════════════════════"
echo "🍃 npm ci"
echo "════════════════════════════════════════════════════════════════"
npm ci --no-audit --no-fund

echo "════════════════════════════════════════════════════════════════"
echo "🍃 npm run build (Vite → dist/)"
echo "════════════════════════════════════════════════════════════════"
npm run build

echo "════════════════════════════════════════════════════════════════"
echo "🍃 npx cap sync ios"
echo "════════════════════════════════════════════════════════════════"
npx cap sync ios

echo "════════════════════════════════════════════════════════════════"
echo "🍃 [ci_post_clone] DONE"
echo "════════════════════════════════════════════════════════════════"
ls node_modules/@capacitor/ 2>&1 | head
ls ios/App/App/public/ 2>&1 | head -5
