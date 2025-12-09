const Donation = require('../models/Donation');
const User = require('../models/User');
const crypto = require('crypto');

// Generate unique reference code
function generateReferenceCode() {
  return 'DON-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Create donation request
exports.createDonation = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Amount must be at least $1' });
    }

    // Determine tier based on amount
    let tier = 'bronze';
    if (amount >= 50) tier = 'platinum';
    else if (amount >= 20) tier = 'gold';
    else if (amount >= 10) tier = 'silver';

    const referenceCode = generateReferenceCode();

    const donation = new Donation({
      user: req.user._id,
      referenceCode,
      amount,
      donorTier: tier,
      status: 'pending'
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation request created! Please transfer funds using this reference code.',
      referenceCode,
      amount,
      tier,
      donation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating donation', error: error.message });
  }
};

// Get user's donations
exports.getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
};

// Admin: Get all pending donations
exports.getPendingDonations = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const donations = await Donation.find({ status: 'pending' })
      .populate('user', 'username email firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
};

// Admin: Verify donation
exports.verifyDonation = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { donationId } = req.params;
    const { notes } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = 'verified';
    donation.verifiedBy = req.user._id;
    donation.verifiedAt = new Date();
    if (notes) donation.notes = notes;

    await donation.save();

    // Update user with donor perks
    const user = await User.findById(donation.user);
    user.donorStatus = {
      isDonor: true,
      tier: donation.donorTier,
      since: new Date()
    };
    user.badges = user.badges || [];
    if (!user.badges.includes('donor')) {
      user.badges.push('donor');
    }

    // Apply perks based on tier
    user.customization = user.customization || {};
    user.customization.nameplate = donation.perks.customNameplate;
    user.customization.font = donation.perks.customFont;
    user.customization.profile = donation.perks.profile;

    await user.save();

    res.json({ message: 'Donation verified and perks applied', donation, user });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying donation', error: error.message });
  }
};

// Admin: Reject donation
exports.rejectDonation = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { donationId } = req.params;
    const { reason } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = 'rejected';
    donation.notes = reason || 'Rejected by admin';
    donation.verifiedBy = req.user._id;
    donation.verifiedAt = new Date();

    await donation.save();

    res.json({ message: 'Donation rejected', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting donation', error: error.message });
  }
};

// Update donor customization
exports.updateCustomization = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.donorStatus || !user.donorStatus.isDonor) {
      return res.status(403).json({ message: 'Donor status required' });
    }

    const { nameplate, font, profile } = req.body;

    if (nameplate) {
      user.customization.nameplate = { ...user.customization.nameplate, ...nameplate };
    }
    if (font) {
      user.customization.font = { ...user.customization.font, ...font };
    }
    if (profile) {
      user.customization.profile = { ...user.customization.profile, ...profile };
    }

    await user.save();

    res.json({ message: 'Customization updated', customization: user.customization });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customization', error: error.message });
  }
};
