#!/bin/bash

# ==========================================
# A2 Hosting Automated Deployment Script
# ==========================================
#
# Usage: ./deploy_a2.sh
# Place this script in the ROOT of your Node.js App directory.
# (The same directory that contains 'index.js', 'dist', 'Depoly_Source')

# Configuration
SOURCE_DIR="Depoly_Source"  # The folder where you git clone your repo
TARGET_DIR="."              # The current directory (App Root)

echo "========================================"
echo "🚀 Starting Deployment Process"
echo "========================================"

# Check if Source Directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Directory '$SOURCE_DIR' not found!"
    echo "   Please make sure you have created the folder and cloned your git repo into it."
    exit 1
fi

# 1. Update Source Code
echo "⤵️  Step 1: Pulling latest code from Git..."
cd $SOURCE_DIR || exit
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Please check your git credentials or status."
    exit 1
fi

# 2. Build Frontend
echo "🏗️  Step 2: Building Frontend Client..."
# Install Client Dependencies
echo "   -> Installing client dependencies..."
cd client
npm install --silent

# Build React App
echo "   -> Running vite build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed."
    exit 1
fi

# Go back to Source Root
cd .. 

# 3. Deploy Files to App Root
echo "🚚 Step 3: Moving existing files to Production Environment..."

# Go back to App Root (where this script lives)
cd ..

# Copy Server Entry Point
echo "   -> Updating index.js..."
cp $SOURCE_DIR/server/index.js ./index.js

# Copy Package Config
echo "   -> Updating package.json..."
cp $SOURCE_DIR/server/package.json ./package.json

# Update Dist Folder (Remove old, copy new)
echo "   -> Updating dist folder..."
rm -rf ./dist
cp -r $SOURCE_DIR/client/dist ./dist

# 4. Finalize
echo "📦 Step 4: Installing Production Dependencies..."
# We run npm install in the root to ensure the server has what it needs to run
npm install --production --silent

echo "========================================"
echo "✅ Deployment Scripts Finished Successfully!"
echo "👉 NOW: Go to cPanel -> Setup Node.js App -> Click 'Restart' to apply changes."
echo "========================================"
