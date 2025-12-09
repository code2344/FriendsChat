# FriendsChat - Project Structure

```
FriendsChat/
│
├── 📄 Documentation Files
│   ├── README.md                    # Main documentation
│   ├── QUICKSTART.md               # 5-minute setup guide
│   ├── TESTING.md                  # Testing procedures
│   ├── DEPLOYMENT.md               # Production deployment
│   ├── FEATURES.md                 # Complete feature list
│   └── PROJECT_STRUCTURE.md        # This file
│
├── ⚙️ Configuration Files
│   ├── package.json                # Node.js dependencies
│   ├── package-lock.json           # Locked dependencies
│   ├── .env.example                # Environment template
│   └── .gitignore                  # Git ignore rules
│
├── 🔧 Source Code (src/)
│   │
│   ├── 📊 Models (src/models/)
│   │   ├── User.js                 # User accounts
│   │   ├── Server.js               # Community servers
│   │   ├── Channel.js              # Text channels
│   │   ├── Message.js              # Channel messages
│   │   ├── DirectMessage.js        # Private messages
│   │   ├── Report.js               # User reports
│   │   ├── BannedUser.js           # Permanent bans
│   │   ├── TeacherAccessRequest.js # Teacher access
│   │   └── StudentInfo.js          # Student metadata
│   │
│   ├── 🎮 Controllers (src/controllers/)
│   │   ├── authController.js       # Registration & login
│   │   ├── messageController.js    # Messaging logic
│   │   ├── serverController.js     # Server management
│   │   ├── channelController.js    # Channel management
│   │   ├── adminController.js      # Admin operations
│   │   └── teacherAccessController.js # Teacher requests
│   │
│   ├── 🛣️ Routes (src/routes/)
│   │   ├── auth.js                 # Auth endpoints
│   │   ├── messages.js             # Message endpoints
│   │   ├── servers.js              # Server endpoints
│   │   ├── channels.js             # Channel endpoints
│   │   ├── admin.js                # Admin endpoints
│   │   └── teacherAccess.js        # Teacher endpoints
│   │
│   ├── 🔒 Middleware (src/middleware/)
│   │   └── auth.js                 # Authentication & authorization
│   │
│   ├── 🔧 Utils (src/utils/)
│   │   ├── encryption.js           # AES encryption
│   │   ├── profanityFilter.js      # Content filtering
│   │   ├── initMasterAdmin.js      # Master admin setup
│   │   └── studentInfo.js          # Grade management
│   │
│   ├── 🗄️ Config (src/config/)
│   │   └── database.js             # MongoDB connection
│   │
│   └── 🚀 Server (src/)
│       └── server.js               # Main application file
│
├── 🌐 Public Assets (public/)
│   │
│   ├── 🎨 CSS (public/css/)
│   │   └── main.css                # Main stylesheet
│   │
│   └── 📜 JavaScript (public/js/)
│       ├── login.js                # Login page logic
│       ├── register.js             # Registration logic
│       ├── chat.js                 # Chat interface
│       ├── admin.js                # Admin dashboard
│       └── teacher-access.js       # Teacher form
│
└── 👁️ Views (views/)
    ├── index.html                  # Home page
    ├── login.html                  # Login page
    ├── register.html               # Registration page
    ├── chat.html                   # Chat interface
    ├── admin.html                  # Admin dashboard
    ├── teacher-access.html         # Teacher form
    ├── tos.html                    # Terms of Service
    └── privacy.html                # Privacy Policy
```

## 📊 Statistics

- **Total Files**: 51
- **Source Files**: 43
- **Documentation**: 6
- **Configuration**: 4
- **Models**: 9
- **Controllers**: 6
- **Routes**: 6
- **Views**: 8
- **Public Assets**: 6 (1 CSS + 5 JS)

## 🗂️ File Count by Type

| Type          | Count | Location                |
|---------------|-------|-------------------------|
| JavaScript    | 28    | src/, public/js/        |
| HTML          | 8     | views/                  |
| CSS           | 1     | public/css/             |
| Markdown      | 6     | Root directory          |
| JSON          | 2     | Root directory          |
| Other         | 6     | Configuration files     |

