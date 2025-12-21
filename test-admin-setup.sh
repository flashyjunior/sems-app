#!/bin/bash
# Test script to validate the architecture fix
# Run with: bash test-admin-setup.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "SEMS Admin User Management - Setup Validation"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "  Node.js version: $NODE_VERSION"
echo ""

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found. Please install npm"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "  npm version: $NPM_VERSION"
echo ""

# Check if package.json exists
echo "✓ Checking project structure..."
if [ ! -f "package.json" ]; then
    echo "✗ package.json not found. Run from project root"
    exit 1
fi

# Check if init-db script exists
if [ ! -f "scripts/init-db.js" ]; then
    echo "✗ scripts/init-db.js not found"
    exit 1
fi

# Check if AdminUsersManager exists
if [ ! -f "src/components/AdminUsersManager.tsx" ]; then
    echo "✗ src/components/AdminUsersManager.tsx not found"
    exit 1
fi

# Check if sync endpoints exist
if [ ! -f "src/app/api/sync/pull-users/route.ts" ]; then
    echo "✗ src/app/api/sync/pull-users/route.ts not found"
    exit 1
fi

if [ ! -f "src/app/api/sync/pull-roles/route.ts" ]; then
    echo "✗ src/app/api/sync/pull-roles/route.ts not found"
    exit 1
fi

echo "  ✓ All required files exist"
echo ""

# Check if init:db script is in package.json
echo "✓ Checking package.json scripts..."
if grep -q '"init:db"' package.json; then
    echo "  ✓ init:db script found in package.json"
else
    echo "✗ init:db script not found in package.json"
    exit 1
fi
echo ""

# Check dependencies
echo "✓ Checking required dependencies..."
REQUIRED_DEPS=("bcryptjs" "prisma" "@prisma/client")
for dep in "${REQUIRED_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "  ✓ $dep found"
    else
        echo "  ✗ $dep not found in package.json"
        exit 1
    fi
done
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✓ All validation checks passed!"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Next steps:"
echo "1. Create .env file with DATABASE_URL (if not exists)"
echo "2. Run: npm install"
echo "3. Run: npm run init:db"
echo "4. Run: npm run dev"
echo "5. Login with admin@sems.local / Admin@123"
echo ""
