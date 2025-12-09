const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Initialize the master admin account
 * Master Admin: Ruben Sutton
 * Username: SuperCode111
 * Password: NewTown2011
 */
async function initializeMasterAdmin() {
  try {
    // Check if master admin already exists
    const existingAdmin = await User.findOne({ username: 'SuperCode111' });
    
    if (existingAdmin) {
      console.log('Master admin already exists');
      return existingAdmin;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('NewTown2011', 10);

    // Create master admin
    const masterAdmin = new User({
      firstName: 'Ruben',
      lastName: 'Sutton',
      studentId: '45326',
      email: 'ruben.sutton@school.edu',
      username: 'SuperCode111',
      password: hashedPassword,
      role: 'master_admin',
      isApproved: true
    });

    await masterAdmin.save();
    console.log('Master admin account created successfully');
    return masterAdmin;
  } catch (error) {
    console.error('Error initializing master admin:', error);
    throw error;
  }
}

module.exports = {
  initializeMasterAdmin
};
