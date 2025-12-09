const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const { authenticate, isMasterAdmin } = require('../middleware/auth');

// Server routes
router.post('/', authenticate, serverController.createServer);
router.get('/', authenticate, serverController.getUserServers);
router.get('/all', authenticate, isMasterAdmin, serverController.getAllServers);
router.get('/:serverId', authenticate, serverController.getServer);
router.post('/:serverId/join', authenticate, serverController.joinServer);

// Server management routes
router.post('/:serverId/co-owner/:userId', authenticate, serverController.addCoOwner);
router.post('/:serverId/moderator/:userId', authenticate, serverController.addModerator);
router.post('/:serverId/ban/:userId', authenticate, serverController.banUserFromServer);

module.exports = router;
