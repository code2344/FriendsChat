const readline = require('readline');
const User = require('../models/User');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const BannedUser = require('../models/BannedUser');
const Report = require('../models/Report');
const bcrypt = require('bcryptjs');
const { decryptMessage } = require('./encryption');

class ConsoleManager {
  constructor() {
    this.rl = null;
    this.commands = {
      help: this.showHelp.bind(this),
      users: this.listUsers.bind(this),
      'user:approve': this.approveUser.bind(this),
      'user:ban': this.banUser.bind(this),
      'user:promote': this.promoteUser.bind(this),
      'user:create': this.createUser.bind(this),
      servers: this.listServers.bind(this),
      'server:delete': this.deleteServer.bind(this),
      messages: this.listMessages.bind(this),
      'message:delete': this.deleteMessage.bind(this),
      reports: this.listReports.bind(this),
      bans: this.listBans.bind(this),
      stats: this.showStats.bind(this),
      clear: this.clearScreen.bind(this),
      exit: this.exitConsole.bind(this)
    };
  }

  initialize() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[36mFriendsChat>\x1b[0m '
    });

    console.log('\n\x1b[35m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[35m║           FriendsChat Admin Console v1.0                  ║\x1b[0m');
    console.log('\x1b[35m║           Type "help" for available commands              ║\x1b[0m');
    console.log('\x1b[35m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');

    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      const [command, ...args] = input.split(' ');
      
      if (this.commands[command]) {
        try {
          await this.commands[command](args);
        } catch (error) {
          console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
        }
      } else {
        console.log(`\x1b[33mUnknown command: ${command}. Type "help" for available commands.\x1b[0m`);
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\n\x1b[33mExiting console...\x1b[0m');
    });
  }

  async showHelp() {
    console.log('\n\x1b[36m═══ Available Commands ═══\x1b[0m\n');
    console.log('\x1b[32mUser Management:\x1b[0m');
    console.log('  users [filter]           - List all users (filter: pending, approved, banned)');
    console.log('  user:approve <username>  - Approve a pending user');
    console.log('  user:ban <username>      - Ban a user permanently');
    console.log('  user:promote <username>  - Promote user to admin');
    console.log('  user:create              - Create a new user interactively\n');
    
    console.log('\x1b[32mServer Management:\x1b[0m');
    console.log('  servers                  - List all servers');
    console.log('  server:delete <id>       - Delete a server by ID\n');
    
    console.log('\x1b[32mMessage Management:\x1b[0m');
    console.log('  messages [limit]         - View recent messages (default 10)');
    console.log('  message:delete <id>      - Delete a message by ID\n');
    
    console.log('\x1b[32mModeration:\x1b[0m');
    console.log('  reports                  - List all reports');
    console.log('  bans                     - List all banned users\n');
    
    console.log('\x1b[32mSystem:\x1b[0m');
    console.log('  stats                    - Show system statistics');
    console.log('  clear                    - Clear the console screen');
    console.log('  help                     - Show this help message');
    console.log('  exit                     - Exit the console\n');
  }

  async listUsers(args) {
    const filter = args[0] || 'all';
    let query = {};

    if (filter === 'pending') query.isApproved = false;
    else if (filter === 'approved') query.isApproved = true;
    else if (filter === 'banned') query.isBanned = true;

    const users = await User.find(query).select('-password').limit(20);
    
    console.log(`\n\x1b[36m═══ Users (${filter}) ═══\x1b[0m`);
    users.forEach(user => {
      const status = user.isBanned ? '\x1b[31m[BANNED]\x1b[0m' : 
                     !user.isApproved ? '\x1b[33m[PENDING]\x1b[0m' : 
                     '\x1b[32m[APPROVED]\x1b[0m';
      const role = user.role === 'master_admin' ? '\x1b[35m[MASTER ADMIN]\x1b[0m' : 
                   user.role === 'admin' ? '\x1b[34m[ADMIN]\x1b[0m' : '';
      console.log(`  ${status} ${role} ${user.username} - ${user.firstName} ${user.lastName} (${user.email})`);
    });
    console.log('');
  }

