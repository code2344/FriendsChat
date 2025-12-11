const TeacherAccessRequest = require('../models/TeacherAccessRequest');
const User = require('../models/User');

/**
 * Create a teacher access request
 */
async function createAccessRequest(req, res) {
  try {
    const { teacherName, teacherEmail, reason, studentId } = req.body;

    if (!teacherName || !teacherEmail || !reason || !studentId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const request = new TeacherAccessRequest({
      teacher: {
        name: teacherName,
        email: teacherEmail,
        reason
      },
      student: studentId
    });

    await request.save();
    await request.populate('student', 'username firstName lastName studentId');

    res.status(201).json({
      message: 'Teacher access request submitted successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create access request', details: error.message });
  }
}

/**
 * Get all teacher access requests
 */
async function getAccessRequests(req, res) {
  try {
    const { status } = req.query;

    const query = status ? { status } : {};

    const requests = await TeacherAccessRequest.find(query)
      .populate('student', 'username firstName lastName studentId email')
      .populate('approvals.admin', 'username firstName lastName')
      .populate('deniedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch access requests', details: error.message });
  }
}

/**
 * Approve a teacher access request
 * Requires 3 admin approvals or 1 master admin approval
 */
async function approveAccessRequest(req, res) {
  try {
    const { requestId } = req.params;

    const request = await TeacherAccessRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Check if admin has already approved
    const hasApproved = request.approvals.some(a => a.admin.equals(req.user._id));
    if (hasApproved) {
      return res.status(400).json({ error: 'You have already approved this request' });
    }

    // Add approval
    request.approvals.push({ admin: req.user._id });

    // Master admin can approve immediately
    if (req.user.role === 'master_admin') {
      request.status = 'approved';
      request.resolvedAt = Date.now();
    }
    // Otherwise need 3 admin approvals
    else if (request.approvals.length >= 3) {
      request.status = 'approved';
      request.resolvedAt = Date.now();
    }

    await request.save();
    await request.populate('student approvals.admin', 'username firstName lastName');

    const message = request.status === 'approved'
      ? 'Access request approved successfully'
      : `Approval added (${request.approvals.length}/3 required)`;

    res.json({ message, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve access request', details: error.message });
  }
}

/**
 * Deny a teacher access request
 */
async function denyAccessRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await TeacherAccessRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    request.status = 'denied';
    request.deniedBy = req.user._id;
    request.teacher.reason = reason || request.teacher.reason;
    request.resolvedAt = Date.now();

    await request.save();
    await request.populate('student deniedBy', 'username firstName lastName');

    res.json({ message: 'Access request denied successfully', request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deny access request', details: error.message });
  }
}

module.exports = {
  createAccessRequest,
  getAccessRequests,
  approveAccessRequest,
  denyAccessRequest
};
