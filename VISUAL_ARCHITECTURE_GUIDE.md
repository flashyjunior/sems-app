# SEMS Deployment Architecture - Visual Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMS Application (Deployed)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        MSI Installer (1.7 MB)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  sems-tauri.exe (Tauri Wrapper)                          │  │
│  │  ├─ Rust-compiled Windows executable                     │  │
│  │  ├─ Embedded server startup logic                        │  │
│  │  ├─ Path resolution for both dev and production          │  │
│  │  └─ Error handling and user feedback                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Application Files                                       │  │
│  │  ├─ package.json (dependency list)                       │  │
│  │  ├─ tsconfig.json (TypeScript config)                    │  │
│  │  ├─ next.config.js (Next.js config)                      │  │
│  │  ├─ src/ (source code)                                   │  │
│  │  ├─ public/ (static assets)                              │  │
│  │  └─ prisma/ (database schema)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Configuration Files                                     │  │
│  │  ├─ tauri.conf.json (Tauri configuration)                │  │
│  │  ├─ .env (environment variables)                         │  │
│  │  └─ prisma/schema.prisma (data schema)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

      (On first installation, adds ~500 MB):
      - node_modules/ (npm dependencies)
      - .next/ (compiled Next.js application)
```

---

## Application Launch Flow

```
USER CLICKS SHORTCUT
         │
         ▼
┌─────────────────────────────────┐
│  sems-tauri.exe STARTS          │
│  (Tauri Window Manager)         │
└─────────────────────────────────┘
         │
         ▼
    [BACKGROUND PROCESS]
┌─────────────────────────────────────────────────────┐
│  Rust Code: find_app_root()                         │
├─────────────────────────────────────────────────────┤
│  Strategies:                                        │
│  1. Check: exe_dir/../../.. (dev environment)      │
│  2. Check: exe_dir (installed location)            │
│  3. Check: exe_dir/.. (fallback)                   │
│                                                     │
│  Looks for: package.json                           │
│  Returns: Path to application root                 │
└─────────────────────────────────────────────────────┘
         │
         ▼
    [FIRST LAUNCH ONLY]
┌─────────────────────────────────────────────────────┐
│  Rust Code: ensure_dependencies()                   │
├─────────────────────────────────────────────────────┤
│  Checks for:                                        │
│  - node_modules directory (npm dependencies)       │
│  - .next directory (compiled app)                  │
│                                                     │
│  If missing:                                        │
│  - Runs: npm install --production (~40 sec)        │
│  - Runs: npm run build (~15 sec)                   │
│                                                     │
│  If present:                                        │
│  - Skips (fast startup)                            │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Rust Code: start_node_server()                     │
├─────────────────────────────────────────────────────┤
│  Executes:                                          │
│  npm run start                                      │
│                                                     │
│  Which starts:                                      │
│  Node.js (JavaScript runtime)                      │
│  Next.js server (on port 3000)                     │
│                                                     │
│  Waits: 3-5 seconds for server startup             │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Tauri Opens Web View                               │
│  URL: http://localhost:3000                        │
├─────────────────────────────────────────────────────┤
│  Loads:                                             │
│  - Next.js frontend                                │
│  - React components                                │
│  - User interface                                  │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  ✅ LOGIN SCREEN APPEARS                            │
└─────────────────────────────────────────────────────┘
         │
         ▼
    USER LOGS IN
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  ✅ APPLICATION READY FOR USE                       │
│                                                     │
│  Running:                                           │
│  - Tauri window (desktop wrapper)                  │
│  - Node.js server (backend)                        │
│  - Next.js frontend (UI)                           │
│  - PostgreSQL (database)                           │
└─────────────────────────────────────────────────────┘
```

---

## Process Architecture at Runtime

```
Windows Desktop
│
├─ sems-tauri.exe (Tauri Wrapper)
│  │
│  ├─ spawns ▶─ node.exe (Node.js Runtime)
│  │                    │
│  │                    ├─ npm (Package Manager)
│  │                    │
│  │                    └─ next.exe (Next.js Server)
│  │                       └─ Listening on http://localhost:3000
│  │
│  └─ contains ▶─ WebView
│                  │
│                  ├─ Connects to ▶─ http://localhost:3000
│                  │
│                  └─ Renders ▶─ React Frontend
│
└─ PostgreSQL.exe (Optional - Database)
   │
   └─ Listens on ▶─ localhost:5432
```

---

## Data Flow During Operation

```
USER INTERACTION
(Click, Type, etc.)
         │
         ▼
