# Authorization Codes Feature

## Overview

The Authorization Codes feature allows administrators to generate 8-digit numeric codes for secure document verification and access control. These codes are strictly single-use and provide a robust audit trail for compliance and security purposes.

## Key Features

### For Administrators

1. **Code Generation**
   - Generate random 8-digit numeric codes
   - Add descriptive text explaining the code's purpose
   - Codes are automatically unique across the system

2. **Code Management**
   - View all codes (used, unused, and expired)
   - Filter codes by status
   - Manually expire codes when needed
   - Full audit trail of all code operations

3. **Code Lookup**
   - Look up code details including:
     - Who created the code
     - Description/purpose
     - Date created
     - Usage status
     - User who used the code (if applicable)

### Security Measures

#### Non-Admin Access Prevention

If a **non-admin user** attempts to lookup an authorization code:

1. **Immediate Actions:**
   - User account is permanently disabled
   - All their active authorization codes are automatically expired
   - Security alert is logged with full details

2. **Notification:**
   - Master admin is notified via email (if configured)
   - Security violation is logged in audit trail with "critical" severity

3. **Admin Warning:**
   - Admins viewing codes created by flagged users see a warning:
   - "This code is valid and unused, but other documents by this admin have been accessed without authorization."

## Usage Guide

### Admin Panel

1. **Accessing Authorization Codes**
   - Login as an admin
   - Navigate to Admin Panel
   - Click "🔐 Authorization Codes" in the sidebar

2. **Generating a New Code**
   - Click "➕ Generate New Code" button
   - Enter a description (e.g., "Internal document signature verification")
   - Click "Generate Code"
   - **Important:** Record the generated code securely - it will only be shown once

3. **Managing Codes**
   - Filter by status: All, Unused, Used, Expired
   - View code details including creator and usage history
   - Manually expire codes using the "Expire" button

### Friend Dialog Integration

Admins can also lookup authorization codes from the "Add Friend" dialog:

1. Open the Friends modal (👥 button in user area)
2. Click the "Add Friend" tab
3. Scroll to "Lookup Authorization Code" section
4. Enter the 8-digit code
5. Click "Lookup Code"
6. View code information and mark as used if needed

**Warning:** Non-admins should NOT attempt to use this feature.

## API Reference

### Generate Code (Admin Only)

```http
POST /api/authorization-codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Purpose of this code"
}
```

**Response:**
```json
{
  "message": "Authorization code created successfully",
  "code": {
    "code": "12345678",
    "description": "Purpose of this code",
    "createdBy": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isUsed": false,
    "isExpired": false
  }
}
```

### Get All Codes (Admin Only)

```http
GET /api/authorization-codes?status=unused
Authorization: Bearer <token>
```

Query parameters:
- `status` (optional): Filter by status (`used`, `unused`, `expired`, or omit for all)

### Lookup Code

```http
GET /api/authorization-codes/:code
Authorization: Bearer <token>
```

**Admin Response:**
```json
{
  "code": "12345678",
  "description": "Purpose of this code",
  "createdBy": {
    "username": "admin1",
    "name": "John Doe",
    "role": "admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isUsed": false,
  "isExpired": false,
  "securityWarning": "Optional warning if creator has violations"
}
```

**Non-Admin Response (403):**
```json
{
  "error": "Unauthorized access detected. Your account has been disabled pending review by a master admin.",
  "contactAdmin": true
}
```

### Mark Code as Used (Admin Only)

```http
POST /api/authorization-codes/:code/use
Authorization: Bearer <token>
```

### Expire Code (Admin Only)

```http
POST /api/authorization-codes/:code/expire
Authorization: Bearer <token>
```

## Database Schema

### AuthorizationCode Model

```javascript
{
  code: String,              // 8-digit numeric code
  description: String,       // Purpose/description
  createdBy: ObjectId,       // Reference to User
  createdAt: Date,           // Creation timestamp
  isUsed: Boolean,           // Usage status
  usedBy: ObjectId,          // Reference to User (if used)
  usedAt: Date,              // Usage timestamp
  isExpired: Boolean,        // Expiration status
  expiredBy: ObjectId,       // Reference to User (who expired it)
  expiredAt: Date            // Expiration timestamp
}
```

### Audit Log Entries

Authorization code operations are logged in the AuditLog collection:

- `authorization_code_created` - Code generation
- `authorization_code_used` - Code marked as used
- `authorization_code_expired` - Code manually expired
- `security_violation_code_access` - Non-admin access attempt (severity: critical)

## Security Considerations

### Code Generation

- Codes are randomly generated 8-digit numbers (10,000,000 to 99,999,999)
- Uniqueness is verified before creation
- Maximum 10 generation attempts to ensure uniqueness

### Access Control

- Only admins can generate, view, and manage codes
- Non-admin access to lookup endpoint triggers security lockdown
- All operations are logged with full audit trail

### Data Protection

- Codes themselves are stored in plain text (they are not sensitive data)
- Associated descriptions and user information follow existing security measures
- Audit logs include IP addresses and full request context

## Best Practices

1. **Code Descriptions**
   - Be specific about the code's purpose
   - Include reference numbers or document IDs
   - Examples:
     - "Document #12345 signature verification"
     - "Internal memo authorization for Q4 2024"

2. **Code Management**
   - Regularly review unused codes
   - Expire codes that are no longer needed
   - Monitor security violations closely

3. **Training**
   - Educate all admins about proper code usage
   - Emphasize that codes should NEVER be shared with non-admins
   - Review the security lockdown mechanism with all staff

## Troubleshooting

### Account Disabled After Code Lookup

If a non-admin user's account is disabled:
1. This is intentional - they attempted unauthorized access
2. Contact a master administrator for review
3. Master admin can investigate the incident through audit logs
4. Account may be reinstated after investigation (requires master admin action)

### Code Not Generating

If code generation fails:
1. Check that you're logged in as an admin
2. Verify network connectivity
3. Ensure description is provided
4. Contact system administrator if issue persists

### Code Already Used

Codes are single-use only:
1. Check if the code has already been marked as used
2. Generate a new code for new documents/purposes
3. Review audit logs to see who used the code and when

## Migration and Setup

No special migration is required. The AuthorizationCode collection will be created automatically on first use. Ensure:

1. MongoDB is running and accessible
2. User has admin role (`admin` or `master_admin`)
3. AuditLog model is updated to support system-wide logs

## Future Enhancements

Potential improvements for future versions:

- Expiration dates for codes (auto-expire after X days)
- QR code generation for easier code sharing
- Email notifications when codes are used
- Bulk code generation
- Code templates for common use cases
- Export code history to CSV/PDF

---

**© 2025 SuperCode Studios - FriendsChat**
