const ServerSponsorship = require('../models/ServerSponsorship');
const Server = require('../models/Server');
const crypto = require('crypto');

// Generate unique reference code
function generateReferenceCode() {
  return 'SPO-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Create server sponsorship request
exports.createSponsorship = async (req, res) => {
  try {
    const { serverId, duration, sponsorshipType } = req.body;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Check if user is owner
    if (server.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only server owner can purchase sponsorship' });
    }

    const referenceCode = generateReferenceCode();
    const amount = 2.00; // Fixed $2 per sponsorship

    const sponsorship = new ServerSponsorship({
      server: serverId,
      paidBy: req.user._id,
      referenceCode,
      amount,
      duration: duration || 30,
      sponsorshipType: sponsorshipType || 'sponsored',
      status: 'pending'
    });

    await sponsorship.save();

    res.status(201).json({
      message: 'Sponsorship request created! Please transfer $2 using this reference code.',
      referenceCode,
      amount,
      duration: sponsorship.duration,
      sponsorship
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sponsorship', error: error.message });
  }
};

// Get server's sponsorships
exports.getServerSponsorships = async (req, res) => {
  try {
    const { serverId } = req.params;

    const sponsorships = await ServerSponsorship.find({ server: serverId })
      .populate('paidBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(sponsorships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sponsorships', error: error.message });
  }
};

// Get all active sponsored servers (public)
exports.getSponsoredServers = async (req, res) => {
  try {
    const sponsorships = await ServerSponsorship.find({ 
      status: 'active',
      endDate: { $gt: new Date() }
    })
      .populate('server')
      .populate('paidBy', 'username')
      .sort({ sponsorshipType: 1, views: -1 });
    
    res.json(sponsorships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sponsored servers', error: error.message });
  }
};

// Admin: Get pending sponsorships
exports.getPendingSponsorships = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const sponsorships = await ServerSponsorship.find({ status: 'pending' })
      .populate('server', 'name description icon')
      .populate('paidBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(sponsorships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sponsorships', error: error.message });
  }
};

// Admin: Verify sponsorship
exports.verifySponsorship = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { sponsorshipId } = req.params;
    const { notes } = req.body;

    const sponsorship = await ServerSponsorship.findById(sponsorshipId);
    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + sponsorship.duration);

    sponsorship.status = 'active';
    sponsorship.startDate = startDate;
    sponsorship.endDate = endDate;
    sponsorship.verifiedBy = req.user._id;
    sponsorship.verifiedAt = new Date();
    if (notes) sponsorship.notes = notes;

    await sponsorship.save();

    res.json({ 
      message: 'Sponsorship activated', 
      sponsorship,
      activeUntil: endDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying sponsorship', error: error.message });
  }
};

// Admin: Reject sponsorship
exports.rejectSponsorship = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { sponsorshipId } = req.params;
    const { reason } = req.body;

    const sponsorship = await ServerSponsorship.findById(sponsorshipId);
    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }

    sponsorship.status = 'rejected';
    sponsorship.notes = reason || 'Rejected by admin';
    sponsorship.verifiedBy = req.user._id;
    sponsorship.verifiedAt = new Date();

    await sponsorship.save();

    res.json({ message: 'Sponsorship rejected', sponsorship });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting sponsorship', error: error.message });
  }
};

// Track sponsorship view
exports.trackView = async (req, res) => {
  try {
    const { sponsorshipId } = req.params;

    await ServerSponsorship.findByIdAndUpdate(sponsorshipId, {
      $inc: { views: 1 }
    });

    res.json({ message: 'View tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking view', error: error.message });
  }
};

// Track sponsorship click
exports.trackClick = async (req, res) => {
  try {
    const { sponsorshipId } = req.params;

    await ServerSponsorship.findByIdAndUpdate(sponsorshipId, {
      $inc: { clicks: 1 }
    });

    res.json({ message: 'Click tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking click', error: error.message });
  }
};
