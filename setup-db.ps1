# PostgreSQL Setup Script for SEMS
# This script creates the sems user and sems_db database

# Get PostgreSQL bin directory - common installation paths
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin",
    "C:\Program Files (x86)\PostgreSQL\15\bin"
)

$pgBinPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $pgBinPath = $path
        Write-Host "✓ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $pgBinPath) {
    Write-Host "✗ PostgreSQL not found in common installation paths" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or update the script with your installation path"
    exit 1
}

$psqlExe = Join-Path $pgBinPath "psql.exe"

# Connect as postgres (default superuser) and create user and database
Write-Host "`n📦 Creating SEMS database and user..." -ForegroundColor Cyan

$sqlCommands = @"
-- Create role sems if it doesn't exist
DO
`$do`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'sems') THEN
      CREATE ROLE sems WITH LOGIN PASSWORD 'sems_secure_pwd';
   END IF;
END
`$do`$;

-- Alter role to create databases
ALTER ROLE sems WITH CREATEDB;

-- Create database if it doesn't exist
DO
`$do`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sems_db') THEN
      CREATE DATABASE sems_db OWNER sems;
   END IF;
END
`$do`$;

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE sems_db TO sems;

-- Show result
\connect sems_db
GRANT ALL PRIVILEGES ON SCHEMA public TO sems;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sems;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sems;

SELECT 'Database setup complete' as status;
"@

# Write SQL to temp file
$sqlFile = [System.IO.Path]::GetTempFileName()
$sqlCommands | Out-File -FilePath $sqlFile -Encoding UTF8

try {
    # Execute SQL commands
    & $psqlExe -U postgres -h localhost -p 5432 -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database setup successful!" -ForegroundColor Green
        Write-Host "`n📋 Connection details:" -ForegroundColor Green
        Write-Host "  Username: sems"
        Write-Host "  Password: sems_secure_pwd"
        Write-Host "  Database: sems_db"
        Write-Host "  Host: localhost"
        Write-Host "  Port: 5432"
        Write-Host "`n⚠️  Note: Connection port is 5432, but your .env uses 5433 (Docker port)"
        Write-Host "   If not using Docker, update .env to use port 5432"
    } else {
        Write-Host "✗ Database setup failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
} finally {
    Remove-Item -Path $sqlFile -Force -ErrorAction SilentlyContinue
}
