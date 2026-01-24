# Ticketing System Implementation Summary

## Overview
A complete ticketing system has been implemented for SEMS to allow users to:
- **Create support tickets** - Users can raise new tickets with category, priority, and attachments
- **View their tickets** - Track ticket status, priority, and updates
- **Add comments** - Users can comment on tickets and admins can add notes
- **Receive notifications** - Email and in-app notifications when tickets are created, updated, or resolved
- **SMTP configuration** - Admins can configure email settings for sending notifications

## Components Implemented

### 1. **Database Models** (Prisma Schema)
- `Ticket` - Main ticket model with status, priority, category
- `TicketNote` - Comments/notes on tickets (admin or user)
- `TicketNotification` - In-app notifications for ticket updates
- `SMTPSettings` - Email configuration settings

### 2. **Frontend Components**

#### TicketManagement.tsx
- **My Tickets Tab** - Lists user's tickets with search and filtering
- **New Ticket Tab** - Form to create new support tickets
- **Ticket Details View** - Full ticket view with comments section
- Features:
  - Search by ticket number or title
  - Filter by status (Open, In Progress, Resolved, Closed, On Hold)
  - Filter by priority (Low, Medium, High, Critical)
  - Add comments to tickets
  - View admin responses highlighted in red

#### SMTPSettings.tsx
- Email configuration form (admin only)
- Fields:
  - SMTP Host and Port
  - TLS/SSL toggle
  - Username and Password
  - From Email and From Name
  - Admin Email (where notifications are sent)
  - Reply-To Email
  - Test Connection button
- Includes Gmail setup guide

### 3. **API Endpoints**

#### Tickets Endpoints
- `POST /api/tickets` - Create new ticket (sends email to admin)
- `GET /api/tickets?status=X&priority=Y&search=Z` - Get user's tickets with filters
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket status/priority (admin only)
- `DELETE /api/tickets/[id]` - Delete ticket (admin only)
- `POST /api/tickets/[id]/notes` - Add comment to ticket

#### SMTP Settings Endpoints
- `GET /api/settings/smtp` - Get SMTP settings (admin only)
- `PUT /api/settings/smtp` - Save SMTP settings (admin only)
- `POST /api/settings/smtp/test` - Test SMTP connection (admin only)

### 4. **Email Service** (services/email.service.ts)
Functions for sending emails:
- `sendTicketNotificationEmail()` - When ticket is created
- `sendTicketNoteEmail()` - When comment is added to ticket
- `sendTicketResolutionEmail()` - When ticket is resolved/closed

## Navigation Integration

### Navbar Update
- Added "Support" menu item with ticket icon (🎫)
- Routes to Ticket Management component

### Settings Menu Update
- Added "Email Configuration" option (admin only)
- Routes to SMTP Settings component
- Positioned with green highlighting to stand out

## Database Relations

```
User
  ├── tickets (one-to-many)
  ├── ticketNotes (one-to-many)
  └── ticketNotifications (one-to-many)

Ticket
  ├── user (many-to-one)
  ├── notes (one-to-many)
  └── notifications (one-to-many)

TicketNote
  ├── ticket (many-to-one)
  └── user (many-to-one)

TicketNotification
  ├── ticket (many-to-one)
  └── user (many-to-one)

SMTPSettings
  └── singleton (only one record)
```

## Email Workflow

### When Ticket is Created:
1. User creates ticket via "New Ticket" form
2. System generates unique ticket number (TKT-{timestamp}-{random})
3. If SMTP is enabled:
   - Email sent to admin with ticket details
   - In-app notification created for all admin users
4. User sees success message with option to view their tickets

### When Comment is Added:
1. User or admin adds comment to ticket
2. If admin adds comment:
   - Email sent to ticket creator
   - In-app notification created for creator
3. Comment appears in ticket details with timestamp and author

### When Ticket Status Changes:
1. Admin updates ticket status
2. Ticket creator receives notification
3. If status changes to "resolved" or "closed":
   - Email sent to creator
   - In-app notification appears

## Testing Checklist

### Manual Testing Steps:

#### 1. SMTP Configuration (Admin)
- [ ] Go to Settings → Email Configuration
- [ ] Enter Gmail credentials (or other SMTP provider)
- [ ] Click "Test Connection"
- [ ] Verify test email arrives in inbox
- [ ] Save settings

#### 2. Create Ticket (User)
- [ ] Go to Support tab
- [ ] Click "Create New Ticket"
- [ ] Fill form:
  - Title: "Cannot dispense medication"
  - Category: "Technical Issue"
  - Priority: "High"
  - Description: "System not responding when trying to dispense"
  - Optional: Add screenshot
- [ ] Click "Create Ticket"
- [ ] Verify success message
- [ ] Check admin email inbox for notification

#### 3. View Tickets (User)
- [ ] Go to Support → "My Tickets"
- [ ] Verify newly created ticket appears in list
- [ ] Search for ticket by number or title
- [ ] Filter by status and priority
- [ ] Click "View Details"