## 🎯 Key Components

### Backend Architecture
```
Server (Express.js)
    ↓
Routes (API Endpoints)
    ↓
Middleware (Auth & Validation)
    ↓
Controllers (Business Logic)
    ↓
Models (Database Schema)
    ↓
Database (MongoDB Atlas)
```

### Real-time Communication
```
Client (Socket.IO Client)
    ↔️
Server (Socket.IO Server)
    ↔️
Broadcast to Channel Members
```

### Authentication Flow
```
User Login
    ↓
JWT Token Generated
    ↓
Token Stored Client-Side
    ↓
Token Sent with Requests
    ↓
Middleware Validates Token
    ↓
Access Granted/Denied
```

## 🔑 Entry Points

1. **Server Start**: `src/server.js`
2. **Database Config**: `src/config/database.js`
3. **Master Admin Init**: `src/utils/initMasterAdmin.js`
4. **Home Page**: `views/index.html`
5. **Main Stylesheet**: `public/css/main.css`

## 🛣️ Route Structure

```
/api/auth
    POST /register          - Register user
    POST /login             - User login
    GET  /pending-users     - Get pending (admin)
    POST /approve/:userId   - Approve user (admin)
    DELETE /deny/:userId    - Deny user (admin)

/api/servers
    POST /                  - Create server
    GET  /                  - Get user's servers
    GET  /all               - Get all (master admin)
    GET  /:serverId         - Get server details
    POST /:serverId/join    - Join server

/api/channels
    POST /                  - Create channel
    GET  /server/:serverId  - Get channels
    DELETE /:channelId      - Delete channel

/api/messages
    POST /                  - Send message
    GET  /channel/:channelId - Get messages
    POST /direct            - Send DM
    GET  /direct/:userId    - Get DMs
    GET  /all               - Get all (master admin)

/api/admin
    POST /reports           - Create report
    GET  /reports           - Get reports (admin)
    PUT  /reports/:reportId - Resolve report
    POST /ban/:userId       - Ban user (admin)
    GET  /banned            - Get banned users
    POST /promote/:userId   - Promote to admin (master)
    POST /demote/:userId    - Demote admin (master)

/api/teacher-access
    POST /                  - Create request
    GET  /                  - Get requests (admin)
    POST /:requestId/approve - Approve request
    POST /:requestId/deny   - Deny request
```

## 📦 Dependencies

### Production Dependencies
- express - Web framework
- mongoose - MongoDB ODM
- socket.io - Real-time communication
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- crypto-js - Message encryption
- cors - Cross-origin resource sharing
- dotenv - Environment variables
- express-validator - Input validation

### No Dev Dependencies
- All dependencies are production-ready
- No build process required
- Ready to deploy as-is

## 🔐 Security Layers

1. **Authentication**: JWT tokens
2. **Authorization**: Role-based middleware
3. **Encryption**: AES for messages
4. **Hashing**: bcrypt for passwords
5. **Validation**: Input sanitization
6. **Monitoring**: Admin oversight
7. **Banning**: MAC address tracking

## 🎨 UI Pages

1. **Public**:
   - Home, Login, Register
   - ToS, Privacy Policy
   - Teacher Access Form

2. **Authenticated**:
   - Chat Interface
   - Admin Dashboard (admins only)

## 📈 Scalability Design

- **Stateless API**: Easy horizontal scaling
- **Database**: Cloud-based MongoDB Atlas
- **Real-time**: Socket.IO with room support
- **Modular**: Components loosely coupled
- **Configurable**: Environment-based settings

## 🧪 Testing Coverage

- ✅ Syntax validation completed
- ✅ All files checked for errors
- ✅ Structure verified
- ✅ Documentation complete
- Ready for functional testing

## 🚀 Deployment Ready

The application is structured for easy deployment to:
- Traditional servers (PM2)
- Heroku
- Docker
- Cloud platforms (AWS, GCP, Azure)

See **DEPLOYMENT.md** for detailed instructions.
