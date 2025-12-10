require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { initializeMasterAdmin } = require('./utils/initMasterAdmin');
const ConsoleManager = require('./utils/consoleManager');

// Import routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const teacherAccessRoutes = require('./routes/teacherAccess');
const serverFolderRoutes = require('./routes/serverFolders');
const userSettingsRoutes = require('./routes/userSettings');
const donationRoutes = require('./routes/donations');
const sponsorshipRoutes = require('./routes/sponsorships');
const announcementRoutes = require('./routes/announcements');
const teacherDataRoutes = require('./routes/teacherData');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher-access', teacherAccessRoutes);
app.use('/api/server-folders', serverFolderRoutes);
app.use('/api/settings', userSettingsRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/teacher-data', teacherDataRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

app.get('/teacher-access', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/teacher-access.html'));
});

app.get('/donate', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/donate.html'));
});

app.get('/sponsored', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/sponsored.html'));
});

app.get('/tos', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/tos.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/privacy.html'));
});

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel-${channelId}`);
    console.log(`User ${socket.id} left channel ${channelId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`channel-${data.channelId}`).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize master admin
    await initializeMasterAdmin();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`\x1b[32m✓ Server running on port ${PORT}\x1b[0m`);
      console.log(`\x1b[32m✓ Environment: ${process.env.NODE_ENV || 'development'}\x1b[0m`);
      console.log(`\x1b[32m✓ Access the app at: http://localhost:${PORT}\x1b[0m`);
      
      // Initialize console after server starts
      const consoleManager = new ConsoleManager();
      consoleManager.initialize();

      // Run auto-archive every 6 hours
      const archiveManager = require('./utils/archiveManager');
      setInterval(async () => {
        await archiveManager.autoArchive();
      }, 6 * 60 * 60 * 1000); // 6 hours

      // Run initial archive check after 5 minutes
      setTimeout(async () => {
        await archiveManager.autoArchive();
      }, 5 * 60 * 1000); // 5 minutes
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