#### 4. Add Comment (User)
- [ ] On ticket details page
- [ ] In "Notes & Comments" section, type comment
- [ ] Click "Post Comment"
- [ ] Verify comment appears with timestamp and username

#### 5. Update Ticket (Admin)
- [ ] In admin panel, locate user's ticket
- [ ] Update status to "In Progress"
- [ ] Verify user receives notification
- [ ] Add admin note to ticket
- [ ] Check user's email for notification

#### 6. Resolve Ticket (Admin)
- [ ] In ticket details, update status to "Resolved"
- [ ] Add closing comment
- [ ] Verify user receives email notification
- [ ] Check ticket appears in "Resolved" filter

### API Testing Commands:

#### Create Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -F "title=System not responding" \
  -F "description=Cannot dispense medication" \
  -F "category=technical" \
  -F "priority=high" \
  -H "Cookie: session-token=YOUR_TOKEN"
```

#### Get User Tickets
```bash
curl http://localhost:3000/api/tickets?status=open&priority=high \
  -H "Cookie: session-token=YOUR_TOKEN"
```

#### Test SMTP Connection
```bash
curl -X POST http://localhost:3000/api/settings/smtp/test \
  -H "Content-Type: application/json" \
  -H "Cookie: session-token=YOUR_TOKEN" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "fromEmail": "noreply@sems.local",
    "fromName": "SEMS Support"
  }'
```

## Email Template Examples

### Ticket Creation Email (to Admin)
- Subject: `[New Ticket] {title} ({ticketNumber})`
- Shows:
  - Ticket number and submitter
  - Category and priority (color-coded)
  - Full title and description
  - Link to view ticket in admin panel

### Ticket Update Email (to User)
- Subject: `[Update] {ticketNumber}: {title}`
- Shows:
  - Updated ticket details
  - Admin's response/comment
  - Type of update (Admin Response, Ticket Updated)
  - Link to view ticket

### Resolution Email (to User)
- Subject: `[RESOLVED/CLOSED] {ticketNumber}: {title}`
- Shows:
  - Ticket number and title
  - Resolution status
  - Option to reopen ticket

## Configuration Notes

### Gmail Setup (Recommended):
1. Enable 2-Factor Authentication on Gmail
2. Generate "App Password":
   - Go to google.com/account/security
   - Click "App passwords"
   - Select "Mail" and "Windows Computer"
   - Copy 16-character password
3. SMTP Settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: Enable TLS
   - Username: Your Gmail address
   - Password: 16-character app password

### Other SMTP Providers:
- **Outlook**: smtp-mail.outlook.com:587
- **SendGrid**: smtp.sendgrid.net:587
- **AWS SES**: email-smtp.[region].amazonaws.com:587

## Security Considerations

1. **Password Storage**: SMTP passwords stored in database (should be encrypted in production)
2. **Authorization**: 
   - Only admins can configure SMTP settings
   - Users can only view/update their own tickets (except admins)
   - Admin notes marked as such in UI
3. **Email Content**: No sensitive data exposed in email templates
4. **Rate Limiting**: Consider implementing rate limits on ticket creation

## Future Enhancements

1. **Ticket Attachments**: Implement file upload/storage (S3, etc.)
2. **Ticket Assignment**: Assign tickets to specific admins
3. **Ticket Categories**: Expand categories (Bug, Feature Request, etc.)
4. **SLA Management**: Track response times and set SLAs
5. **Ticket Templates**: Pre-filled templates for common issues
6. **Bulk Operations**: Bulk status updates for admins
7. **Analytics**: Dashboard showing ticket metrics
8. **Webhook Integration**: Send tickets to external systems
9. **Mobile Notifications**: Push notifications for ticket updates
10. **Knowledge Base**: Link related issues and solutions

## Files Modified/Created

### Created:
- `src/app/api/tickets/route.ts` - Ticket CRUD
- `src/app/api/tickets/[id]/route.ts` - Individual ticket management
- `src/app/api/tickets/[id]/notes/route.ts` - Ticket notes/comments
- `src/app/api/settings/smtp/route.ts` - SMTP configuration
- `src/app/api/settings/smtp/test/route.ts` - SMTP connection test
- `src/services/email.service.ts` - Email sending functions
- `src/components/TicketManagement.tsx` - Ticket UI component
- `src/components/SMTPSettings.tsx` - SMTP configuration UI

### Modified:
- `prisma/schema.prisma` - Added ticket-related models
- `src/types/index.ts` - Added ticket-related types
- `src/components/Navbar.tsx` - Added Support menu item
- `src/components/SettingsMenu.tsx` - Added Email Configuration option
- `src/app/page.tsx` - Added tickets view routing

## Status: ✅ COMPLETE

All components, API endpoints, and UI integration have been implemented.
The system is ready for:
1. Configuration of SMTP settings
2. Creating and managing support tickets
3. Email notifications to admins and users
4. In-app notification system for ticket updates
