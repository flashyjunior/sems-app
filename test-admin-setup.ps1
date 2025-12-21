# Test script to validate the architecture fix
# Run with: .\test-admin-setup.ps1

Write-Host "═══════════════════════════════════════════════════════"
Write-Host "SEMS Admin User Management - Setup Validation"
Write-Host "═══════════════════════════════════════════════════════"
Write-Host ""

# Check Node.js
Write-Host "✓ Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Host "  Node.js version: $nodeVersion"
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js"
    exit 1
}
Write-Host ""

# Check npm
Write-Host "✓ Checking npm..."
try {
    $npmVersion = npm --version
    Write-Host "  npm version: $npmVersion"
} catch {
    Write-Host "✗ npm not found. Please install npm"
    exit 1
}
Write-Host ""

# Check if package.json exists
Write-Host "✓ Checking project structure..."
$requiredFiles = @(
    "package.json",
    "scripts/init-db.js",
    "src/components/AdminUsersManager.tsx",
    "src/app/api/sync/pull-users/route.ts",
    "src/app/api/sync/pull-roles/route.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists"
    } else {
        Write-Host "  ✗ $file not found"
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    exit 1
}
Write-Host ""

# Check if init:db script is in package.json
Write-Host "✓ Checking package.json scripts..."
$packageJsonContent = Get-Content package.json
if ($packageJsonContent | Select-String -Pattern '"init:db"' -Quiet) {
    Write-Host "  ✓ init:db script found in package.json"
} else {
    Write-Host "  ✗ init:db script not found in package.json"
    exit 1
}
Write-Host ""

# Check dependencies
Write-Host "✓ Checking required dependencies..."
$requiredDeps = @("bcryptjs", "prisma", "@prisma/client")
foreach ($dep in $requiredDeps) {
    if ($packageJsonContent | Select-String -Pattern "\"$dep\"" -Quiet) {
        Write-Host "  ✓ $dep found"
    } else {
        Write-Host "  ✗ $dep not found in package.json"
        exit 1
    }
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════"
Write-Host "✓ All validation checks passed!"
Write-Host "═══════════════════════════════════════════════════════"
Write-Host ""

Write-Host "Next steps:"
Write-Host "1. Create .env file with DATABASE_URL (if not exists)"
Write-Host "2. Run: npm install"
Write-Host "3. Run: npm run init:db"
Write-Host "4. Run: npm run dev"
Write-Host "5. Login with admin@sems.local / Admin@123"
Write-Host ""
