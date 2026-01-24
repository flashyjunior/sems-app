# Admin Account Setup Guide

## Overview
This guide explains how to create and manage admin accounts in SEMS.

## System Architecture
- Users have a `roleId` that references the `Role` table
- When a user logs in, their role is retrieved and sent in the response
- The frontend checks `user.role === 'admin'` to determine admin features
- Admin users can:
  - View ALL tickets (not just their own)
  - Respond to tickets with admin responses (marked as `isAdminNote: true`)
  - See all users in admin dashboard

## How the System Knows an Admin Logged In

When a user logs in:
1. **Login API** (`POST /api/auth/login`) verifies credentials
2. **User fetched from DB** with their associated role
3. **Response includes**: User object with `role` property
4. **Frontend stores** the user in app store via `useAppStore`
5. **Admin check**: `user?.role === 'admin'` shows admin features

## Setting Up an Admin Account

### Option 1: Promote Existing User to Admin (Recommended)

**Step 1: List all users**
```bash
node list-users.js
```

This shows all users in the system with their email and current role.

**Step 2: Promote a user to admin**
```bash
node promote-to-admin.js user@example.com
```

The script will:
- Create an 'admin' role if it doesn't exist
- Promote the specified user to admin
- Confirm the promotion

**Example:**
```bash
$ node promote-to-admin.js john@example.com
✅ Admin role created
✅ User "john@example.com" has been promoted to admin
   Role: admin
```

### Option 2: Create New Admin User (SQL)

If you need to create a completely new admin user:

```sql
-- 1. Create admin role (if not exists)
INSERT INTO "Role" (name, description, permissions, "createdAt", "updatedAt")
SELECT 'admin', 'Administrator with full system access', 
       '["manage_users","manage_roles","manage_drugs","manage_settings","view_reports","manage_tickets","respond_to_tickets"]',
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE name = 'admin');

-- 2. Create admin user (replace values as needed)
INSERT INTO "User" (email, "passwordHash", "fullName", phone, "licenseNumber", specialization, "isActive", "roleId", "createdAt", "updatedAt")
SELECT 
  'admin@sems.local',
  '$2b$10$YourHashedPasswordHere', -- Use bcrypt hash
  'System Administrator',
  '+1234567890',
  'ADMIN001',
  'Administration',
  true,
  r.id,
  NOW(),
  NOW()
FROM "Role" r
WHERE r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@sems.local');
```

## Verify Admin Setup

**1. List users to confirm admin role:**
```bash
node list-users.js
```

Expected output should show the user with `admin` role.

**2. Login with admin account:**
- Navigate to login page
- Enter admin email and password
- Verify that "All Tickets (Admin)" tab appears in ticket management
- Verify admin features are accessible

## Troubleshooting

### Admin Features Not Showing

1. **Check user role in database:**
   ```bash
   node list-users.js
   ```

2. **Verify login returns admin role:**
   - Check browser DevTools → Application → LocalStorage
   - Look for `sems_auth_session`
   - Verify `user.role === 'admin'`

3. **Clear cache and refresh:**
   - Clear browser cache
   - Log out and log back in
   - Refresh the page

### User Still Shows as Pharmacist After Promotion

1. **Clear browser cache** - Auth session may be cached
2. **Log out and log back in** - New session will have updated role
3. **Check database** - Verify the user was actually promoted:
   ```bash
   node list-users.js
   ```

## Admin Features Available

Once logged in as admin, you can:

### 1. View All Tickets
- Click "All Tickets (Admin)" tab
- See tickets from all users in the system
- Filter by status, priority, etc.

### 2. Respond to Tickets
- Open any ticket
- Add a response in the comment section
- Check "Mark as Admin Response" 
- Response appears with red styling (admin badge)

### 3. Manage System Settings
- Navigate to Settings menu
- Admin-only options visible
- Manage users, roles, and system configuration

## Database Role Reference

The system comes with default roles:

| Role | Permissions |
|------|-------------|
| **admin** | Full system access, manage all resources, respond to tickets |
| **pharmacist** | Dispense medications, create tickets, view own tickets |
| **manager** | View reports, manage staff (if configured) |

## Security Notes

1. **Always use strong passwords** for admin accounts
2. **Limit admin accounts** - Only create what's necessary
3. **Monitor admin activities** - Admin changes affect all users
4. **Rotate admin access** - Regularly review who has admin privileges
5. **Don't share admin credentials** - Each admin should have their own account

## Quick Reference

```bash
# List all users
node list-users.js

# Promote user to admin
node promote-to-admin.js email@example.com

# Check login status (in browser console)
localStorage.getItem('sems_auth_session')
```
