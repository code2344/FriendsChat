const express = require('express');
const router = express.Router();
const teacherAccessController = require('../controllers/teacherAccessController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Teacher access request routes
router.post('/', teacherAccessController.createAccessRequest);
router.get('/', authenticate, isAdmin, teacherAccessController.getAccessRequests);
router.post('/:requestId/approve', authenticate, isAdmin, teacherAccessController.approveAccessRequest);
router.post('/:requestId/deny', authenticate, isAdmin, teacherAccessController.denyAccessRequest);

module.exports = router;
