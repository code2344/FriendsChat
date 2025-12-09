const express = require('express');
const router = express.Router();
const teacherDataController = require('../controllers/teacherDataController');
const { authenticateToken } = require('../middleware/auth');

// Teacher routes
router.post('/', authenticateToken, teacherDataController.createDataRequest);
router.get('/my-requests', authenticateToken, teacherDataController.getTeacherRequests);
router.get('/:requestId/data', authenticateToken, teacherDataController.accessData);

// Admin routes
router.get('/pending', authenticateToken, teacherDataController.getPendingRequests);
router.put('/:requestId/approve', authenticateToken, teacherDataController.approveRequest);
router.put('/:requestId/deny', authenticateToken, teacherDataController.denyRequest);

module.exports = router;