┌──────────────────────────────┐
│  React Component             │
│  (Tauri WebView)             │
└──────────────────────────────┘
         │
         ▼
     API CALL
   POST /api/dispenses
   GET /api/drugs
   etc.
         │
         ▼
┌──────────────────────────────┐
│  Next.js Server              │
│  localhost:3000              │
│                              │
│  ├─ Route Handlers           │
│  ├─ Middleware               │
│  ├─ Authentication           │
│  └─ Database Queries         │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  PostgreSQL Database         │
│  localhost:5432              │
│                              │
│  └─ Stores/Retrieves Data    │
└──────────────────────────────┘
         │
         ▼
    RESPONSE DATA
         │
         ▼
┌──────────────────────────────┐
│  React Updates UI            │
│  Shows Results               │
└──────────────────────────────┘
```

---

## File Structure After Installation

```
C:\Program Files\SEMS\
│
├─ sems-tauri.exe ⭐ (Application launcher)
│
├─ 📦 NPM CONFIGURATION
│  ├─ package.json (dependencies: next, react, prisma, etc.)
│  ├─ package-lock.json (locked versions)
│  └─ node_modules/ (created on first run, ~300 MB)
│
├─ 🔧 APPLICATION CONFIG
│  ├─ tauri.conf.json (Tauri settings)
│  ├─ next.config.js (Next.js settings)
│  ├─ tsconfig.json (TypeScript settings)
│  ├─ postcss.config.mjs (CSS settings)
│  ├─ eslint.config.mjs (Linting)
│  └─ .env (Environment variables)
│
├─ 💾 DATABASE CONFIG
│  ├─ prisma/
│  │  ├─ schema.prisma (Data models)
│  │  └─ migrations/ (Schema versions)
│  └─ .env.local (Database URL, only if using local DB)
│
├─ 📄 SOURCE CODE
│  ├─ src/
│  │  ├─ app/ (Next.js pages)
│  │  ├─ components/ (React components)
│  │  ├─ lib/ (Utilities)
│  │  ├─ services/ (Business logic)
│  │  └─ types/ (TypeScript types)
│  │
│  ├─ public/ (Static assets)
│  │  ├─ manifest.json
│  │  ├─ favicon.ico
│  │  └─ loading.html (splash screen)
│  │
│  └─ scripts/ (Utility scripts)
│
├─ 🏗️ BUILD OUTPUT
│  ├─ .next/ (created on first run, ~200 MB)
│  │  ├─ .config/
│  │  ├─ server/
│  │  ├─ static/
│  │  └─ public/
│  │
│  └─ out/ (static export, if applicable)
│
└─ 📋 DOCUMENTATION
   ├─ INSTALL_GUIDE.md
   ├─ DEPLOYMENT_GUIDE.md
   └─ README.md
```

---

## Comparison: Before vs After

### BEFORE (User Manual Server Startup)
```
User clicks shortcut
         │
         ▼
Tauri opens to blank window
"Can't reach localhost:3000"
         │
         ▼
User manually opens terminal
         │
         ▼
User types: npm run dev
         │
         ▼
Server starts...
         │
         ▼
User clicks refresh
         │
         ▼
✅ App finally loads

❌ PROBLEM: Complex, not user-friendly
```

### AFTER (Automatic Server Startup)
```
User clicks shortcut
         │
         ▼
Tauri app starts
         │
         ▼
Rust code finds and runs npm automatically
         │
         ▼
Server starts in background
         │
         ▼
Login screen appears automatically
         │
         ▼
✅ App ready to use immediately

✅ SOLUTION: Simple, professional, user-friendly
```

---

## System Requirements Visualization

```
USER'S COMPUTER
│
├─ Windows 10/11 ✅ (Required)
│  └─ 64-bit architecture
│
├─ Node.js 18 LTS ✅ (Required, installed once)
│  │
│  ├─ npm (Package manager)
│  │  └─ Used to: npm install, npm build, npm start
│  │
│  └─ node (JavaScript runtime)
│     └─ Used to: run Next.js server
│
├─ SEMS Application ✅ (What we provide)
│  └─ MSI installer (1.7 MB)
│
├─ PostgreSQL 🟢 (Optional)
│  └─ If using local database
│     If using cloud: not needed
│
└─ ~500 MB Free Disk Space ✅ (After first install)
   ├─ node_modules (~300 MB, created on first run)
   └─ .next (~200 MB, created on first run)
