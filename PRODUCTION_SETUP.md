# SEMS - Secure Pharmacy Management System - Production Setup Guide

## Production Considerations Implemented

### 1. **Database (PostgreSQL)**
- **Status**: ✅ Configured with Prisma ORM
- **Features**:
  - Structured schema with proper indexing
  - Migrations support via Prisma
  - Connection pooling configured
  - Transaction support for data consistency

**Setup**:
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres pgadmin

# Or using local PostgreSQL installation
# Update .env DATABASE_URL to point to your local instance

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### 2. **JWT Authentication**
- **Status**: ✅ Implemented
- **Features**:
  - Token signing and verification
  - Configurable expiry (default: 24h)
  - Payload includes userId, email, and roleId
  - Rate-limited login endpoint

**Configuration** (.env):
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h
```

**Usage**:
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response includes JWT token for subsequent API calls
```

### 3. **Rate Limiting**
- **Status**: ✅ Implemented
- **Features**:
  - In-memory store (consider Redis for production)
  - Configurable window and request limits
  - HTTP status 429 for rate limit exceeded
  - Retry-After headers included

**Configuration** (.env):
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Requests per window
```

### 4. **CORS (Cross-Origin Resource Sharing)**
- **Status**: ✅ Implemented
- **Features**:
  - Whitelist allowed origins
  - Proper preflight request handling
  - Credentials support
  - All HTTP methods configured

**Configuration** (.env):
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### 5. **Logging & Audit Trail**
- **Status**: ✅ Implemented with Pino
- **Features**:
  - Structured logging with log levels
  - Activity logging for audit trail
  - User actions tracked with IP and user agent
  - Automatic data retention cleanup

**Log Levels** (.env):
```env
LOG_LEVEL=debug  # Options: debug, info, warn, error
```

**Activity Log Fields**:
- User ID and email
- Action (LOGIN, CREATE_USER, UPDATE_USER, etc.)
- Resource and Resource ID
- Changes (JSON diff)
- IP Address and User Agent
- Timestamp

### 6. **Input Validation**
- **Status**: ✅ Implemented with Zod
- **Features**:
  - Schema-based validation
  - Type-safe request data
  - Detailed error messages
  - Email and password validation

**Schemas Included**:
- `userCreateSchema` - New user creation
- `userUpdateSchema` - User profile updates
- `userLoginSchema` - Authentication
- `userPasswordChangeSchema` - Password changes
- `printerCreateSchema` - Printer setup
- `systemSettingsSchema` - System configuration
- `paginationSchema` - List endpoints

### 7. **Database Indexing**
- **Status**: ✅ Configured
- **Indexes**:
  - User email and license number (unique + indexed)
  - Role name (unique + indexed)
  - Permission name (unique + indexed)
  - Activity logs: userId, action, resource, createdAt
  - Printer: name, ipAddress, isDefault

**Benefits**:
- Faster user lookups
- Efficient filtering and sorting
- Better pagination performance

### 8. **Pagination**
- **Status**: ✅ Implemented
- **Features**:
  - Configurable page size (1-100, default 20)
  - Sort by field and direction
  - Total count included
  - Page metadata

**Usage**:
```bash
GET /api/users?page=1&limit=20
GET /api/audit-logs?page=2&limit=50&action=LOGIN
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "pages": 13
  }
}
```

### 9. **User Management**
- **Status**: ✅ Implemented
- **Features**:
  - Create, read, update, delete users
  - User profile management
  - Password hashing with bcrypt
  - User deactivation (soft delete)
  - Last login tracking

**Endpoints**:
```bash
POST   /api/auth/login                 # Authenticate user
GET    /api/users                      # List all users (paginated)
POST   /api/users                      # Create new user
GET    /api/users/[id]                # Get user details
PUT    /api/users/[id]                # Update user
DELETE /api/users/[id]                # Delete user
```

### 10. **Role-Based Access Control (RBAC)**
- **Status**: ✅ Implemented
- **Features**:
  - Role and permission models
  - Fine-grained permissions
  - Role assignment to users
  - Permission verification middleware

**Endpoints**:
```bash
GET    /api/roles                      # List all roles
POST   /api/roles                      # Create role
GET    /api/roles/[id]                # Get role details
PUT    /api/roles/[id]                # Update role
DELETE /api/roles/[id]                # Delete role
```

### 11. **Audit Logging**
- **Status**: ✅ Implemented
- **Tracked Events**:
  - LOGIN / LOGIN_FAILED
  - CREATE_USER / UPDATE_USER / DELETE_USER
  - CREATE_ROLE / UPDATE_ROLE / DELETE_ROLE
  - All changes with before/after values
  - IP address and user agent

**Endpoint**:
```bash
GET /api/audit-logs?page=1&limit=50&action=LOGIN&resource=auth
GET /api/audit-logs?userId=123&startDate=2024-01-01&endDate=2024-12-31
```

## Database Schema

### Tables
1. **User** - User accounts and profiles
2. **Role** - User roles for RBAC
3. **Permission** - Fine-grained permissions
4. **Printer** - Printer configurations
5. **PrinterSettings** - Printer-specific settings
6. **SystemSettings** - Global system configuration
7. **ActivityLog** - Audit trail
8. **ApiKey** - External API authentication

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` file
- Use strong secrets in production
- Rotate JWT_SECRET regularly

