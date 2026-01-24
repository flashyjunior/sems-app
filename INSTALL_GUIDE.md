# SEMS Installation & Setup Guide

## System Requirements

Before installing SEMS, ensure you have:

1. **Windows 10 or later (64-bit)**
2. **Node.js 18 or higher** - Download from https://nodejs.org/
   - During installation, make sure to check "Add to PATH"
   - Restart your computer after installing Node.js
3. **PostgreSQL** - For database storage (optional if using remote server)

## Step 1: Install Node.js

1. Visit https://nodejs.org/
2. Download the **LTS (Long-Term Support)** version
3. Run the installer
4. **Important**: Check the option "Add to PATH" during installation
5. Complete the installation
6. **Restart your computer**

To verify Node.js installation:
```bash
node --version
npm --version
```

## Step 2: Install SEMS

1. Download the MSI installer: `sems-tauri_0.1.0_x64_en-US.msi`
2. Double-click to run the installer
3. Follow the installation wizard
4. Choose installation directory (default: `C:\Program Files\SEMS`)
5. Complete installation

## Step 3: First Launch

1. Click the **SEMS** desktop shortcut (or start from Start Menu)
2. **Wait 5-10 seconds** for the server to start
3. The login screen will appear
4. Enter your credentials to login
5. On first launch, configure your API server URL:
   - Settings ⚙️ → Sync Configuration
   - Enter: `http://localhost:3000` (if running locally)
   - Or your remote server URL

## How It Works

When you launch SEMS:

1. ✅ Tauri application starts
2. ✅ Node.js server automatically starts internally
3. ✅ Server initializes on http://localhost:3000  
4. ✅ Web UI loads automatically
5. ✅ You can use the app

**No manual server startup needed!**

## Troubleshooting

### "Node.js is not installed"
- You didn't install Node.js, or it's not in PATH
- Solution: Install Node.js from https://nodejs.org/ and restart computer

### "App says Can't reach localhost:3000"
- The Node server might still be starting
- Solution: Wait 10 seconds and refresh the app (F5)

### "App won't open/close to console window"
- This is normal - the app runs in the background
- The console window shows server logs
- Close the app from the window (Ctrl+Q or X button)

### Database connection error
- PostgreSQL might not be running
- Or `.env` database credentials are wrong
- Solution: Check database connection settings

### Still having issues?

1. Check the server log window for error messages
2. Make sure Node.js is installed (`node --version`)
3. Make sure npm works (`npm --version`)  
4. Try reinstalling SEMS

## Advanced

### Configuring Database

Edit the `.env` file in the installation directory:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sems_db"
NODE_ENV=production
PORT=3000
```

### Configuring API Server

In the app:
- Settings → Sync Configuration
- Enter your pharmacy server URL
- Test the connection

### Viewing Server Logs

A console window appears when you launch SEMS showing:
- Server startup messages
- Connection logs
- Error messages

Keep this window open while using the app.

## Uninstall

1. Go to Settings → Apps → Apps & Features
2. Find "SEMS"
3. Click and select "Uninstall"
4. Follow the uninstaller wizard
5. Click "Finish"

## Support

For technical issues:
1. Check the server console for error messages
2. Verify Node.js is installed and updated
3. Ensure database is accessible
4. Contact your IT support team

---

**SEMS Version**: 0.1.0  
**Built**: December 26, 2025
