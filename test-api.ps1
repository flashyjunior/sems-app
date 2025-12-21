# API Testing Script for SEMS (PowerShell)
# Run this in PowerShell to test all API endpoints

$ApiUrl = "http://localhost:3000/api"
$Token = ""

Write-Host "================================"
Write-Host "SEMS API Testing Script" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""

# Function to print colored output
function Print-Success {
    param([string]$Message)
    Write-Host "[+] $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor Yellow
}

# 1. Test Login
Write-Host "1. Testing Authentication..."
Print-Info "POST /auth/login"

$LoginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body (@{
        username = "pharmacist"
        pin      = "1234"
    } | ConvertTo-Json)

$Token = $LoginResponse.token

if ([string]::IsNullOrEmpty($Token)) {
    Print-Error "Login failed"
    Write-Host $LoginResponse
    exit 1
}

Print-Success "Login successful - Token: $($Token.Substring(0,20))..."
Write-Host ""

# 2. Test Get Templates (empty)
Write-Host "2. Testing Templates API..."
Print-Info "GET /templates (initial - should be empty)"

$Headers = @{ "Authorization" = "Bearer $Token" }

$Templates = Invoke-RestMethod -Uri "$ApiUrl/templates" `
    -Method Get `
    -Headers $Headers

Print-Success "Got templates (count: $($Templates.Count))"
Write-Host $Templates | ConvertTo-Json
Write-Host ""

# 3. Test Create Template
Write-Host "3. Creating Template..."
Print-Info "POST /templates"

$TemplateBody = @{
    id              = "template-test-1"
    name            = "Test Template"
    description     = "Template for testing"
    htmlTemplate    = "<html><body>{{drugName}} - {{dose}} mg</body></html>"
    escposTemplate  = "{{drugName}}\nDose: {{dose}} mg"
    isDefault       = $false
    createdAt       = [int64](Get-Date -UFormat %s) * 1000
    updatedAt       = [int64](Get-Date -UFormat %s) * 1000
}

$CreateTemplate = Invoke-RestMethod -Uri "$ApiUrl/templates" `
    -Method Post `
    -Headers @{ 
        "Content-Type"  = "application/json"
        "Authorization" = "Bearer $Token"
    } `
    -Body ($TemplateBody | ConvertTo-Json)

Print-Success "Template created"
Write-Host $CreateTemplate | ConvertTo-Json
Write-Host ""

# 4. Test Get Templates (with data)
Write-Host "4. Fetching Templates..."
Print-Info "GET /templates (should have 1 template)"

$GetTemplates = Invoke-RestMethod -Uri "$ApiUrl/templates" `
    -Method Get `
    -Headers $Headers

Print-Success "Templates count: $($GetTemplates.Count)"
Write-Host ""

# 5. Test Create Dispense Record
Write-Host "5. Testing Dispenses API..."
Print-Info "POST /dispenses"

$DispenseBody = @{
    id              = "dispense-test-1"
    timestamp       = [int64](Get-Date -UFormat %s) * 1000
    pharmacistId    = "pharmacist-001"
    patientName     = "Test Patient"
    patientAge      = 35
    patientWeight   = 70
    drugId          = "drug-001"
    drugName        = "Amoxicillin"
    dose            = @{
        drugId       = "drug-001"
        drugName     = "Amoxicillin"
        strength     = "500 mg"
        doseMg       = 500
        frequency    = "Every 8 hours"
        duration     = "7 days"
        route        = "oral"
        instructions = "Take with food"
        warnings     = @()
        stgCitation  = "STG 2017 - Ch.7"
    }
    safetyAcknowledgements = @()
    synced          = $false
    deviceId        = "device-test-001"
    auditLog        = @()
}

$CreateDispense = Invoke-RestMethod -Uri "$ApiUrl/dispenses" `
    -Method Post `
    -Headers @{ 
        "Content-Type"  = "application/json"
        "Authorization" = "Bearer $Token"
    } `
    -Body ($DispenseBody | ConvertTo-Json)

Print-Success "Dispense created"
Write-Host $CreateDispense | ConvertTo-Json
Write-Host ""

# 6. Test Get Dispenses
Write-Host "6. Fetching Dispense Records..."
Print-Info "GET /dispenses"

$GetDispenses = Invoke-RestMethod -Uri "$ApiUrl/dispenses" `
    -Method Get `
    -Headers $Headers

Print-Success "Dispenses count: $($GetDispenses.Count)"
Write-Host ""

# 7. Test Unauthorized Access
Write-Host "7. Testing Authorization..."
Print-Info "GET /templates (without token)"

try {
    $Unauthorized = Invoke-RestMethod -Uri "$ApiUrl/templates" `
        -Method Get `
        -ErrorAction Stop
    Print-Error "Authorization not working - should have rejected"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Print-Success "Authorization working - rejected unauthorized request"
    }
    else {
        Print-Error "Unexpected error: $($_)"
    }
}

Write-Host ""
Write-Host "================================"
Print-Success "All tests completed!"
Write-Host "================================"
