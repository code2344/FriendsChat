const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const { authenticate, isMasterAdmin } = require('../middleware/auth');

// Server routes
router.post('/', authenticate, serverController.createServer);
router.get('/', authenticate, serverController.getUserServers);
router.get('/public', serverController.getPublicServers); // Public endpoint
router.get('/all', authenticate, isMasterAdmin, serverController.getAllServers);
router.get('/:serverId', authenticate, serverController.getServer);
router.post('/:serverId/join', authenticate, serverController.joinServer);

// Server customization
router.put('/:serverId/settings', authenticate, serverController.updateServerSettings);

// Server invite routes
router.post('/:serverId/invite', authenticate, serverController.createInvite);
router.post('/join/invite', authenticate, serverController.joinWithInvite);

// Member management
router.post('/:serverId/member/:userId', authenticate, serverController.addMember);

// Role management
router.post('/:serverId/roles', authenticate, serverController.createRole);
router.post('/:serverId/roles/:roleId/assign/:userId', authenticate, serverController.assignRole);

// Server management routes
router.post('/:serverId/co-owner/:userId', authenticate, serverController.addCoOwner);
router.post('/:serverId/moderator/:userId', authenticate, serverController.addModerator);
router.post('/:serverId/ban/:userId', authenticate, serverController.banUserFromServer);

module.exports = router;
