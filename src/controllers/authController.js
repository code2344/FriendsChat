const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { initializeStudentInfo } = require('../utils/studentInfo');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    const { firstName, lastName, studentId, email, username, password, accountType } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !studentId || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email, username, or student ID already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine account type and role
    const userAccountType = accountType || 'student';
    const userRole = userAccountType === 'teacher' ? 'teacher' : 'user';

    // Create user
    const user = new User({
      firstName,
      lastName,
      studentId,
      email,
      username,
      password: hashedPassword,
      isApproved: false,
      accountType: userAccountType,
      role: userRole,
      badges: userAccountType === 'teacher' ? ['teacher'] : []
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful. Account pending approval.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (even for pending users to access pending page)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Check if account is approved
    if (!user.isApproved) {
      return res.json({
        message: 'Login successful - pending approval',
        token,
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          studentId: user.studentId,
          role: user.role,
          isApproved: false,
          isDenied: user.isDenied || false,
          isBanned: user.isBanned
        },
        pendingApproval: true
      });
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isApproved: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
}

/**
 * Get pending user registrations (admin only)
 */
async function getPendingUsers(req, res) {
  try {
    const pendingUsers = await User.find({ isApproved: false }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending users', details: error.message });
  }
}

/**
 * Approve a user registration (admin only)
 */
async function approveUser(req, res) {
  try {
    const { userId } = req.params;
    const { gradeLevel } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ error: 'User already approved' });
    }

    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = Date.now();
    await user.save();

    // Initialize student info only for students with grade level
    if (user.accountType === 'student' && gradeLevel) {
      try {
        await initializeStudentInfo(
          user._id,
          user.firstName,
          user.lastName,
          user.studentId,
          parseInt(gradeLevel)
        );
      } catch (error) {
        console.error('Failed to initialize student info:', error);
        // Continue even if student info fails
      }
    }

    res.json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user', details: error.message });
  }
}

/**
 * Deny a user registration (admin only)
 */
async function denyUser(req, res) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark as denied instead of deleting
    user.isDenied = true;
    user.denialReason = reason || 'No reason provided';
    user.deniedBy = req.user._id;
    user.deniedAt = Date.now();
    await user.save();

    res.json({ message: 'User registration denied', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deny user', details: error.message });
  }
}

/**
 * Search users for DM
 */
async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      isApproved: true,
      isBanned: false,
      _id: { $ne: req.user._id }, // Exclude current user
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username firstName lastName')
    .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users', details: error.message });
  }
}

/**
 * Get all users (admin only) - for dropdowns and moderation
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find({
      isApproved: true,
      isBanned: false
    })
    .select('_id username firstName lastName email accountType')
    .sort({ username: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
}

/**
 * Check approval status (for pending users)
 */
async function checkStatus(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      isApproved: user.isApproved,
      isDenied: user.isDenied || false,
      denialReason: user.denialReason,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status', details: error.message });
  }
}

/**
 * Resubmit registration after denial
 */
async function resubmitRegistration(req, res) {
  try {
    const { firstName, lastName, studentId, email } = req.body;
    
    if (!firstName || !lastName || !studentId || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!/^\d{5}$/.test(studentId)) {
      return res.status(400).json({ error: 'Student ID must be exactly 5 digits' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isApproved) {
      return res.status(400).json({ error: 'Account is already approved' });
    }

    // Update user information
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.studentId = studentId.trim();
    user.email = email.trim();
    user.isDenied = false;
    user.denialReason = null;
    user.deniedBy = null;
    user.deniedAt = null;
    
    await user.save();

    res.json({ 
      message: 'Application resubmitted successfully',
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resubmit application', details: error.message });
  }
}

module.exports = {
  register,
  login,
  getPendingUsers,
  getAllUsers,
  approveUser,
  denyUser,
  searchUsers,
  checkStatus,
  resubmitRegistration
};
