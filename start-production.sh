#!/bin/bash

# SEMS Production Startup Script
# This script starts the Next.js server and Tauri app for production

echo "🏥 Starting SEMS - Smart Dispensing System"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Start the Next.js server in the background
echo "📦 Starting backend server..."
npm run start > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Failed to start server. Check server.log for details."
    exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Launch the Tauri app
echo "🚀 Launching SEMS application..."
./src-tauri/target/release/sems-tauri.exe &
APP_PID=$!

echo "✅ Application launched"
echo ""
echo "📝 Server running on http://localhost:3000"
echo "💡 Tip: Press Ctrl+C in this window to stop the server"
echo ""

# Wait for server process
wait $SERVER_PID
