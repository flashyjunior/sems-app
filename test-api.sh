#!/bin/bash
# API Testing Script for SEMS
# Run this to test all API endpoints

API_URL="http://localhost:3000/api"
TOKEN=""

echo "================================"
echo "SEMS API Testing Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# 1. Test Login
echo "1. Testing Authentication..."
print_info "POST /auth/login"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"pharmacist","pin":"1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  print_error "Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
else
  print_success "Login successful - Token: ${TOKEN:0:20}..."
fi
echo ""

# 2. Test Get Templates (empty)
echo "2. Testing Templates API..."
print_info "GET /templates (initial - should be empty)"

TEMPLATES=$(curl -s -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN")

print_success "Got templates: $TEMPLATES"
echo ""

# 3. Test Create Template
echo "3. Creating Template..."
print_info "POST /templates"

CREATE_TEMPLATE=$(curl -s -X POST "$API_URL/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id": "template-test-1",
    "name": "Test Template",
    "description": "Template for testing",
    "htmlTemplate": "<html><body>{{drugName}} - {{dose}} mg</body></html>",
    "escposTemplate": "{{drugName}}\nDose: {{dose}} mg",
    "isDefault": false,
    "createdAt": '$(date +%s)'000,
    "updatedAt": '$(date +%s)'000
  }')

print_success "Template created: $CREATE_TEMPLATE"
echo ""

# 4. Test Get Templates (with data)
echo "4. Fetching Templates..."
print_info "GET /templates (should have 1 template)"

GET_TEMPLATES=$(curl -s -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN")

print_success "Templates: $GET_TEMPLATES"
echo ""

# 5. Test Create Dispense Record
echo "5. Testing Dispenses API..."
print_info "POST /dispenses"

CREATE_DISPENSE=$(curl -s -X POST "$API_URL/dispenses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id": "dispense-test-1",
    "timestamp": '$(date +%s)'000,
    "pharmacistId": "pharmacist-001",
    "patientName": "Test Patient",
    "patientAge": 35,
    "patientWeight": 70,
    "drugId": "drug-001",
    "drugName": "Amoxicillin",
    "dose": {
      "drugId": "drug-001",
      "drugName": "Amoxicillin",
      "strength": "500 mg",
      "doseMg": 500,
      "frequency": "Every 8 hours",
      "duration": "7 days",
      "route": "oral",
      "instructions": "Take with food",
      "warnings": [],
      "stgCitation": "STG 2017 - Ch.7"
    },
    "safetyAcknowledgements": [],
    "synced": false,
    "deviceId": "device-test-001",
    "auditLog": []
  }')

print_success "Dispense created: $CREATE_DISPENSE"
echo ""

# 6. Test Get Dispenses
echo "6. Fetching Dispense Records..."
print_info "GET /dispenses"

GET_DISPENSES=$(curl -s -X GET "$API_URL/dispenses" \
  -H "Authorization: Bearer $TOKEN")

print_success "Dispenses: $GET_DISPENSES"
echo ""

# 7. Test Unauthorized Access
echo "7. Testing Authorization..."
print_info "GET /templates (without token)"

UNAUTHORIZED=$(curl -s -X GET "$API_URL/templates")

if echo "$UNAUTHORIZED" | grep -q "Unauthorized"; then
  print_success "Authorization working - rejected unauthorized request"
else
  print_error "Authorization not working properly"
fi
echo ""

echo "================================"
print_success "All tests completed!"
echo "================================"
