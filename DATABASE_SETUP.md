# Database Configuration Guide

## Current Issue

The Prisma client cannot connect to PostgreSQL because:
- ❌ `DATABASE_URL` environment variable is **not set**
- PostgreSQL is running (you can query it from pgAdmin)
- Tables exist in the database

## Quick Fix

### Step 1: Check your `.env` file

Create or edit `.env` in the project root:

```bash
# For local development with PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/sems"
```

Replace:
- `postgres` - your PostgreSQL username
- `password` - your PostgreSQL password  
- `localhost` - your PostgreSQL host (or IP address)
- `5432` - PostgreSQL port (default is 5432)
- `sems` - your database name

### Step 2: Verify pgAdmin Connection Details

Go to pgAdmin → Properties to find:
- **Hostname/address**: Usually `localhost` or `127.0.0.1`
- **Port**: Usually `5432`
- **Username**: Check your PostgreSQL installation (often `postgres`)
- **Database**: Should be `sems` (or check what database name you're using)

### Step 3: Find Your PostgreSQL Password

When you installed PostgreSQL, you set a password. If you forgot it:

**Windows PostgreSQL:**
1. Open Services (services.msc)
2. Find "postgresql-x64-XX" 
3. Check if it's running

**Alternative - Reset Password:**
```bash
# Windows - From PostgreSQL bin directory
psql -U postgres

# Then in psql:
ALTER USER postgres WITH PASSWORD 'newpassword';
```

### Step 4: Test the Connection String

Before restarting the app, test your connection string:

```bash
# Test connection (replace with your values)
psql "postgresql://postgres:password@localhost:5432/sems"
```

If it connects, you'll see the `sems=#` prompt.

### Step 5: Restart the Dev Server

After setting `DATABASE_URL`:

```bash
# Kill the current server
npm run dev  # or restart in VS Code
```

### Step 6: Verify Health Check

1. Go to ⚙️ Settings
2. Scroll to "System Diagnostics"
3. Click Refresh
4. Should now show 🟢 HEALTHY

## Database Connection String Format

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

### Examples:

**Local PostgreSQL with password:**
```
postgresql://postgres:mypassword@localhost:5432/sems
```

**Local PostgreSQL (no password):**
```
postgresql://postgres@localhost:5432/sems
```

**Remote PostgreSQL:**
```
postgresql://user:password@db.example.com:5432/sems
```

**With connection pool (recommended for production):**
```
postgresql://user:password@localhost:5432/sems?schema=public
```

## Finding PostgreSQL Credentials

### Windows
- Look in pgAdmin → Login/Group Roles
- Or check your installation notes
- Default user is usually `postgres`

### Check if PostgreSQL is Running

**Windows:**
```powershell
# Check if service is running
Get-Service postgresql*
```

**Check Port 5432:**
```powershell
netstat -ano | findstr :5432
```

## Still Having Issues?

If you've set `DATABASE_URL` and Prisma still can't connect:

1. **Verify the credentials work in pgAdmin**
   - Try logging in with the same username/password
   - If it works in pgAdmin, the credentials are correct

2. **Check if PostgreSQL is accessible**
   - Make sure firewall isn't blocking port 5432
   - If PostgreSQL is on another machine, use that IP

3. **Verify the database exists**
   - In pgAdmin → Databases
   - Should see `sems` database
   - If missing, create it: `CREATE DATABASE sems;`

4. **Check the schema is initialized**
   - Run: `npx prisma migrate deploy`
   - Or: `npx prisma db push`

## .env File Example

```
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/sems"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
LOG_LEVEL="info"
```

## Security Note

⚠️ **Never commit `.env` to version control!**

Make sure `.env` is in `.gitignore`:
```
.env
.env.local
.env.*.local
```

This file contains sensitive database credentials.
