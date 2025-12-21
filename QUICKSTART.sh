#!/bin/bash
# SEMS Quick Start Script

set -e

echo "================================"
echo "SEMS - Smart Dispensing System"
echo "Setup & First Run"
echo "================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "  Using $NODE_VERSION"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
npm install
echo ""

# Check Rust (for Tauri)
echo "✓ Checking for Tauri desktop build support..."
if command -v rustc &> /dev/null; then
    echo "  Rust is installed. Desktop builds available."
else
    echo "  Optional: Install Rust from https://rustup.rs/ for desktop builds"
fi
echo ""

# Initialize database
echo "✓ Database will initialize on first app load"
echo ""

# Start dev server
echo "✓ Starting development server..."
echo ""
echo "Open http://localhost:3000 in your browser"
echo ""
echo "Demo Credentials:"
echo "  Username: pharmacist"
echo "  PIN:      1234"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
