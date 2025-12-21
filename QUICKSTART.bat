@echo off
REM SEMS Quick Start Script for Windows

echo ================================
echo SEMS - Smart Dispensing System
echo Setup ^& First Run
echo ================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Using %NODE_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error during npm install
    pause
    exit /b 1
)
echo.

REM Check Rust
echo Checking for Tauri support (Rust)...
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo Optional: Install Rust from https://rustup.rs/ for desktop builds
) else (
    echo Rust is installed. Desktop builds available.
)
echo.

REM Start dev server
echo Starting development server...
echo.
echo Open http://localhost:3000 in your browser
echo.
echo Demo Credentials:
echo   Username: pharmacist
echo   PIN:      1234
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
pause
