# SEMS Deployment Guide

## Overview

SEMS (Smart Dispensing System) is packaged as a Windows MSI installer that includes:
- A Tauri desktop wrapper
- A Next.js frontend application  
- An integrated Node.js runtime launcher

## System Requirements

**Before installing SEMS**, users must have:

1. **Windows 10 or later** (64-bit)
2. **Node.js 18 LTS or higher** - Available at https://nodejs.org/
3. **PostgreSQL 12+** (optional, if not using cloud database)

### Node.js Installation Instructions

1. Visit https://nodejs.org/
2. Download the **LTS (Long-Term Support)** version
3. Run the installer
4. **Critical**: Enable "Add to PATH" during installation
5. Restart your computer
6. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Installation Process

### For Users (Using MSI)

1. **Download** the SEMS MSI installer
2. **Double-click** the .msi file
3. **Follow** the installation wizard
4. **Wait** for installation to complete
5. **Launch** SEMS from the Start Menu or desktop shortcut
6. **Wait** 10-15 seconds on first launch (server is starting)
7. **Login** with your credentials

### For Developers (Building from Source)

#### Option 1: Using PowerShell (Windows)

```powershell
# Navigate to project directory
cd e:\DEVELOPMENTS\FLASH_DEVS\SEMS\sems-app

# Run the build script
.\build-production.ps1
```

#### Option 2: Manual Build

```powershell
# Step 1: Clean and install
npm install

# Step 2: Build Next.js
npm run build

# Step 3: Build Tauri app
cd src-tauri
cargo build --release
cd ..

# Step 4: Create MSI
npm run tauri build
```

## How It Works

### On First Launch

1. **Tauri app starts** → checks for Node.js runtime
2. **Validates dependencies** → checks if npm packages are installed
3. **Installs packages** (if needed) → runs `npm install --production`
4. **Builds Next.js** (if needed) → runs `npm run build`
5. **Starts server** → launches `npm run start` on port 3000
6. **Shows login** → Tauri opens the web UI

### On Subsequent Launches

1. **Tauri app starts** → detects existing setup
2. **Starts server immediately** → skips installation steps
3. **Shows login** → within 3-5 seconds

## Troubleshooting

### Issue: "Node.js is not installed"

**Solution:**
1. Install Node.js from https://nodejs.org/ (LTS version)
2. Choose "Add to PATH" during installation
3. Restart your computer
4. Launch SEMS again

### Issue: "localhost page can't be found" or "Can't reach server"

**Solution 1: Wait longer**
- First launch takes 30-60 seconds to initialize
- Refresh the page (F5) after 15 seconds

**Solution 2: Check Node.js installation**
```bash
# Open Command Prompt and type:
node --version
npm --version
```
If these fail, Node.js isn't installed correctly.

**Solution 3: Check server logs**
- A console window appears when SEMS launches
- Check for error messages in this window
- Keep the window open while using the app

**Solution 4: Manual server start**
If the automated startup fails:
```bash
# Find SEMS installation directory (usually C:\Program Files\SEMS)
cd "C:\Program Files\SEMS"
npm install --production
npm run build
npm run start
```
Then visit http://localhost:3000 in your browser.

### Issue: Database Connection Error

**Solution:**
1. Verify PostgreSQL is installed and running
2. Check database connection settings in `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/sems_db"
   ```
3. Restart the application
4. Contact your IT support if issues persist

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Application Won't Start

**Solution:**
1. Ensure Node.js is installed: `node --version`
2. Check the console window for error messages
3. Try uninstalling and reinstalling SEMS
4. Check available disk space (at least 1GB free)
5. Ensure your Windows user account has write permissions

## Advanced Configuration

### Environment Variables

Edit the `.env` file in the SEMS installation directory:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/sems_db"

# Server configuration  
NODE_ENV=production
PORT=3000

# Logging
DEBUG=sems:*
```

### Sync Settings (In-App)

1. **Launch SEMS**
2. **Click** Settings (⚙️) in the top menu
3. **Go to** "Sync Configuration"
4. **Enter** your pharmacy server URL
5. **Click** "Test Connection"
6. **Save** settings

## Performance Notes

### First Launch (New Installation)
- **Expected time:** 30-60 seconds
- **What's happening:** Installing npm packages, building Next.js
- **Normal behavior:** Server console window shows progress

### Subsequent Launches
- **Expected time:** 5-10 seconds
- **What's happening:** Starting server, loading UI
- **Normal behavior:** Quick startup with existing dependencies

### Optimizations for Future Builds
- Pre-install dependencies in MSI (adds ~200MB to installer)
- Use portable Node.js (adds ~50MB to installer)
- Pre-build Next.js (requires rebuild on each version update)

## File Structure (After Installation)

```
C:\Program Files\SEMS\
├── sems-tauri.exe         # Main application
├── package.json           # Dependencies list
├── package-lock.json      # Dependency lock file
├── .env                   # Configuration
├── tsconfig.json          # TypeScript config
├── next.config.js         # Next.js config
├── src/                   # Source code
├── public/                # Static assets
├── prisma/                # Database schema
├── .next/                 # Built application (created on first run)
├── node_modules/          # Dependencies (created on first run)
└── logs/                  # Application logs
```

## Uninstallation

1. **Open** Settings → Apps → Apps & Features
2. **Search** for "SEMS"
3. **Click** and select "Uninstall"
4. **Confirm** the uninstall
5. **Delete** configuration files if desired:
   - `C:\Program Files\SEMS\` directory

## Support & Documentation

- **Installation Help:** See INSTALL_GUIDE.md
- **System Requirements:** See above
- **API Documentation:** See API_DOCS.md
- **Configuration:** See System Settings in app

---

**SEMS Version:** 0.1.0  
**Built:** December 26, 2025  
**Last Updated:** December 26, 2025
