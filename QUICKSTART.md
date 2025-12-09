# Quick Start Guide - FriendsChat

Get FriendsChat up and running in 5 minutes!

## Step 1: Prerequisites

Make sure you have installed:
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- MongoDB Atlas account - [Sign up free](https://www.mongodb.com/cloud/atlas)

## Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/code2344/FriendsChat.git
cd FriendsChat

# Install dependencies
npm install
```

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
# For quick testing, you can use these values:
```

**Minimal .env for testing (replace with your MongoDB URI):**
```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/friendschat?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_key_here
ENCRYPTION_KEY=test_32_character_key_for_dev
PORT=3000
NODE_ENV=development
```

### Quick MongoDB Atlas Setup:

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Paste into MONGODB_URI in your .env file

## Step 4: Start the Application

```bash
npm start
```

You should see:
```
MongoDB connected successfully
Master admin account created successfully
Server running on port 3000
```

## Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Step 6: Login as Master Admin

Use these credentials:
- **Username**: `SuperCode111`
- **Password**: `NewTown2011`

## Step 7: Explore the Features

### As Master Admin, you can:

1. **Approve New Users**
   - Go to Admin Panel → Pending Users
   - Approve user registrations

2. **View All Messages**
   - Go to Admin Panel → All Messages
   - See decrypted messages from all channels and DMs

3. **Manage Admins**
   - Go to Admin Panel → Admin Management
   - Promote users to admin or demote admins

4. **Handle Reports**
   - Go to Admin Panel → Reports
   - Review and resolve user reports

5. **Review Teacher Requests**
   - Go to Admin Panel → Teacher Access Requests
   - Approve or deny teacher access to student data

### As a Regular User:

1. **Register**
   - Go to http://localhost:3000/register
   - Fill in the form with:
     - First & Last Name
     - 5-digit Student ID (e.g., 12345)
     - Email
     - Username
     - Password
   - Wait for admin approval

2. **Create Servers**
   - Click "Create Server" button
   - Give it a name and description

3. **Create Channels**
   - Select a server
   - Click "Create Channel"
   - Start chatting!

4. **Send Messages**
   - Select a channel
   - Type your message
   - Press Send

## Common Issues & Solutions

### "MongoDB connection error"
- Check your MONGODB_URI is correct
- Verify your IP is whitelisted in MongoDB Atlas (Network Access)
- Check your database password

### "Port 3000 is already in use"
- Change PORT in .env to a different number (e.g., 3001)
- Or stop the application using port 3000

### "Cannot find module"
- Run `npm install` again
- Delete node_modules and package-lock.json, then run `npm install`

### Messages not appearing in real-time
- Check browser console for Socket.IO errors
- Refresh the page
- Clear browser cache

## Testing Checklist

- [ ] Master admin can login
- [ ] New user can register
- [ ] Admin can approve user
- [ ] Approved user can login
- [ ] User can create server
- [ ] User can create channel
- [ ] User can send messages
- [ ] Messages appear encrypted in database
- [ ] Profanity filter works
- [ ] Admin can view all messages

## Next Steps

1. **Read the full documentation**:
   - [README.md](README.md) - Full feature overview
   - [TESTING.md](TESTING.md) - Comprehensive testing guide
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

2. **Customize the application**:
   - Update profanity filter words in `src/utils/profanityFilter.js`
   - Customize UI colors in `public/css/main.css`
   - Add more features as needed

3. **Deploy to production**:
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md) guide
   - Set up proper security measures
   - Configure SSL certificates

## Quick API Reference

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

**Servers:**
- `POST /api/servers` - Create server
- `GET /api/servers` - Get user's servers

**Channels:**
- `POST /api/channels` - Create channel
- `GET /api/channels/server/:serverId` - Get channels

**Messages:**
- `POST /api/messages` - Send message
- `GET /api/messages/channel/:channelId` - Get messages

**Admin (requires admin token):**
- `GET /api/auth/pending-users` - Get pending registrations
- `POST /api/auth/approve/:userId` - Approve user
- `GET /api/admin/reports` - Get reports
- `POST /api/admin/ban/:userId` - Ban user

## Support

For issues or questions:
1. Check the documentation files
2. Review error messages in terminal
3. Check browser console for frontend errors
4. Create an issue on GitHub

## Security Reminders

⚠️ **Important Security Notes:**
- Never commit `.env` file to git
- Use strong passwords in production
- Change default master admin password
- Set up proper MongoDB Atlas security
- Enable SSL/TLS in production
- Keep dependencies updated

## Development Mode

For development with auto-restart:
```bash
# Install nodemon globally
npm install -g nodemon

# Run with nodemon
nodemon src/server.js
```

## Happy Chatting! 🎉

You now have a fully functional encrypted chat application with admin controls and student safety features!
