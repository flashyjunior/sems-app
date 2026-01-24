# SEMS Encryption Key Setup Script (Windows)
# Generates and configures ENCRYPTION_KEY for development

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "         SEMS Encryption Key Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Generate key
$KEY = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

Write-Host "Generated encryption key:" -ForegroundColor Green
Write-Host ""
Write-Host "    $KEY" -ForegroundColor Yellow
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    # Check if ENCRYPTION_KEY already exists
    $content = Get-Content ".env.local" -Raw
    if ($content -match "^ENCRYPTION_KEY=") {
        Write-Host "⚠️  ENCRYPTION_KEY already exists in .env.local" -ForegroundColor Yellow
        Write-Host "To update it, edit .env.local and replace the existing key"
    }
    else {
        # Append to .env.local
        Add-Content ".env.local" ""
        Add-Content ".env.local" "# Encryption key for SMTP passwords"
        Add-Content ".env.local" "ENCRYPTION_KEY=$KEY"
        Write-Host "✅ Added ENCRYPTION_KEY to .env.local" -ForegroundColor Green
    }
}
else {
    # Create .env.local with the key
    Set-Content ".env.local" "# Encryption key for SMTP passwords"
    Add-Content ".env.local" "ENCRYPTION_KEY=$KEY"
    Write-Host "✅ Created .env.local with ENCRYPTION_KEY" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your development server"
Write-Host "  2. Go to Settings → Email Configuration"
Write-Host "  3. Save your SMTP settings"
Write-Host "  4. ✅ Password will be encrypted!"
Write-Host ""
Write-Host "⚠️  For production, store the key in a secrets manager (AWS, Vault, etc)" -ForegroundColor Yellow
Write-Host ""