### 2. Database Security
- Use strong passwords for database user
- Enable SSL/TLS for database connections
- Regular backups configured
- Data retention policies enforced

### 3. API Security
- JWT validation on all protected routes
- Rate limiting to prevent brute force
- Input validation and sanitization
- CORS properly configured
- HTTPS in production

### 4. Password Security
- Bcrypt hashing with salt rounds: 10
- Minimum 8 characters required
- Enforce strong passwords
- Regular password change reminders

### 5. Audit & Compliance
- Complete audit trail
- Failed login attempts logged
- User activity tracking
- Data retention configurable
- GDPR-ready (ability to delete user data)

## Deployment Checklist

### Pre-Deployment
- [ ] Set strong JWT_SECRET in .env
- [ ] Update ALLOWED_ORIGINS for your domain
- [ ] Configure DATABASE_URL for production database
- [ ] Set NODE_ENV=production
- [ ] Increase LOG_LEVEL to info or warn
- [ ] Configure rate limiting based on expected traffic
- [ ] Set up database backups
- [ ] Enable HTTPS/SSL certificates
- [ ] Run database migrations: `npx prisma migrate deploy`

### Docker Deployment
```bash
# Build and start with Docker Compose
docker-compose -f docker-compose.yml up -d

# Access pgAdmin at http://localhost:5050
# Login: admin@sems.local / admin
```

### Manual Deployment
```bash
# Install dependencies
npm install --production

# Build Next.js
npm run build

# Run migrations
npx prisma migrate deploy

# Start server
npm run start
```

## Monitoring & Maintenance

### Health Checks
```bash
GET /api/health  # Application health
GET /api/db-check # Database connection status
```

### Logs
- Application logs: stdout (capture with Docker logs)
- Activity logs: Database table `ActivityLog`
- Query logs: Prisma debug logs (development only)

### Performance
- Monitor slow queries in ActivityLog
- Check database connection pool utilization
- Monitor JWT token generation/verification time
- Track rate limit hits per IP

## Future Enhancements

1. **Redis Integration**
   - Replace in-memory rate limiting with Redis
   - Session caching
   - API response caching

2. **Two-Factor Authentication (2FA)**
   - TOTP/SMS 2FA support
   - Recovery codes

3. **API Keys**
   - Service-to-service authentication
   - API key management endpoint
   - Per-key rate limiting

4. **OAuth2/OIDC**
   - Third-party authentication
   - Single Sign-On (SSO)

5. **Data Export**
   - GDPR data export
   - CSV/JSON export of audit logs
   - User data portability

6. **Advanced Filtering**
   - Full-text search
   - Complex query filters
   - Report generation

## Support & Documentation

- **API Documentation**: See API endpoints section
- **Database Schema**: View Prisma schema in `prisma/schema.prisma`
- **Environment Variables**: See `.env` file template
- **Utilities**: Check `src/lib/` for auth, validation, logging utilities

## License

Proprietary - SEMS System
