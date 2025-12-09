# FriendsChat - Encrypted Web Chat Application

A fully-featured, secure Discord-like chat platform designed for educational environments with comprehensive safety features, administrative oversight, and 35+ advanced features.

**© 2025 SuperCode Studios**

## 🌟 Overview

FriendsChat is a production-ready encrypted messaging platform that combines the best features of Discord with robust administrative controls for educational institutions. Features include server folders, reactions, rich messaging, user profiles, and complete moderation tools.

## ✨ Feature Highlights

### 🎯 30+ Advanced Features

#### **Organization & Social**
- 📁 **Server Folders** - Organize servers in custom folders with colors
- 👥 **Friends System** - Send/accept requests, friends list, online status
- ⭐ **Favorites** - Star favorite servers for quick access
- 🌍 **Server Discovery** - Browse and join public servers

#### **Rich Messaging**
- 😊 **Reactions** - React to messages with emojis, see who reacted
- 💬 **Replies** - Reply to specific messages with threading
- 📌 **Pins** - Pin important messages, view pinned history
- ✏️ **Edit/Delete** - Edit own messages, delete with permissions
- 🖼️ **Attachments** - Upload images and files
- 🎨 **Embeds** - Rich embed cards with images, colors, fields
- 📝 **@Mentions** - Mention users, roles, @everyone/@here

#### **User Customization**
- ⚙️ **Settings** - Theme, font size, notifications, privacy controls
- 🎨 **Profiles** - Custom banner, avatar, bio, pronouns, badges
- 🎭 **Status** - Online/Idle/DND/Invisible + custom status text/emoji
- 🔕 **Mute** - Mute servers/channels temporarily or permanently
- 🚫 **Block** - Block unwanted users

#### **Server Features**
- 🎭 **Custom Emojis** - Upload and use server-specific emojis
- 🎴 **Stickers** - Custom sticker packs
- 🔊 **Soundboard** - Upload and play sound effects
- 🪝 **Webhooks** - Integrate external services
- 🎬 **Welcome Screen** - Greet new members
- 📊 **Statistics** - Track members, messages, activity
- 🎨 **Boosts** - Server boost system with levels 0-3
- 📁 **Categories** - Organize channels into categories

#### **Channel Types & Features**
- # Text Channels
- 🔊 Voice Channels (UI ready)
- 📢 Announcement Channels
- 🎙️ Stage Channels
- 💬 Forum Channels
- 🔞 NSFW Channels with age gate
- ⏱️ Slowmode (rate limiting)
- 🔍 Message Search

#### **Moderation & Safety**
- 🔐 Verification Levels (None/Low/Medium/High)
- 🔒 Explicit Content Filter
- 🎯 Channel Permissions
- 🔕 System Channels (AFK, rules, announcements)

### Core Features
- **Encrypted Messaging**: All messages encrypted with AES
- **Servers & Channels**: Discord-like organizational structure
- **Direct Messaging**: Private conversations with encryption
- **Real-time Communication**: Socket.IO for instant updates
- **Profanity Filter**: Automatic inappropriate content filtering
- **MongoDB Atlas Integration**: Cloud database with auto-archiving
- **Database Management**: Auto-compress old messages, saves 70-80% space

### Security & Administration
- **Master Admin Account**: Hardcoded master administrator (Ruben Sutton / SuperCode111)
  - Unrestricted access to all chats for moderation
  - Can decrypt and view all messages
  - Complete control over the platform
  - Database management and archiving controls
  - Enhanced admin panel with system health monitoring
- **Tiered Admin System**:
  - Master Admin: Full control, database access, unrestricted access
  - Regular Admins: User approval, reports, limited moderation
  - Server Owners/Co-Owners: Server management, member control
  - Server Moderators: Content moderation, member removal
- **User Reporting**: Built-in violation reporting system
- **Permanent Bans**: MAC address tracking prevents ban evasion
- **Interactive Console**: CLI for server management after `npm start`

### Account Management
- **Registration Approval**: All accounts require admin approval
- **Student Information**: Automatic grade level tracking and updates
- **Real Name Validation**: Required first/last name and 5-digit student ID
- **Profile Customization**: Avatar, banner, bio, pronouns, badges

### Teacher Access Controls
- **Access Request System**: Teachers request student data access
- **Multi-level Approval**: Requires master admin OR 3 regular admins
- **Audit Trail**: All access requests logged

### Legal Compliance
- **Terms of Service**: Clear guidelines and agreements
- **Privacy Policy**: Transparent data handling practices
- **Admin Confidentiality Agreement**: Ethical administrator guidelines

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

## 🎮 Interactive Console Commands

After running `npm start`, an interactive console/CLI is available for administration:

### User Management
```
users [filter]           - List users (pending/approved/banned/all)
user:approve <username>  - Approve pending user registration
user:ban <username>      - Permanently ban user  
user:promote <username>  - Promote user to admin
user:demote <username>   - Demote admin to regular user
user:create             - Interactive user creation wizard
```

### Server Management
```
servers                  - List all servers
server:delete <id>       - Delete a server (with confirmation)
server:stats <id>        - Show server statistics
```

