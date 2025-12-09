# FriendsChat - Encrypted Web Chat Application

A secure, monitored chat platform designed for students with built-in safety features and administrative oversight.

## Features

### Core Features
- **Encrypted Messaging**: All messages are encrypted for security
- **Servers & Channels**: Organized communication with Discord-like structure
- **Direct Messaging**: Private conversations between users
- **Real-time Communication**: Powered by Socket.IO
- **Profanity Filter**: Automatic filtering of inappropriate content
- **MongoDB Atlas Integration**: Secure cloud database storage

### Security & Administration
- **Master Admin Account**: Hardcoded master administrator (Ruben Sutton / SuperCode111)
  - Unrestricted access to all chats for moderation
  - Can decrypt and view all messages
  - Complete control over the platform
- **Tiered Admin System**:
  - Master Admin: Full control and unrestricted access
  - Regular Admins: Limited moderation capabilities
  - Server Owners/Co-Owners: Server-level management
  - Server Moderators: Content moderation within assigned servers
- **User Reporting**: Built-in system for reporting violations
- **Permanent Bans**: MAC address tracking to prevent ban evasion

### Account Management
- **Registration Approval**: All new accounts require admin approval
- **Student Information**: Automatic grade level tracking and yearly updates
- **Real Name Validation**: Required first/last name and 5-digit student ID

### Teacher Access Controls
- **Access Request System**: Teachers can request student data access
- **Multi-level Approval**: Requires master admin OR 3 regular admins
- **Audit Trail**: All access requests are logged

### Legal Compliance
- **Terms of Service**: Clear guidelines and user agreements
- **Privacy Policy**: Transparent data handling practices
- **Admin Confidentiality Agreement**: Ethical guidelines for administrators

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/code2344/FriendsChat.git
cd FriendsChat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_character_encryption_key
PORT=3000
NODE_ENV=development
```

5. Start the application:
```bash
npm start
```

6. Access the application at `http://localhost:3000`

## Master Admin Credentials

**Username**: SuperCode111  
**Password**: NewTown2011  
**Name**: Ruben Sutton  
**Student ID**: 45326

The master admin account is automatically created on first launch.

## Usage

### For Students
1. Register with your real name, student ID, email, and desired username
2. Wait for admin approval
3. Login and start chatting in servers or direct messages
4. All messages are encrypted and monitored for safety

### For Admins
1. Login with admin credentials
2. Access the Admin Panel
3. Approve/deny user registrations
4. Review and resolve reports
5. Manage bans and moderation
6. Review teacher access requests

### For Teachers
1. Visit the Teacher Access Request page
2. Provide your information and reason for access
3. Wait for admin approval (master admin or 3 regular admins)
4. Access will be granted if approved

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT, bcrypt
- **Encryption**: crypto-js (AES)
- **Frontend**: HTML, CSS, JavaScript

## Project Structure

```
FriendsChat/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Authentication & authorization
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── public/
│   ├── css/            # Stylesheets
│   └── js/             # Frontend JavaScript
├── views/              # HTML pages
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Message Encryption**: AES encryption for all messages
- **JWT Authentication**: Secure token-based auth
- **MAC Address Tracking**: For permanent ban enforcement
- **Admin Monitoring**: All chats can be monitored for safety
- **Profanity Filter**: Automatic content filtering

## Important Privacy Notice

⚠️ **All communications on FriendsChat are monitored by administrators for safety and moderation purposes. The master administrator has unrestricted access to all messages, including direct messages. There is no expectation of complete privacy on this platform.**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/pending-users` - Get pending registrations (admin)
- `POST /api/auth/approve/:userId` - Approve user (admin)
- `DELETE /api/auth/deny/:userId` - Deny user (admin)

### Servers
- `POST /api/servers` - Create server
- `GET /api/servers` - Get user's servers
- `GET /api/servers/all` - Get all servers (master admin)
- `GET /api/servers/:serverId` - Get server details
- `POST /api/servers/:serverId/join` - Join server

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels/server/:serverId` - Get server channels
- `DELETE /api/channels/:channelId` - Delete channel

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/channel/:channelId` - Get channel messages
- `POST /api/messages/direct` - Send direct message
- `GET /api/messages/direct/:userId` - Get DMs with user
- `GET /api/messages/all` - Get all messages (master admin)

### Admin
- `POST /api/admin/reports` - Create report
- `GET /api/admin/reports` - Get reports (admin)
- `PUT /api/admin/reports/:reportId` - Resolve report (admin)
- `POST /api/admin/ban/:userId` - Permanently ban user (admin)
- `GET /api/admin/banned` - Get banned users (admin)
- `POST /api/admin/promote/:userId` - Promote to admin (master admin)
- `POST /api/admin/demote/:userId` - Demote admin (master admin)

### Teacher Access
- `POST /api/teacher-access` - Create access request
- `GET /api/teacher-access` - Get access requests (admin)
- `POST /api/teacher-access/:requestId/approve` - Approve request (admin)
- `POST /api/teacher-access/:requestId/deny` - Deny request (admin)

## License

ISC License

## Contact

For questions or concerns, contact the master administrator.
