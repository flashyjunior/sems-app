# SEMS API Documentation

## Base URL
```
http://localhost:3000/api
http://localhost:3001/api (in production)
```

## Authentication

All endpoints (except login) require a Bearer token:

```
Authorization: Bearer <token>
```

### Login

**POST** `/auth/login`

Request:
```json
{
  "username": "pharmacist",
  "pin": "1234"
}
```

Response (200):
```json
{
  "token": "token_1234567890_abcdef",
  "user": {
    "id": "pharmacist-001",
    "username": "pharmacist",
    "role": "pharmacist"
  },
  "expiresIn": 86400
}
```

---

## Templates API

### Get All Templates

**GET** `/templates`

Query Parameters:
- `since` (optional): Unix timestamp - only return templates modified after this time

Response (200):
```json
[
  {
    "id": "template-1",
    "name": "Standard Label",
    "description": "Default pharmacy label",
    "htmlTemplate": "...",
    "escposTemplate": "...",
    "isDefault": true,
    "createdAt": 1703023200000,
    "updatedAt": 1703023200000
  }
]
```

### Create/Update Template

**POST** `/templates`

Request:
```json
{
  "id": "template-1",
  "name": "Custom Label",
  "description": "Hospital label format",
  "htmlTemplate": "<html>...</html>",
  "escposTemplate": "...",
  "isDefault": false,
  "createdAt": 1703023200000,
  "updatedAt": 1703023200000
}
```

Response (200):
```json
{
  "message": "Template saved successfully",
  "template": { ... }
}
```

### Delete Template

**DELETE** `/templates?id=template-id`

Response (200):
```json
{
  "message": "Template deleted successfully"
}
```

---

## Dispenses API

### Get All Dispense Records

**GET** `/dispenses`

Query Parameters:
- `since` (optional): Unix timestamp - only return records after this time
- `pharmacistId` (optional): Filter by pharmacist

Response (200):
```json
[
  {
    "id": "dispense-123456",
    "timestamp": 1703023200000,
    "pharmacistId": "pharmacist-001",
    "patientName": "John Doe",
    "patientAge": 35,
    "patientWeight": 70,
    "drugId": "drug-001",
    "drugName": "Amoxicillin",
    "dose": { ... },
    "safetyAcknowledgements": [],
    "synced": true,
    "syncedAt": 1703023210000,
    "deviceId": "device-abc123",
    "auditLog": [ ... ]
  }
]
```

### Create Dispense Record

**POST** `/dispenses`

Request:
```json
{
  "id": "dispense-123456",
  "timestamp": 1703023200000,
  "pharmacistId": "pharmacist-001",
  "patientName": "John Doe",
  "patientAge": 35,
  "patientWeight": 70,
  "drugId": "drug-001",
  "drugName": "Amoxicillin",
  "dose": { ... },
  "safetyAcknowledgements": [],
  "synced": false,
  "deviceId": "device-abc123",
  "auditLog": [ ... ]
}
```

Response (201):
```json
{
  "message": "Dispense record saved successfully",
  "record": { ... }
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Missing required fields: ..."
}
```

### 401 - Unauthorized
```json
{
  "error": "Missing or invalid authorization"
}
```

### 409 - Conflict (Template)
```json
{
  "message": "Server has newer version of this template",
  "template": { ... }
}
```

### 500 - Server Error
```json
{
  "error": "Failed to..."
}
```

---

## Sync Strategy

### Client-Side Workflow

1. **Login**: POST `/auth/login` → Get token
2. **Go Online**: Network event fires
3. **Push**: POST `/dispenses` (all pending records)
4. **Push**: POST `/templates` (modified templates)
5. **Pull**: GET `/templates?since=lastSyncTime`
6. **Merge**: Compare timestamps, keep newer version

### Conflict Resolution

- **Templates**: Server timestamp wins (newer version kept locally)
- **Dispenses**: Idempotent via record ID (no duplicates)
- **Retries**: Client retries up to 3 times on failure

---

## Rate Limiting

None implemented (add in production)

## CORS

Configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://172.25.32.1:3000` (mobile testing)

---

## Testing

### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pharmacist","pin":"1234"}'

# Get templates
curl http://localhost:3000/api/templates \
  -H "Authorization: Bearer token_xxx"

# Create template
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_xxx" \
  -d '{"id":"t1","name":"Label","htmlTemplate":"<html>...</html>","createdAt":0,"updatedAt":0,"isDefault":false}'
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

In production, set to your actual backend URL.
