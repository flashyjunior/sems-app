#!/bin/bash
# SEMS Build Script - Builds the complete production application
# This script ensures all files are properly bundled for the MSI installer

set -e

echo "=========================================="
echo "SEMS Production Build"
echo "=========================================="

# Step 1: Clean previous builds
echo ""
echo "[1/5] Cleaning previous builds..."
rm -rf .next/
rm -rf src-tauri/target/release/bundle/

# Step 2: Install dependencies
echo ""
echo "[2/5] Installing dependencies..."
npm install

# Step 3: Build Next.js application
echo ""
echo "[3/5] Building Next.js frontend..."
npm run build

# Step 4: Build Rust/Tauri application
echo ""
echo "[4/5] Building Tauri desktop application..."
cd src-tauri
cargo build --release
cd ..

# Step 5: Create MSI installer
echo ""
echo "[5/5] Creating MSI installer..."
npm run tauri build

echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "MSI Installer location:"
echo "  src-tauri/target/release/bundle/msi/sems-tauri_0.1.0_x64_en-US.msi"
echo ""
echo "Next steps:"
echo "  1. Test the installer on a clean Windows machine"
echo "  2. Ensure Node.js 18+ is installed before running SEMS"
echo "  3. Distribute the MSI file to users"
echo ""
