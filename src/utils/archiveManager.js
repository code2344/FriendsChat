const zlib = require('zlib');
const { promisify } = require('util');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const Report = require('../models/Report');
const ArchivedData = require('../models/ArchivedData');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class ArchiveManager {
  constructor() {
    this.archiveThresholdDays = 30; // Archive messages older than 30 days
    this.maxDatabaseSize = 400 * 1024 * 1024; // 400MB (留100MB buffer for free tier)
  }

  /**
   * Compress and archive old messages
   */
  async archiveOldMessages(daysOld = this.archiveThresholdDays) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(`\x1b[36m[Archive] Archiving messages older than ${daysOld} days...\x1b[0m`);

      // Archive channel messages
      const oldMessages = await Message.find({
        createdAt: { $lt: cutoffDate }
      }).populate('author', 'username');

      let archived = 0;
      for (const msg of oldMessages) {
        await this.archiveDocument('message', msg);
        await Message.findByIdAndDelete(msg._id);
        archived++;
      }

      // Archive direct messages
      const oldDMs = await DirectMessage.find({
        createdAt: { $lt: cutoffDate }
      }).populate('sender recipient', 'username');

      for (const dm of oldDMs) {
        await this.archiveDocument('directMessage', dm);
        await DirectMessage.findByIdAndDelete(dm._id);
        archived++;
      }

      console.log(`\x1b[32m[Archive] ✓ Archived ${archived} messages\x1b[0m`);
      return archived;
    } catch (error) {
      console.error('\x1b[31m[Archive] Error:', error.message, '\x1b[0m');
      throw error;
    }
  }

  /**
   * Archive old resolved reports
   */
  async archiveOldReports(daysOld = 60) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldReports = await Report.find({
        status: { $in: ['resolved', 'dismissed'] },
        resolvedAt: { $lt: cutoffDate }
      }).populate('reportedUser reportedBy resolvedBy', 'username');

      let archived = 0;
      for (const report of oldReports) {
        await this.archiveDocument('report', report);
        await Report.findByIdAndDelete(report._id);
        archived++;
      }

      console.log(`\x1b[32m[Archive] ✓ Archived ${archived} reports\x1b[0m`);
      return archived;
    } catch (error) {
      console.error('\x1b[31m[Archive] Error:', error.message, '\x1b[0m');
      throw error;
    }
  }

  /**
   * Compress and archive a document
   */
  async archiveDocument(type, document) {
    try {
      const docObj = document.toObject();
      const jsonString = JSON.stringify(docObj);
      const compressed = await gzip(jsonString);

      const archived = new ArchivedData({
        type,
        originalId: document._id,
        compressedData: compressed,
        metadata: {
          originalDate: document.createdAt,
          size: Buffer.byteLength(jsonString),
          compressedSize: compressed.length
        },
        searchableFields: this.extractSearchableFields(type, docObj)
      });

      await archived.save();
    } catch (error) {
      console.error(`Error archiving ${type}:`, error.message);
    }
  }

  /**
   * Extract searchable fields from document
   */
  extractSearchableFields(type, doc) {
    const fields = {};

    if (type === 'message') {
      fields.username = doc.author?.username;
      fields.channelId = doc.channel;
      fields.serverId = doc.server;
      fields.content = doc.content?.substring(0, 100);
    } else if (type === 'directMessage') {
      fields.username = doc.sender?.username;
      fields.content = doc.content?.substring(0, 100);
    } else if (type === 'report') {
      fields.username = doc.reportedUser?.username;
    }

    return fields;
  }

  /**
   * Retrieve and decompress archived data
   */
  async retrieveArchivedData(id) {
    try {
      const archived = await ArchivedData.findOne({ originalId: id });
      if (!archived) return null;

      const decompressed = await gunzip(archived.compressedData);
      const data = JSON.parse(decompressed.toString());

      return {
        ...data,
        _archived: true,
        _archivedAt: archived.metadata.archivedAt,
        _compressionRatio: (
          ((archived.metadata.size - archived.metadata.compressedSize) / archived.metadata.size) * 100
        ).toFixed(2)
      };
    } catch (error) {
      console.error('Error retrieving archived data:', error.message);
      return null;
    }
  }

  /**
   * Search archived messages
   */
  async searchArchived(query) {
    try {
      const { type, username, channelId, startDate, endDate, limit = 50 } = query;

      const searchQuery = {};
      if (type) searchQuery.type = type;
      if (username) searchQuery['searchableFields.username'] = new RegExp(username, 'i');
      if (channelId) searchQuery['searchableFields.channelId'] = channelId;
      
      if (startDate || endDate) {
        searchQuery['metadata.originalDate'] = {};
        if (startDate) searchQuery['metadata.originalDate'].$gte = new Date(startDate);
        if (endDate) searchQuery['metadata.originalDate'].$lte = new Date(endDate);
      }

      const results = await ArchivedData.find(searchQuery)
        .sort({ 'metadata.originalDate': -1 })
        .limit(limit);

      // Decompress results
      const decompressed = await Promise.all(
        results.map(async (r) => {
          const data = await gunzip(r.compressedData);
          return {
            ...JSON.parse(data.toString()),
            _archived: true,
            _archivedAt: r.metadata.archivedAt
          };
        })
      );

      return decompressed;
    } catch (error) {
      console.error('Error searching archived data:', error.message);
      return [];
    }
  }

  /**
   * Get database size statistics
   */
  async getDatabaseStats() {
    try {
      const db = require('mongoose').connection.db;
      const stats = await db.stats();

      return {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
        totalSize: stats.dataSize + stats.indexSize,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        freeStorageSize: stats.fsstotalSize - stats.fsUsedSize || 0,
        percentUsed: ((stats.dataSize / (512 * 1024 * 1024)) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting database stats:', error.message);
      return null;
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats() {
    try {
      const totalArchived = await ArchivedData.countDocuments();
      const byType = await ArchivedData.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalSize: { $sum: '$metadata.size' },
            totalCompressed: { $sum: '$metadata.compressedSize' }
          }
        }
      ]);

      const totalSaved = byType.reduce((sum, item) => sum + (item.totalSize - item.totalCompressed), 0);

      return {
        totalArchived,
        byType,
        spaceSaved: totalSaved,
        averageCompression: byType.length > 0 
          ? ((totalSaved / byType.reduce((sum, item) => sum + item.totalSize, 0)) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      console.error('Error getting archive stats:', error.message);
      return null;
    }
  }

  /**
   * Auto-archive based on database size
   */
  async autoArchive() {
    try {
      const stats = await this.getDatabaseStats();
      
      if (!stats) return;

      const usagePercent = parseFloat(stats.percentUsed);
      
      if (usagePercent > 75) {
        console.log(`\x1b[33m[Archive] Database at ${usagePercent}% capacity. Starting auto-archive...\x1b[0m`);
        await this.archiveOldMessages(30);
        await this.archiveOldReports(60);
      } else {
        console.log(`\x1b[32m[Archive] Database at ${usagePercent}% capacity. No archiving needed.\x1b[0m`);
      }
    } catch (error) {
      console.error('\x1b[31m[Archive] Auto-archive error:', error.message, '\x1b[0m');
    }
  }
}

module.exports = new ArchiveManager();
