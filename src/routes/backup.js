/**
 * Backup Management Routes
 * Master admin only endpoints for database backups
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    performBackup, 
    listBackups, 
    restoreFromBackup 
} = require('../utils/databaseBackup');

/**
 * Create manual backup
 * POST /api/backup/create
 */
router.post('/create', auth, async (req, res) => {
    try {
        // Only master admin can create backups
        if (req.user.role !== 'master_admin') {
            return res.status(403).json({ error: 'Master admin access required' });
        }
        
        const result = await performBackup();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to create backup',
            details: error.message 
        });
    }
});

/**
 * List all backups
 * GET /api/backup/list
 */
router.get('/list', auth, async (req, res) => {
    try {
        // Only master admin can list backups
        if (req.user.role !== 'master_admin') {
            return res.status(403).json({ error: 'Master admin access required' });
        }
        
        const backups = await listBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to list backups',
            details: error.message 
        });
    }
});

/**
 * Restore from backup
 * POST /api/backup/restore
 */
router.post('/restore', auth, async (req, res) => {
    try {
        // Only master admin can restore backups
        if (req.user.role !== 'master_admin') {
            return res.status(403).json({ error: 'Master admin access required' });
        }
        
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }
        
        const result = await restoreFromBackup(filename);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to restore backup',
            details: error.message 
        });
    }
});

module.exports = router;