  async approveUser(args) {
    if (!args[0]) {
      console.log('\x1b[31mUsage: user:approve <username>\x1b[0m');
      return;
    }

    const user = await User.findOne({ username: args[0] });
    if (!user) {
      console.log(`\x1b[31mUser not found: ${args[0]}\x1b[0m`);
      return;
    }

    if (user.isApproved) {
      console.log(`\x1b[33mUser ${user.username} is already approved\x1b[0m`);
      return;
    }

    user.isApproved = true;
    user.approvedAt = Date.now();
    await user.save();

    console.log(`\x1b[32m✓ User ${user.username} approved successfully\x1b[0m`);
  }

  async banUser(args) {
    if (!args[0]) {
      console.log('\x1b[31mUsage: user:ban <username>\x1b[0m');
      return;
    }

    const user = await User.findOne({ username: args[0] });
    if (!user) {
      console.log(`\x1b[31mUser not found: ${args[0]}\x1b[0m`);
      return;
    }

    user.isBanned = true;
    await user.save();

    const bannedUser = new BannedUser({
      user: user._id,
      macAddress: 'CONSOLE-BAN',
      bannedBy: user._id, // Self-ban from console
      reason: 'Banned via console',
      isPermanent: true
    });
    await bannedUser.save();

    console.log(`\x1b[32m✓ User ${user.username} banned successfully\x1b[0m`);
  }

  async promoteUser(args) {
    if (!args[0]) {
      console.log('\x1b[31mUsage: user:promote <username>\x1b[0m');
      return;
    }

    const user = await User.findOne({ username: args[0] });
    if (!user) {
      console.log(`\x1b[31mUser not found: ${args[0]}\x1b[0m`);
      return;
    }

    if (user.role === 'admin' || user.role === 'master_admin') {
      console.log(`\x1b[33mUser ${user.username} is already an admin\x1b[0m`);
      return;
    }

    user.role = 'admin';
    await user.save();

    console.log(`\x1b[32m✓ User ${user.username} promoted to admin\x1b[0m`);
  }

