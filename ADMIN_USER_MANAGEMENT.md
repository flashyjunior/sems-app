# Admin User Management Guide

## Overview

The SEMS application now implements a proper architecture where **PostgreSQL is the source of truth** for user and role management. Users and roles are created/managed in PostgreSQL via the admin interface, then synced down to local databases (IndexDB and SQLite).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL (Cloud)                      │
│              Source of Truth - Users & Roles                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Sync DOWN (Pull Users/Roles)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│     IndexDB (Browser) + SQLite (Desktop via Tauri)          │
│          Local Cache - Synced Configuration                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Sync UP (Create Dispense Records)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Cloud)                              │
│         Persisted Dispense Records                          │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Initialize the Database

Before first run, initialize the database with default roles and users:

```bash
npm run init:db
```

This creates:
- **Roles**: admin, pharmacist, viewer
- **Default Admin User**:
  - Email: `admin@sems.local`
  - Password: `Admin@123`
- **Sample Pharmacist User**:
  - Email: `pharmacist@sems.local`
  - Password: `Pharmacist@123`

⚠️ **IMPORTANT**: Change these passwords in production!

### 2. Login as Admin

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Login with admin credentials:
   - Email: `admin@sems.local`
   - Password: `Admin@123`

### 3. Access Admin Panel

Once logged in as admin, you'll see a **"👥 Admin Users"** button in the navbar. Click it to open the admin panel.

## Admin Panel Features

### Create New User

1. Click **"👥 Admin Users"** button
2. Fill in the form:
   - **Email**: User's email address
   - **Full Name**: User's full name
   - **License Number**: Professional license (e.g., PHARM-123)
   - **Specialization**: Area of expertise (optional)
   - **Password**: Initial password for the user
   - **Role**: Select from admin, pharmacist, viewer (default: pharmacist)

3. Click **"Create User"**
4. User is created in PostgreSQL

### Sync Users to Local Databases

After creating/modifying users in PostgreSQL, sync them to local databases:

1. In the Admin panel, click **"🔄 Sync Users to Local"** button
2. The system will:
   - Fetch all users from PostgreSQL
   - Save them to IndexDB (browser)
   - Save them to SQLite (if using Tauri desktop app)
   - Display success message with count

### View Synced Users

The user list in the admin panel shows all users from PostgreSQL. Once synced, they're available locally.

## Workflow for Pharmacists

### Setup (Admin does this once):

1. Create pharmacist user in PostgreSQL via Admin panel
2. Sync users to local databases
3. Pharmacist can now login with their credentials

### Daily Operations (Pharmacist):

1. Login with credentials
2. Create dispense records (stored in IndexDB/SQLite)
3. App automatically syncs records to PostgreSQL
4. Records persist in cloud database

## API Endpoints

### User Management Endpoints

#### Create User (POST /api/users)
```javascript
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "pharmacist@hospital.com",
  "fullName": "John Pharmacist",
  "licenseNumber": "PHARM-456",
  "password": "SecurePassword123",
  "specialization": "Clinical Pharmacy",
  "roleId": 2
}

Response: 201 Created
{
  "id": 5,
  "email": "pharmacist@hospital.com",
  "fullName": "John Pharmacist",
  "licenseNumber": "PHARM-456",
  "role": "pharmacist"
}
```

#### Get All Users (GET /api/users)
```javascript
GET /api/users?limit=100
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "email": "admin@sems.local",
      "fullName": "SEMS Administrator",
      "licenseNumber": "ADMIN-001",
      "role": "admin"
    },
    ...
  ]
}
```

### Sync Endpoints

#### Pull Users (POST /api/sync/pull-users)
Fetch users from PostgreSQL and save to local databases.

```javascript
POST /api/sync/pull-users
Authorization: Bearer {token}
Content-Type: application/json

Response: 200 OK
{
  "success": true,
  "message": "Users synced successfully",
  "count": 3,
  "users": [...]
}
```

#### Pull Roles (POST /api/sync/pull-roles)
Fetch roles from PostgreSQL and save to local databases.

```javascript
POST /api/sync/pull-roles
Authorization: Bearer {token}
Content-Type: application/json

Response: 200 OK
{
  "success": true,
  "message": "Roles synced successfully",
  "count": 3,
  "roles": [...]
}
```

## Database Schema (Relevant Tables)

### User Table
```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullName VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  licenseNumber VARCHAR(50) UNIQUE,
  specialization VARCHAR(255),
  roleId INTEGER REFERENCES "Role"(id),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Role Table
```sql
CREATE TABLE "Role" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Users not appearing after sync
1. Check that sync completed successfully (look for success message)
2. Verify IndexDB has the users:
   - Open DevTools → Application → IndexedDB → SEMSDB → users
3. Check browser console for errors

### Can't create dispense records with synced users
1. Verify user was synced to local database
2. Check that user is marked as `isActive: true`
3. Check browser console for error details

### Forgot admin password
1. Use database direct access (PgAdmin) to reset:
   ```sql
   UPDATE "User" 
   SET password = '$2a$10$...' -- bcrypt hash of new password
   WHERE email = 'admin@sems.local';
   ```
2. Use a bcrypt generator to create the hash

### Roles/Users endpoint returns 401 Unauthorized
1. Verify you're logged in with admin account
2. Check that Authorization header includes valid JWT token
3. Token should be: `Authorization: Bearer {token}`

## Security Considerations

1. **Change default passwords immediately in production**
2. **Use strong passwords** for all user accounts
3. **Limit admin user creation** - only admins can create users
4. **Audit user creation** - all operations are logged
5. **Use HTTPS** in production (JWT tokens in headers)
6. **Sync only in secure networks** - passwords and tokens transmitted

## Advanced Configuration

### Adding New Roles

Edit `scripts/init-db.js` to add more roles:

```javascript
const customRole = await prisma.role.upsert({
  where: { name: 'custom-role' },
  update: {},
  create: {
    name: 'custom-role',
    description: 'Custom role description',
  },
});
```

Then run: `npm run init:db`

### Bulk User Import

To import multiple users programmatically:

```javascript
const users = [
  {
    email: 'user1@hospital.com',
    fullName: 'User One',
    licenseNumber: 'LIC-001',
    password: 'InitialPass123',
  },
  // ... more users
];

for (const userData of users) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      roleId: 2, // pharmacist
    },
  });
}
```

## Testing the Full Workflow

1. **Initialize DB**: `npm run init:db`
2. **Start app**: `npm run dev`
3. **Login as admin**: admin@sems.local / Admin@123
4. **Create pharmacist**: Use admin panel to create new user
5. **Sync users**: Click "Sync Users to Local"
6. **Logout and login as pharmacist**
7. **Create dispense record**: New record syncs to PostgreSQL
8. **Verify in PostgreSQL**: Check that record appears in database

## Support

For issues or questions:
1. Check browser console for error messages
2. Check server logs for backend errors
3. Verify database connectivity with `test-db-connection.mjs`
4. Review API responses in Network tab
