@echo off
setlocal enabledelayedexpansion

REM SEMS Launcher Script - Starts the app with embedded server
REM This script ensures Node.js and the server are running before launching Tauri

cd /d "%~dp0"

echo.
echo ============================================
echo   SEMS - Smart Dispensing System
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Make sure to add Node.js to your PATH during installation.
    echo.
    pause
    exit /b 1
)

echo Step 1: Checking dependencies...
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure you extracted the application properly.
    pause
    exit /b 1
)

echo Step 2: Installing/updating dependencies...
call npm install >nul 2>&1

echo Step 3: Building application...
call npm run build >nul 2>&1
if errorlevel 1 (
    echo ERROR: Build failed!
    call npm run build
    pause
    exit /b 1
)

echo Step 4: Starting backend server...
REM Start the server in a hidden window
start /B "" cmd /c "npm run start >server.log 2>&1"

REM Wait for server to start
echo Waiting 5 seconds for server to initialize...
timeout /t 5 /nobreak

REM Check if server is running
powershell -NoProfile -Command "try { $r = Invoke-WebRequest http://localhost:3000 -TimeoutSec 2 -ErrorAction Stop } catch { exit 1 }"
if errorlevel 1 (
    echo.
    echo WARNING: Server may not have started properly.
    echo Check server.log for details.
    echo.
)

echo Step 5: Launching SEMS application...
echo.

REM Launch the Tauri app
start "" "src-tauri\target\release\sems-tauri.exe"

echo.
echo ============================================
echo   SEMS is starting...
echo ============================================
echo.
echo Server running on: http://localhost:3000
echo.
echo Tip: Check server.log if you experience connection issues
echo.

timeout /t 2 /nobreak
