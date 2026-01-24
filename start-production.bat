@echo off
REM SEMS Production Startup Script (Windows)
REM This script starts the Next.js server and Tauri app for production

echo.
echo ============================================
echo   SEMS - Smart Dispensing System
echo   Production Startup
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Step 1: Building application...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed.
    pause
    exit /b 1
)

echo.
echo Step 2: Starting backend server...
start "SEMS Backend Server" cmd /k npm run start

REM Wait for server to start
timeout /t 3 /nobreak

echo.
echo Step 3: Starting Tauri application...
start "" .\src-tauri\target\release\sems-tauri.exe

echo.
echo ============================================
echo   ✓ SEMS is starting
echo ============================================
echo.
echo Server: http://localhost:3000
echo Close the server window to stop everything
echo.
pause
