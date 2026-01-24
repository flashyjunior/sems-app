# SEMS Production Deployment Guide

## Overview

The SEMS (Smart Dispensing System) is a Tauri-based desktop application that requires:
1. **Tauri App** - The desktop application (sems-tauri.exe)
2. **Next.js Backend** - API server running on localhost:3000

## Production Scenario 1: Standalone Machine (Recommended)

This is the simplest setup for a pharmacy with one dispensing station.

### Requirements
- Windows 10 or later
- Node.js 18+ installed

### Installation Steps

1. **Extract the application files** to a folder (e.g., `C:\SEMS`)

2. **Install dependencies**:
   ```bash
   cd C:\SEMS
   npm install
   ```

3. **Setup the database** (PostgreSQL must be running):
   ```bash
   npm run init:db
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Run the application**:
   ```bash
   npm run start
   ```
   
   This starts the Next.js server. Then open:
   ```
   ./src-tauri/target/release/sems-tauri.exe
   ```

   Or use the batch file (Windows):
   ```bash
   start-production.bat
   ```

### First Launch Configuration

1. The Tauri app will display the **Setup Screen**
2. Enter your API Server URL: `http://localhost:3000`
3. Click "Test & Continue"
4. Login with your credentials
5. System is ready to use

## Production Scenario 2: Network Setup (Multi-Location)

For multiple pharmacy locations connecting to one central server.

### Central Server Setup (On your main computer or VPS)

1. **Deploy the Next.js backend**:
   ```bash
   npm run build
   npm run start
   ```
   This runs on `http://localhost:3000` (on that machine)

2. **Make it accessible over network**:
   - Get the server's IP address: `ipconfig` (Windows)
   - Backend URL will be: `http://192.168.x.x:3000`

### User Machines Setup

1. **Install Tauri app** from the MSI installer
2. **On first launch**, enter:
   ```
   http://192.168.x.x:3000
   (replace with your server's actual IP)
   ```
3. **Configure in Settings** later if needed: Settings → Sync Configuration

## Troubleshooting

### "Can't reach this page" on Tauri App

**Cause**: The Next.js server isn't running

**Solution**:
```bash
# Make sure you're in the app directory
cd C:\SEMS
npm run start
```

Then wait 3-5 seconds for the server to start, then open the Tauri app.

### "Connection failed" on setup screen

**Cause**: The API URL is incorrect or server isn't running

**Steps**:
1. Check the URL is correct (e.g., `http://localhost:3000`)
2. Verify Next.js server is running: `npm run start`
3. Check the server logs for errors
4. Try pinging the server in browser: `http://localhost:3000`

### Database connection errors

**Cause**: PostgreSQL isn't running or credentials are wrong

**Solution**:
1. Check `.env` file for correct database credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/sems_db"
   ```
2. Make sure PostgreSQL is running
3. Run `npm run init:db` to initialize database

## Auto-Startup (Windows)

### Option 1: Create a shortcut

1. Right-click desktop → New → Shortcut
2. Location: `C:\Windows\System32\cmd.exe /k cd C:\SEMS && npm run start`
3. Save as "Start SEMS"
4. Right-click shortcut → Properties → Advanced → Check "Run as administrator"

### Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At startup
4. Action: Start program
5. Program: `npm`
6. Arguments: `run start`
7. Start in: `C:\SEMS`

## Updating the Application

1. **Backup your database** (important!)
   ```bash
   pg_dump sems_db > backup.sql
   ```

2. **Update code**:
   ```bash
   git pull origin main
   npm install
   npm run build
   npm run tauri build
   ```

3. **New MSI** will be in:
   ```
   src-tauri\target\release\bundle\msi\sems-tauri_0.1.0_x64_en-US.msi
   ```

## Architecture

```
┌──────────────────────────────────────────────┐
│  User's Pharmacy Computer                    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────┐              │
│  │  SEMS Desktop App (Tauri)  │              │
│  │  - Dispense records        │              │
│  │  - Local storage (IndexedDB)               │
│  │  - Offline-first           │              │
│  └────────────┬───────────────┘              │
│               │                              │
│               │ API Calls                    │
│               ▼                              │
│  ┌────────────────────────────┐              │
│  │  Next.js Backend Server    │              │
│  │  - API endpoints           │              │
│  │  - Sync logic              │              │
│  └────────────┬───────────────┘              │
│               │                              │
│               │ SQL Queries                  │
│               ▼                              │
│  ┌────────────────────────────┐              │
│  │  PostgreSQL Database       │              │
│  │  - Dispense records        │              │
│  │  - Master data             │              │
│  │  - User information        │              │
│  └────────────────────────────┘              │
│                                              │
└──────────────────────────────────────────────┘
```

## Key Files

- **Application**: `src-tauri/target/release/sems-tauri.exe`
- **MSI Installer**: `src-tauri/target/release/bundle/msi/sems-tauri_0.1.0_x64_en-US.msi`
- **Configuration**: `.env` (backend), localStorage (app settings)
- **Database**: PostgreSQL `sems_db`

## Support

For issues:
1. Check server logs: `npm run start` output
2. Check app logs in browser: F12 Developer Tools
3. Check database connection: `npm run init:db`
