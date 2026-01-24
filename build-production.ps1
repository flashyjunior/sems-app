# SEMS Production Build Script (PowerShell)
# Builds the complete production application and generates MSI installer

param(
    [switch]$SkipClean = $false,
    [switch]$SkipDeps = $false
)

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Header "SEMS Production Build"

$steps = @(
    @{ Name = "Cleaning previous builds"; Action = { 
        if (-not $SkipClean) {
            Write-Host "[1/5] Removing old builds..." -ForegroundColor Yellow
            Remove-Item -Path ".\.next" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
            Remove-Item -Path ".\src-tauri\target\release\bundle" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
            Write-Host "✓ Cleaned" -ForegroundColor Green
        } else {
            Write-Host "[1/5] Skipped (use -SkipClean:$false to force clean)" -ForegroundColor Gray
        }
    }}
    @{ Name = "Installing dependencies"; Action = { 
        if (-not $SkipDeps) {
            Write-Host "[2/5] Running npm install..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
            Write-Host "✓ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "[2/5] Skipped (use -SkipDeps:$false to reinstall)" -ForegroundColor Gray
        }
    }}
    @{ Name = "Building Next.js frontend"; Action = { 
        Write-Host "[3/5] Building Next.js..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        Write-Host "✓ Next.js build complete" -ForegroundColor Green
    }}
    @{ Name = "Building Tauri desktop app"; Action = { 
        Write-Host "[4/5] Building Rust/Tauri..." -ForegroundColor Yellow
        Push-Location ".\src-tauri"
        cargo build --release
        if ($LASTEXITCODE -ne 0) { 
            Pop-Location
            throw "cargo build failed" 
        }
        Pop-Location
        Write-Host "✓ Tauri build complete" -ForegroundColor Green
    }}
    @{ Name = "Creating MSI installer"; Action = { 
        Write-Host "[5/5] Generating MSI installer..." -ForegroundColor Yellow
        npm run tauri build
        if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }
        Write-Host "✓ MSI created" -ForegroundColor Green
    }}
)

$stepCount = 0
try {
    foreach ($step in $steps) {
        $stepCount++
        & $step.Action
    }
    
    Write-Header "✅ Build Complete!"
    Write-Host "MSI Installer created at:" -ForegroundColor Green
    Write-Host "  .\src-tauri\target\release\bundle\msi\sems-tauri_0.1.0_x64_en-US.msi" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "  1. Test installer on a clean Windows machine"
    Write-Host "  2. Verify Node.js 18+ is installed before running SEMS"
    Write-Host "  3. Run 'Read-Host' to verify startup"
    Write-Host "  4. Distribute MSI to users"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Build failed at step $stepCount" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