  async createUser(args) {
    return new Promise((resolve) => {
      const userData = {};
      
      this.rl.question('First Name: ', (firstName) => {
        userData.firstName = firstName;
        this.rl.question('Last Name: ', (lastName) => {
          userData.lastName = lastName;
          this.rl.question('Student ID (5 digits): ', (studentId) => {
            userData.studentId = studentId;
            this.rl.question('Email: ', (email) => {
              userData.email = email;
              this.rl.question('Username: ', (username) => {
                userData.username = username;
                this.rl.question('Password: ', async (password) => {
                  try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const user = new User({
                      ...userData,
                      password: hashedPassword,
                      isApproved: true,
                      role: 'user'
                    });
                    await user.save();
                    console.log(`\x1b[32m✓ User ${username} created successfully\x1b[0m`);
                  } catch (error) {
                    console.log(`\x1b[31mError creating user: ${error.message}\x1b[0m`);
                  }
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  }

  async listServers() {
    const servers = await Server.find().populate('owner', 'username').limit(20);
    
    console.log('\n\x1b[36m═══ Servers ═══\x1b[0m');
    servers.forEach(server => {
      console.log(`  [${server._id}] ${server.name} - Owner: ${server.owner?.username || 'Unknown'} (${server.members.length} members)`);
    });
    console.log('');
  }

  async deleteServer(args) {
    if (!args[0]) {
      console.log('\x1b[31mUsage: server:delete <server_id>\x1b[0m');
      return;
    }

    const server = await Server.findById(args[0]);
    if (!server) {
      console.log(`\x1b[31mServer not found: ${args[0]}\x1b[0m`);
      return;
    }

    // Delete all channels in the server
    await Channel.deleteMany({ server: server._id });
    // Delete all messages in the server
    await Message.deleteMany({ server: server._id });
    // Delete the server
    await Server.findByIdAndDelete(args[0]);

    console.log(`\x1b[32m✓ Server ${server.name} deleted successfully\x1b[0m`);
  }

  async listMessages(args) {
    const limit = parseInt(args[0]) || 10;
    const messages = await Message.find()
      .populate('author', 'username')
      .populate('channel', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    console.log(`\n\x1b[36m═══ Recent Messages (${limit}) ═══\x1b[0m`);
    messages.forEach(msg => {
      const decrypted = decryptMessage(msg.encryptedContent);
      console.log(`  [${msg._id}] ${msg.author?.username || 'Unknown'} in #${msg.channel?.name || 'Unknown'}: ${decrypted}`);
    });
    console.log('');
  }

  async deleteMessage(args) {
    if (!args[0]) {
      console.log('\x1b[31mUsage: message:delete <message_id>\x1b[0m');
      return;
    }

    const message = await Message.findByIdAndDelete(args[0]);
    if (!message) {
      console.log(`\x1b[31mMessage not found: ${args[0]}\x1b[0m`);
      return;
    }

    console.log(`\x1b[32m✓ Message deleted successfully\x1b[0m`);
  }

  async listReports() {
    const reports = await Report.find()
      .populate('reportedUser reportedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log('\n\x1b[36m═══ Reports ═══\x1b[0m');
    reports.forEach(report => {
      const status = report.status === 'pending' ? '\x1b[33m[PENDING]\x1b[0m' : 
                     report.status === 'resolved' ? '\x1b[32m[RESOLVED]\x1b[0m' : 
                     '\x1b[90m[' + report.status.toUpperCase() + ']\x1b[0m';
      console.log(`  ${status} ${report.reportedUser?.username || 'Unknown'} reported by ${report.reportedBy?.username || 'Unknown'}`);
      console.log(`    Reason: ${report.reason}`);
    });
    console.log('');
  }

  async listBans() {
    const bans = await BannedUser.find()
      .populate('user bannedBy', 'username')
      .sort({ bannedAt: -1 });

    console.log('\n\x1b[36m═══ Banned Users ═══\x1b[0m');
    bans.forEach(ban => {
      console.log(`  \x1b[31m[BANNED]\x1b[0m ${ban.user?.username || 'Unknown'} - MAC: ${ban.macAddress}`);
      console.log(`    By: ${ban.bannedBy?.username || 'System'} - Reason: ${ban.reason}`);
    });
    console.log('');
  }

  async showStats() {
    const userCount = await User.countDocuments();
    const approvedCount = await User.countDocuments({ isApproved: true });
    const pendingCount = await User.countDocuments({ isApproved: false });
    const bannedCount = await User.countDocuments({ isBanned: true });
    const serverCount = await Server.countDocuments();
    const channelCount = await Channel.countDocuments();
    const messageCount = await Message.countDocuments();
    const dmCount = await DirectMessage.countDocuments();
    const reportCount = await Report.countDocuments({ status: 'pending' });

    console.log('\n\x1b[36m═══ System Statistics ═══\x1b[0m');
    console.log(`  Total Users:       ${userCount}`);
    console.log(`    Approved:        ${approvedCount}`);
    console.log(`    Pending:         \x1b[33m${pendingCount}\x1b[0m`);
    console.log(`    Banned:          \x1b[31m${bannedCount}\x1b[0m`);
    console.log(`  Servers:           ${serverCount}`);
    console.log(`  Channels:          ${channelCount}`);
    console.log(`  Messages:          ${messageCount}`);
    console.log(`  Direct Messages:   ${dmCount}`);
    console.log(`  Pending Reports:   \x1b[33m${reportCount}\x1b[0m`);
    console.log('');
  }

  clearScreen() {
    console.clear();
    console.log('\x1b[35m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[35m║           FriendsChat Admin Console v1.0                  ║\x1b[0m');
    console.log('\x1b[35m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
  }

  exitConsole() {
    console.log('\n\x1b[33mGoodbye! (Server will continue running)\x1b[0m');
    this.rl.close();
  }
}

module.exports = ConsoleManager;
