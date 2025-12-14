/**
 * Database Backup to GitHub Repository
 * Automated hourly backups with restore functionality
 */

const { Octokit } = require('@octokit/rest');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// GitHub configuration from environment
const GITHUB_TOKEN = process.env.GITHUB_BACKUP_TOKEN || process.env.GITHUB_STORAGE_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_BACKUP_OWNER || process.env.GITHUB_STORAGE_OWNER;
const GITHUB_REPO = process.env.GITHUB_BACKUP_REPO || process.env.GITHUB_STORAGE_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BACKUP_BRANCH || 'backups';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Create MongoDB dump
 */
async function createMongoDBDump() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpPath = path.join('/tmp', `backup-${timestamp}`);
    
    try {
        // Get MongoDB URI
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI not configured');
        }
        
        // Create dump using mongodump
        const command = `mongodump --uri="${mongoUri}" --out="${dumpPath}"`;
        await execAsync(command);
        
        // Create tar.gz archive
        const archivePath = `${dumpPath}.tar.gz`;
        await execAsync(`tar -czf "${archivePath}" -C "${dumpPath}" .`);
        
        // Read archive
        const archive = await fs.readFile(archivePath);
        
        // Cleanup
        await execAsync(`rm -rf "${dumpPath}" "${archivePath}"`);
        
        return {
            data: archive,
            filename: `backup-${timestamp}.tar.gz`,
            timestamp
        };
    } catch (error) {
        console.error('Error creating MongoDB dump:', error);
        throw error;
    }
}

/**
 * Upload backup to GitHub
 */
async function uploadBackupToGitHub(backup) {
    try {
        const filePath = `database/${backup.filename}`;
        const content = backup.data.toString('base64');
        
        // Check if file already exists
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: filePath,
                ref: GITHUB_BRANCH
            });
            sha = data.sha;
        } catch (error) {
            // File doesn't exist, that's okay
        }
        
        // Upload file
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `Database backup - ${backup.timestamp}`,
            content,
            branch: GITHUB_BRANCH,
            sha
        });
        
        return {
            success: true,
            url: response.data.content.html_url,
            path: filePath
        };
    } catch (error) {
        console.error('Error uploading backup to GitHub:', error);
        throw error;
    }
}

/**
 * List all available backups
 */
async function listBackups() {
    try {
        const { data } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: 'database',
            ref: GITHUB_BRANCH
        });
        
        if (!Array.isArray(data)) {
            return [];
        }
        
        return data
            .filter(file => file.name.endsWith('.tar.gz'))
            .map(file => ({
                name: file.name,
                size: file.size,
                url: file.download_url,
                sha: file.sha,
                path: file.path
            }))
            .sort((a, b) => b.name.localeCompare(a.name)); // Newest first
    } catch (error) {
        console.error('Error listing backups:', error);
        return [];
    }
}

/**
 * Download backup from GitHub
 */
async function downloadBackup(filename) {
    try {
        const filePath = `database/${filename}`;
        
        const { data } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            ref: GITHUB_BRANCH
        });
        
        if (data.encoding === 'base64') {
            return {
                data: Buffer.from(data.content, 'base64'),
                filename,
                size: data.size
            };
        }
        
        throw new Error('Unexpected encoding');
    } catch (error) {
        console.error('Error downloading backup:', error);
        throw error;
    }
}

/**
 * Restore database from backup
 */
async function restoreFromBackup(filename) {
    try {
        // Download backup
        const backup = await downloadBackup(filename);
        
        // Save to temp location
        const tempPath = path.join('/tmp', filename);
        await fs.writeFile(tempPath, backup.data);
        
        // Extract archive
        const extractPath = tempPath.replace('.tar.gz', '');
        await execAsync(`mkdir -p "${extractPath}"`);
        await execAsync(`tar -xzf "${tempPath}" -C "${extractPath}"`);
        
        // Restore using mongorestore
        const mongoUri = process.env.MONGODB_URI;
        const command = `mongorestore --uri="${mongoUri}" --drop "${extractPath}"`;
        await execAsync(command);
        
        // Cleanup
        await execAsync(`rm -rf "${tempPath}" "${extractPath}"`);
        
        return {
            success: true,
            message: `Database restored from ${filename}`,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error restoring from backup:', error);
        throw error;
    }
}

/**
 * Perform automated backup
 */
async function performBackup() {
    try {
        console.log('Starting automated database backup...');
        
        // Create backup
        const backup = await createMongoDBDump();
        console.log(`Backup created: ${backup.filename}`);
        
        // Upload to GitHub
        const result = await uploadBackupToGitHub(backup);
        console.log(`Backup uploaded to GitHub: ${result.url}`);
        
        // Log to audit trail
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            action: 'database_backup',
            severity: 'info',
            details: `Automated backup completed: ${backup.filename} (${(backup.data.length / 1024 / 1024).toFixed(2)}MB)`
        });
        
        // Cleanup old backups (keep last 30 days = 720 hourly backups)
        await cleanupOldBackups(720);
        
        return {
            success: true,
            filename: backup.filename,
            size: backup.data.length,
            url: result.url
        };
    } catch (error) {
        console.error('Automated backup failed:', error);
        
        // Log failure
        try {
            const AuditLog = require('../models/AuditLog');
            await AuditLog.create({
                action: 'database_backup',
                severity: 'critical',
                details: `Automated backup failed: ${error.message}`
            });
        } catch (logError) {
            console.error('Failed to log backup error:', logError);
        }
        
        throw error;
    }
}

/**
 * Cleanup old backups
 */
async function cleanupOldBackups(keepCount = 720) {
    try {
        const backups = await listBackups();
        
        if (backups.length <= keepCount) {
            return; // Nothing to cleanup
        }
        
        // Delete oldest backups
        const toDelete = backups.slice(keepCount);
        
        for (const backup of toDelete) {
            try {
                // Get file SHA
                const { data } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: backup.path,
                    ref: GITHUB_BRANCH
                });
                
                // Delete file
                await octokit.repos.deleteFile({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: backup.path,
                    message: `Cleanup old backup: ${backup.name}`,
                    sha: data.sha,
                    branch: GITHUB_BRANCH
                });
                
                console.log(`Deleted old backup: ${backup.name}`);
            } catch (error) {
                console.error(`Error deleting backup ${backup.name}:`, error);
            }
        }
    } catch (error) {
        console.error('Error during backup cleanup:', error);
    }
}

/**
 * Schedule hourly backups
 */
function scheduleHourlyBackups() {
    // Perform backup immediately
    performBackup().catch(error => {
        console.error('Initial backup failed:', error);
    });
    
    // Schedule hourly (every 60 minutes)
    const HOUR_MS = 60 * 60 * 1000;
    setInterval(async () => {
        try {
            await performBackup();
        } catch (error) {
            console.error('Scheduled backup failed:', error);
        }
    }, HOUR_MS);
    
    console.log('Hourly database backups scheduled');
}

module.exports = {
    performBackup,
    scheduleHourlyBackups,
    listBackups,
    restoreFromBackup,
    downloadBackup,
    cleanupOldBackups
};
