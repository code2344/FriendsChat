const TeacherDataRequest = require('../models/TeacherDataRequest');
const User = require('../models/User');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const { decryptMessage } = require('../utils/encryption');

// Teacher: Create data request
exports.createDataRequest = async (req, res) => {
  try {
    if (req.user.accountType !== 'teacher') {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const {
      targetType,
      targetUsers,
      targetChannel,
      targetServer,
      startDate,
      endDate,
      reason
    } = req.body;

    if (!reason || reason.length < 20) {
      return res.status(400).json({ message: 'Reason must be at least 20 characters' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const request = new TeacherDataRequest({
      teacher: req.user._id,
      targetType,
      targetUsers: targetUsers || [],
      targetChannel,
      targetServer,
      startDate,
      endDate,
      reason,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await request.save();

    res.status(201).json({
      message: 'Data request submitted. Awaiting admin approval.',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating data request', error: error.message });
  }
};

// Teacher: Get own requests
exports.getTeacherRequests = async (req, res) => {
  try {
    if (req.user.accountType !== 'teacher') {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const requests = await TeacherDataRequest.find({ teacher: req.user._id })
      .populate('targetUsers', 'username firstName lastName')
      .populate('targetChannel', 'name')
      .populate('targetServer', 'name')
      .populate('approvedBy.admin', 'username')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Admin: Get pending requests
exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const requests = await TeacherDataRequest.find({ status: 'pending' })
      .populate('teacher', 'username email firstName lastName')
      .populate('targetUsers', 'username')
      .populate('targetChannel', 'name')
      .populate('targetServer', 'name')
      .populate('approvedBy.admin', 'username')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Admin: Approve request
exports.approveRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { requestId } = req.params;
    const { notes } = req.body;

    const request = await TeacherDataRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if already approved by this admin
    const alreadyApproved = request.approvedBy.some(
      ap => ap.admin.toString() === req.user._id.toString()
    );

    if (alreadyApproved) {
      return res.status(400).json({ message: 'You have already approved this request' });
    }

    // Add approval
    request.approvedBy.push({
      admin: req.user._id,
      approvedAt: new Date(),
      notes: notes || ''
    });

    // Check if approved (master admin = instant, or 3 regular admins)
    const isMasterAdmin = req.user.role === 'master_admin';
    const regularAdminApprovals = request.approvedBy.filter(ap => {
      return ap.admin.role !== 'master_admin';
    }).length;

    if (isMasterAdmin || regularAdminApprovals >= 3) {
      request.status = 'approved';
    }

    await request.save();

    const message = request.status === 'approved' 
      ? 'Request approved! Teacher can now access data.'
      : `Approval added. ${3 - regularAdminApprovals} more regular admin approvals needed.`;

    res.json({ message, request });
  } catch (error) {
    res.status(500).json({ message: 'Error approving request', error: error.message });
  }
};

// Admin: Deny request
exports.denyRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await TeacherDataRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'denied';
    request.deniedBy = {
      admin: req.user._id,
      deniedAt: new Date(),
      reason: reason || 'No reason provided'
    };

    await request.save();

    res.json({ message: 'Request denied', request });
  } catch (error) {
    res.status(500).json({ message: 'Error denying request', error: error.message });
  }
};

// Teacher: Access approved data
exports.accessData = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await TeacherDataRequest.findById(requestId)
      .populate('teacher')
      .populate('targetUsers', 'username firstName lastName')
      .populate('targetChannel', 'name')
      .populate('targetServer', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    if (request.status !== 'approved') {
      return res.status(403).json({ message: 'Request not approved yet' });
    }

    // Log access
    request.dataAccessLog.push({
      accessedAt: new Date(),
      accessType: 'view'
    });
    if (!request.dataProvided) {
      request.dataProvided = true;
      request.dataProvidedAt = new Date();
    }
    await request.save();

    // Fetch data based on request type
    let data = [];

    if (request.targetType === 'channel' && request.targetChannel) {
      data = await Message.find({
        channel: request.targetChannel,
        createdAt: {
          $gte: new Date(request.startDate),
          $lte: new Date(request.endDate)
        }
      })
        .populate('author', 'username firstName lastName')
        .sort({ createdAt: 1 });

      // Decrypt messages for teacher
      data = data.map(msg => {
        const decrypted = decryptMessage(msg.encryptedContent);
        return {
          ...msg.toObject(),
          content: decrypted,
          timestamp: msg.createdAt
        };
      });
    } else if (request.targetType === 'user' && request.targetUsers.length > 0) {
      // Get DMs involving these users
      data = await DirectMessage.find({
        participants: { $in: request.targetUsers },
        'messages.createdAt': {
          $gte: new Date(request.startDate),
          $lte: new Date(request.endDate)
        }
      })
        .populate('participants', 'username firstName lastName');

      // Decrypt DM messages
      data = data.map(dm => ({
        ...dm.toObject(),
        messages: dm.messages
          .filter(m => {
            const msgDate = new Date(m.createdAt);
            return msgDate >= new Date(request.startDate) && 
                   msgDate <= new Date(request.endDate);
          })
          .map(m => ({
            ...m,
            content: decryptMessage(m.encryptedContent)
          }))
      }));
    }

    res.json({ 
      request,
      data,
      disclaimer: 'This data is provided for educational purposes only. Handle with care and in accordance with privacy policies.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accessing data', error: error.message });
  }
};