### Message & Content
```
messages [limit]         - View recent messages (decrypted for master admin)
message:delete <id>      - Delete a specific message
reports                  - List all user reports
bans                     - List all banned users
```

### Database & Archives
```
db:stats                 - Show database size and usage percentage
archive:run [days]       - Manually archive messages older than X days (default 30)
archive:search <query>   - Search archived messages
archive:stats            - Show archive compression statistics
```

### System
```
stats                    - Show comprehensive system statistics
health                   - Check system health status
clear                    - Clear console screen
help                     - Show all available commands
exit                     - Exit console (server continues running)
```

**Colorized Output:** Commands use ANSI colors for better readability:
- 🟢 Green for success
- 🔴 Red for errors
- 🟡 Yellow for warnings
- 🔵 Cyan for info

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
- `POST /api/servers/:serverId/invite-user` - Invite user by username
- `GET /api/servers/:serverId/members` - Get server members
- `PUT /api/servers/:serverId/member/:userId/role` - Update member role
- `DELETE /api/servers/:serverId/member/:userId` - Remove member
- `PUT /api/servers/:serverId/settings` - Update server settings
- `POST /api/servers/:serverId/emojis` - Add custom emoji
- `DELETE /api/servers/:serverId/emojis/:emojiId` - Remove emoji
- `POST /api/servers/:serverId/stickers` - Add sticker
- `POST /api/servers/:serverId/sounds` - Add soundboard sound

### Server Folders
- `GET /api/server-folders` - Get user's folders
- `POST /api/server-folders` - Create new folder
- `PUT /api/server-folders/:folderId` - Update folder
- `DELETE /api/server-folders/:folderId` - Delete folder
- `POST /api/server-folders/:folderId/servers/:serverId` - Add server to folder
- `DELETE /api/server-folders/:folderId/servers/:serverId` - Remove from folder
- `PUT /api/server-folders/reorder` - Reorder folders

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels/server/:serverId` - Get server channels
- `PUT /api/channels/:channelId` - Update channel settings
- `DELETE /api/channels/:channelId` - Delete channel
- `GET /api/channels/:channelId/pins` - Get pinned messages
- `POST /api/channels/:channelId/pins/:messageId` - Pin message
- `DELETE /api/channels/:channelId/pins/:messageId` - Unpin message
- `GET /api/channels/:channelId/messages/search` - Search messages

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/channel/:channelId` - Get channel messages
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/direct` - Send direct message
- `GET /api/messages/direct/:userId` - Get DMs with user
- `GET /api/messages/all` - Get all messages (master admin)
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions/:emoji` - Remove reaction

### User Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `POST /api/settings/status` - Set custom status
- `DELETE /api/settings/status` - Clear custom status
- `POST /api/settings/block/:userId` - Block user
- `DELETE /api/settings/block/:userId` - Unblock user
- `GET /api/settings/blocked` - Get blocked users
- `POST /api/settings/mute/server/:serverId` - Mute server
- `DELETE /api/settings/mute/server/:serverId` - Unmute server
- `POST /api/settings/favorite/:serverId` - Toggle favorite server

### Admin
- `POST /api/admin/reports` - Create report
- `GET /api/admin/reports` - Get reports (admin)
- `PUT /api/admin/reports/:reportId` - Resolve report (admin)
- `POST /api/admin/ban/:userId` - Permanently ban user (admin)
- `GET /api/admin/banned` - Get banned users (admin)
- `POST /api/admin/promote/:userId` - Promote to admin (master admin)
- `POST /api/admin/demote/:userId` - Demote admin (master admin)
- `GET /api/admin/database/stats` - Database usage statistics (master admin)
- `POST /api/admin/archive/run` - Manually trigger archiving (master admin)
- `GET /api/admin/archive/search` - Search archived data (master admin)
- `GET /api/admin/health` - System health metrics (master admin)

### Teacher Access
- `POST /api/teacher-access` - Create access request
- `GET /api/teacher-access` - Get access requests (admin)
- `POST /api/teacher-access/:requestId/approve` - Approve request (admin)
- `POST /api/teacher-access/:requestId/deny` - Deny request (admin)

## 📚 Documentation

- **QUICKSTART.md** - Get started in 5 minutes
- **TESTING.md** - Testing procedures and examples
- **DEPLOYMENT.md** - Production deployment guide
- **FEATURES.md** - Complete feature documentation
- **COMPLETE_FEATURES.md** - Detailed breakdown of all 35+ features
- **PROJECT_STRUCTURE.md** - File organization

## 📊 Statistics

- **Database Models**: 16 total
- **API Endpoints**: 60+ endpoints
- **Lines of Code**: 10,000+
- **Features**: 35+ implemented
- **UI Components**: 20+ modals and panels
- **CSS**: 1,700+ lines

## License

ISC License

## Contact

For questions or concerns, contact the master administrator.

---

**© 2025 SuperCode Studios - FriendsChat**

*A fully-featured encrypted chat platform designed for educational environments with comprehensive safety and moderation features.*
