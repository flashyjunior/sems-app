#!/bin/bash

# SEMS Encryption Key Setup Script
# Generates and configures ENCRYPTION_KEY for development

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "         SEMS Encryption Key Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Generate key
KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

echo "Generated encryption key:"
echo ""
echo "    $KEY"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    # Check if ENCRYPTION_KEY already exists
    if grep -q "^ENCRYPTION_KEY=" .env.local; then
        echo "⚠️  ENCRYPTION_KEY already exists in .env.local"
        echo "To update it, edit .env.local and replace the existing key"
    else
        # Append to .env.local
        echo "" >> .env.local
        echo "# Encryption key for SMTP passwords" >> .env.local
        echo "ENCRYPTION_KEY=$KEY" >> .env.local
        echo "✅ Added ENCRYPTION_KEY to .env.local"
    fi
else
    # Create .env.local with the key
    echo "# Encryption key for SMTP passwords" > .env.local
    echo "ENCRYPTION_KEY=$KEY" >> .env.local
    echo "✅ Created .env.local with ENCRYPTION_KEY"
fi

echo ""
echo "Next steps:"
echo "  1. Restart your development server"
echo "  2. Go to Settings → Email Configuration"
echo "  3. Save your SMTP settings"
echo "  4. ✅ Password will be encrypted!"
echo ""
echo "⚠️  For production, store the key in a secrets manager (AWS, Vault, etc)"
echo ""
