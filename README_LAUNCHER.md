# SEMS: Production Ready - Self-Contained Launcher

## ✅ How It Works Now

Users simply double-click **LAUNCH_SEMS.bat** and:

1. ✅ Launcher checks Node.js is installed
2. ✅ Launcher starts the Next.js server automatically
3. ✅ Launcher waits for server to be ready
4. ✅ Launcher opens the Tauri desktop app
5. ✅ User sees login screen immediately
6. ✅ First launch: User configures API server URL
7. ✅ App works!

## Installation (End User)

### Step 1: Extract Files
Extract `sems-app.zip` to any folder (e.g., `C:\SEMS`)

### Step 2: Install Dependencies (One Time)
The launcher script will automatically:
- Check for Node.js (must be installed separately)
- Install npm dependencies
- Build the application

### Step 3: Run the App
**Double-click**: `LAUNCH_SEMS.bat`

That's it! The app will:
- Start the server automatically
- Open the desktop application
- Show the login screen

## For Developers

### Development Mode
```bash
# Terminal 1
npm run dev

# Terminal 2  
npm run tauri:dev
```

### Build for Distribution
```bash
npm run tauri build
```

Creates MSI installer at:
```
src-tauri/target/release/bundle/msi/sems-tauri_0.1.0_x64_en-US.msi
```

## Files in This Package

- **LAUNCH_SEMS.bat** - Click this to start the app
- **package.json** - Node.js dependencies
- **src/** - React/TypeScript frontend source
- **src-tauri/** - Rust/Tauri desktop app source
- **server.log** - Server output (if you need to debug)

## System Requirements

- **Windows 10 or later** (64-bit)
- **Node.js 18+** (download from https://nodejs.org/)
- **PostgreSQL** (for data storage)

## Troubleshooting

### "Node.js is not installed"
1. Download Node.js: https://nodejs.org/
2. Install it
3. During installation, **make sure to check** "Add to PATH"
4. Restart your computer
5. Try launching again

### Server fails to start
1. Check `server.log` file for details
2. Make sure PostgreSQL is running
3. Make sure the database connection string in `.env` is correct
4. Try running `npm install` again

### App says "Can't reach localhost:3000"
1. Check if `server.log` shows any errors
2. Make sure the server window is still open
3. Wait 10 seconds (server may still be starting)
4. Refresh the app (F5)

### First launch setup screen doesn't appear
1. Login should work (configure later if needed)
2. Go to Settings ⚙️ → Sync Configuration
3. Enter your API server URL there

## API Server Configuration

After logging in, configure where the app syncs data:

**Settings** → **Sync Configuration** → Enter API URL

Examples:
- `http://localhost:3000` - Same computer
- `http://192.168.1.100:3000` - Local network server
- `https://api.yourpharmacy.com` - Cloud server

## Key Files

| File | Purpose |
|------|---------|
| `LAUNCH_SEMS.bat` | **Click this to start** |
| `.env` | Database connection settings |
| `server.log` | Server logs (debugging) |
| `src-tauri/target/release/sems-tauri.exe` | Desktop app executable |

## For IT Department

Users can be instructed to:
1. Extract the zip file
2. Double-click `LAUNCH_SEMS.bat`
3. Wait for the app to open
4. Login with their credentials

No additional setup or complex instructions needed!

## Version Info

- **Version**: 0.1.0
- **Built**: December 25, 2025
- **Technology Stack**:
  - Frontend: Next.js 16 + React 19 + TypeScript
  - Desktop: Tauri 3
  - Backend: Node.js + Express
  - Database: PostgreSQL
  - Offline Storage: IndexedDB (Dexie.js)

## Support

For issues:
1. Check `server.log` for server errors
2. Check browser console (F12) for app errors
3. Ensure PostgreSQL is running
4. Verify `.env` database connection
5. Try a clean restart of the launcher
