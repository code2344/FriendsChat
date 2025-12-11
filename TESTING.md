# FriendsChat Testing Guide

## Prerequisites for Testing

Before running the application, ensure you have:

1. **MongoDB Atlas Account**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Get your connection string
   - Replace the MONGODB_URI in .env with your connection string

2. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required values:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A random secure string (e.g., generate with `openssl rand -base64 32`)
     - `ENCRYPTION_KEY`: A 32-character string for AES encryption
     - `PORT`: Server port (default: 3000)
     - `NODE_ENV`: Set to 'development' for testing

## Starting the Application

```bash
npm start
```

The server will start on http://localhost:3000

## Testing Checklist

### Phase 1: Initial Setup ✅
- [x] Application starts without errors
- [x] Master admin account is automatically created
- [x] Database connection is established

### Phase 2: User Registration & Authentication
- [ ] Navigate to http://localhost:3000/register
- [ ] Register a new user with:
  - First Name: Test
  - Last Name: User
  - Student ID: 12345 (exactly 5 digits)
  - Email: test@example.com
  - Username: testuser
  - Password: password123
- [ ] Verify registration shows "pending approval" message
- [ ] Login as master admin (username: SuperCode111, password: NewTown2011)
- [ ] Navigate to admin panel
- [ ] Approve the pending user
- [ ] Logout and login as the newly approved user

### Phase 3: Server & Channel Creation
- [ ] Login as approved user
- [ ] Create a new server
- [ ] Verify server appears in sidebar
- [ ] Create channels within the server
- [ ] Verify channels appear in channel list

### Phase 4: Messaging
- [ ] Select a channel
- [ ] Send messages
- [ ] Verify messages appear in real-time
- [ ] Test profanity filter (send a message with filtered words)
- [ ] Verify filtered messages show masked content

### Phase 5: Direct Messaging
- [ ] Register and approve a second user
- [ ] Login as first user
- [ ] Attempt to send direct messages (frontend may need additional work for DM UI)

### Phase 6: Admin Features
- [ ] Login as master admin
- [ ] Access admin panel
- [ ] View all messages (master admin only)
- [ ] View reports
- [ ] Test banning a user
- [ ] Promote a user to admin
- [ ] Test demoting an admin

### Phase 7: Teacher Access Requests
- [ ] Navigate to http://localhost:3000/teacher-access
- [ ] Submit a teacher access request
- [ ] Login as admin
- [ ] View pending teacher requests
- [ ] Test approval workflow (need 3 admins or 1 master admin)

### Phase 8: Security Features
- [ ] Verify passwords are hashed in database
- [ ] Verify messages are encrypted in database
- [ ] Test JWT token expiration
- [ ] Verify role-based access control

### Phase 9: Server-Specific Permissions
- [ ] Create a server
- [ ] Add co-owners and moderators
- [ ] Test banning users from specific servers
- [ ] Verify permission hierarchy

### Phase 10: Student Information System
- [ ] Verify student info is created on approval
- [ ] Check grade level tracking
- [ ] Test yearly grade increment (requires manual testing or date manipulation)

## API Testing with curl

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "studentId": "54321",
    "email": "john@example.com",
    "username": "johndoe",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "SuperCode111",
    "password": "NewTown2011"
  }'
```

### Get Pending Users (requires admin token)
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:3000/api/auth/pending-users \
  -H "Authorization: Bearer $TOKEN"
```

### Create Server (requires auth token)
```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:3000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "description": "A test server"
  }'
```

## Known Limitations

1. **Direct Message UI**: The frontend DM functionality may need additional work for user discovery
2. **Real-time Updates**: Some admin panel sections may require manual refresh
3. **Mobile Responsiveness**: UI is primarily designed for desktop
4. **Error Handling**: Some edge cases may need additional error handling

## Security Testing

### Test Encryption
1. Send a message
2. Check MongoDB database directly
3. Verify the `encryptedContent` field is encrypted
4. Verify master admin can decrypt messages

### Test Authentication
1. Try accessing protected routes without token
2. Try accessing admin routes with regular user token
3. Verify proper 401/403 responses

### Test Ban System
1. Ban a user with MAC address
2. Verify user cannot login
3. Check BannedUser collection in database

## Troubleshooting

### Server won't start
- Check MongoDB connection string
- Ensure all environment variables are set
- Check for port conflicts

### Authentication errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure cookies/localStorage is enabled

### Messages not appearing
- Check Socket.IO connection in browser console
- Verify server and client are on same domain
- Check for CORS issues

## Database Verification

Connect to MongoDB and verify:
1. Master admin exists in users collection
2. Messages are encrypted
3. Student info is created on approval
4. Bans are properly recorded

## Next Steps After Testing

1. Deploy to production environment
2. Set up proper MongoDB Atlas security
3. Configure SSL/TLS certificates
4. Set up backup systems
5. Monitor logs and performance
6. Add additional security measures
7. Implement rate limiting
8. Add email notifications for approvals

## Report Issues

Document any issues found during testing with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/environment details
