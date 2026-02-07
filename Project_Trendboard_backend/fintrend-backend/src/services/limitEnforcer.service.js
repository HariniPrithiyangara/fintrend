// ============================================
// FIRESTORE LIMIT ENFORCER
// Ensures we stay within free tier limits
// ============================================

const { getFirestore } = require('../config/firebase');
const { FIRESTORE } = require('../config/constants');
const logger = require('../utils/logger');

class FirestoreLimitEnforcer {
    constructor() {
        this.collection = FIRESTORE.COLLECTION;
        this.maxTotalArticles = FIRESTORE.MAX_TOTAL_ARTICLES;
        this.retentionDays = FIRESTORE.RETENTION_DAYS;
    }

    /**
     * Enforce total article limit
     * Deletes oldest articles if we exceed the limit
     */
    async enforceTotalLimit() {
        try {
            const db = getFirestore();
            const snapshot = await db.collection(this.collection).get();
            const totalArticles = snapshot.size;

            logger.info(`📊 Total articles in Firestore: ${totalArticles}/${this.maxTotalArticles}`);

            if (totalArticles > this.maxTotalArticles) {
                const excess = totalArticles - this.maxTotalArticles;
                logger.warn(`⚠️  Exceeding limit by ${excess} articles. Cleaning up...`);

                // Get oldest articles
                const oldestSnapshot = await db.collection(this.collection)
                    .orderBy('datetime', 'asc')
                    .limit(excess)
                    .get();

                // Delete in batches
                const batch = db.batch();
                let deleteCount = 0;

                oldestSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    deleteCount++;
                });

                await batch.commit();
                logger.info(`✅ Deleted ${deleteCount} oldest articles to stay within limit`);

                return deleteCount;
            }

            return 0;
        } catch (error) {
            logger.error('Error enforcing total limit:', error);
            throw error;
        }
    }

    /**
     * Enforce retention period
     * Deletes articles older than retention days
     */
    async enforceRetentionPeriod() {
        try {
            const db = getFirestore();
            const cutoffDate = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

            logger.info(`🗑️  Cleaning articles older than ${this.retentionDays} days`);

            const oldSnapshot = await db.collection(this.collection)
                .where('datetime', '<', cutoffDate)
                .get();

            if (oldSnapshot.empty) {
                logger.info('✅ No old articles to clean');
                return 0;
            }

            // Delete in batches
            const batch = db.batch();
            let deleteCount = 0;

            oldSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });

            await batch.commit();
            logger.info(`✅ Deleted ${deleteCount} articles older than ${this.retentionDays} days`);

            return deleteCount;
        } catch (error) {
            logger.error('Error enforcing retention period:', error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const db = getFirestore();
            const snapshot = await db.collection(this.collection).get();

            let totalSize = 0;
            const categoryCounts = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // Estimate document size (rough calculation)
                const docSize = JSON.stringify(data).length;
                totalSize += docSize;

                // Count by category
                const category = data.category || 'Unknown';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            const stats = {
                totalDocuments: snapshot.size,
                estimatedSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                percentOfLimit: ((snapshot.size / this.maxTotalArticles) * 100).toFixed(1),
                categoryCounts,
                oldestArticle: null,
                newestArticle: null
            };

            // Get oldest and newest
            if (snapshot.size > 0) {
                const oldest = await db.collection(this.collection)
                    .orderBy('datetime', 'asc')
                    .limit(1)
                    .get();

                const newest = await db.collection(this.collection)
                    .orderBy('datetime', 'desc')
                    .limit(1)
                    .get();

                if (!oldest.empty) {
                    stats.oldestArticle = new Date(oldest.docs[0].data().datetime).toISOString();
                }
                if (!newest.empty) {
                    stats.newestArticle = new Date(newest.docs[0].data().datetime).toISOString();
                }
            }

            return stats;
        } catch (error) {
            logger.error('Error getting storage stats:', error);
            throw error;
        }
    }

    /**
     * Run all enforcement checks
     */
    async enforceAllLimits() {
        logger.info('🔍 Running Firestore limit enforcement...');

        const results = {
            retentionDeleted: 0,
            limitDeleted: 0,
            stats: null
        };

        try {
            // 1. Enforce retention period
            results.retentionDeleted = await this.enforceRetentionPeriod();

            // 2. Enforce total limit
            results.limitDeleted = await this.enforceTotalLimit();

            // 3. Get final stats
            results.stats = await this.getStorageStats();

            logger.info('✅ Limit enforcement complete:', results);

            return results;
        } catch (error) {
            logger.error('Error in limit enforcement:', error);
            throw error;
        }
    }
}

module.exports = new FirestoreLimitEnforcer();
