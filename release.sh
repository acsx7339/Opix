#!/bin/bash

# ==========================================
# Opix Release Helper Script
# ==========================================
# Usage: ./release.sh
#
# This script automates:
# 1. Switching to main
# 2. Merging develop
# 3. Removing Docker/Dev files from main
# 4. Pushing to GitHub
# 5. Returning to develop

echo "========================================"
echo "🚀 Starting Release Process (Develop -> Main)"
echo "========================================"

# Check if we are on a clean git state
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Your working directory is not clean."
  echo "   Please commit or stash your changes before releasing."
  exit 1
fi

# 1. Switch to Main and Update
echo "🔄 Step 1: Updating Main Branch..."
git checkout main
git pull origin main

# 2. Merge Develop
echo "🔀 Step 2: Merging Develop into Main..."
git merge develop

if [ $? -ne 0 ]; then
    echo "❌ Merge conflict! Please resolve conflicts manually and then run this script again."
    exit 1
fi

# 3. Remove Docker Files (Cleanup)
echo "🧹 Step 3: Removing Docker configuration for Production..."
# We try to remove the docker folder. The '|| true' ensures script doesn't fail if already removed.
git rm -r docker 2>/dev/null || true
git rm build.js 2>/dev/null || true

# Check if there are changes to commit (i.e. if we actually removed something)
if [ -n "$(git status --porcelain)" ]; then
    echo "💾 Step 4: Committing cleanup..."
    git commit -m "chore: Clean up dev/docker files for production release"
else
    echo "✅ No cleanup needed (files already removed)."
fi

# 4. Push to Remote
echo "⬆️  Step 5: Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Push failed. Please check your connection."
    exit 1
fi

# 5. Return to Develop
echo "🔙 Step 6: Returning to Develop branch..."
git checkout develop

echo "========================================"
echo "✅ Release to GitHub Complete!"
echo "👉 NEXT STEP: SSH into A2 Hosting and run './deploy_a2.sh'"
echo "========================================"