```

---

## Build Process Overview

```
DEVELOPMENT ENVIRONMENT
│
├─ Edit Source Code
│  └─ src/, components/, etc.
│
├─ Test Locally
│  └─ npm run dev (hot reload)
│
└─ Build for Production
   │
   ├─ npm run build
   │  └─ Compiles Next.js to .next/
   │
   └─ npm run tauri build
      │
      ├─ Runs cargo build --release
      │  └─ Compiles Rust to sems-tauri.exe
      │
      └─ Runs WiX candle + light
         └─ Creates: sems-tauri_0.1.0_x64_en-US.msi

OUTPUT: Windows MSI Installer (1.7 MB)
        Ready for distribution
```

---

## Installation Timeline

```
MINUTE 0: User double-clicks MSI
          │
          ├─ Windows recognizes as installer
          └─ Prompts for admin rights
             │
MINUTE 0-1: Windows runs installer
            │
            ├─ Creates Program Files\SEMS\
            ├─ Copies sems-tauri.exe
            ├─ Copies package.json
            ├─ Copies source files
            └─ Creates desktop shortcut

MINUTE 1: Installation complete
          User can click shortcut

MINUTE 1: User clicks SEMS shortcut
          │
          ├─ First launch detected (no node_modules)
          │
MINUTE 1-2: npm install running
            Downloading 500+ packages (~40 seconds)
            │
MINUTE 2: npm install complete
          │
MINUTE 2-2.5: npm build running
              Compiling Next.js
              │
MINUTE 2.5: Build complete
            │
MINUTE 2.5-3: npm start running
              Server initializing
              │
MINUTE 3: Server ready
          │
MINUTE 3: Browser shows login screen
          │
          ✅ READY TO USE (3 minutes total on first launch)

MINUTE 4+: Subsequent launches
           Take only 5-10 seconds
           (skips install/build steps)
```

---

## Deployment Checklist Visualization

```
✅ BEFORE DEPLOYMENT
   ├─ Review documentation
   ├─ Test on clean Windows VM
   ├─ Verify Node.js installation
   ├─ Test first-launch experience
   └─ Document any issues

📦 DEPLOYMENT
   ├─ Distribute MSI file
   ├─ Provide INSTALL_GUIDE.md
   ├─ Communicate Node.js requirement
   └─ Prepare support channel

✅ POST-DEPLOYMENT
   ├─ Monitor user feedback
   ├─ Document common issues
   ├─ Update documentation if needed
   └─ Plan for next version
```

---

## Architecture Decision Tree

```
PROBLEM: "Why does desktop app need server running?"

├─ Option 1: Embedded Web Server (Rust)
│  ├─ Pros: No Node.js needed
│  ├─ Cons: Complex, versioning issues, duplicates Next.js
│  └─ Result: ❌ REJECTED
│
├─ Option 2: Static Export
│  ├─ Pros: Lightweight
│  ├─ Cons: Can't support API routes, can't sync data
│  └─ Result: ❌ REJECTED
│
└─ Option 3: Tauri Spawns npm start ✅ CHOSEN
   ├─ Pros: Simple, maintainable, standard Node.js
   ├─ Cons: Requires Node.js prerequisite
   ├─ Pro/Con: ~500 MB installed size (acceptable for professional software)
   └─ Result: ✅ BEST BALANCE
      - User-friendly (auto startup)
      - Developer-friendly (standard stack)
      - Maintainable (standard Node.js)
      - Reliable (proven architecture)
```

---

## Support Decision Tree

```
USER REPORTS: "Can't reach localhost:3000"
│
├─ First Launch?
│  ├─ Yes → "Wait 30-60 seconds, then refresh (F5)"
│  └─ No → Continue...
│
├─ Node.js Installed?
│  ├─ No → "Install Node.js from nodejs.org"
│  └─ Yes → Continue...
│
├─ Check Server Console
│  ├─ Error messages? → Debug specific error
│  ├─ No error messages? → Continue...
│  └─ Console not visible? → Node.js not in PATH
│
├─ Check Port 3000
│  ├─ Port in use? → Kill other process
│  └─ Port available? → Server should start
│
└─ Application Settings
   ├─ Check .env configuration
   ├─ Check database connection
   └─ Review application logs
```

---

This visual guide helps understand:
1. **How the system is structured** (system architecture)
2. **What happens when you launch** (launch flow)
3. **How processes interact** (process architecture)
4. **Where files go** (file structure)
5. **What makes this better** (before/after)
6. **What's needed** (system requirements)
7. **How to build** (build process)
8. **Timeline expectations** (installation timeline)
9. **Deployment steps** (checklist)
10. **Why this design** (decision tree)
