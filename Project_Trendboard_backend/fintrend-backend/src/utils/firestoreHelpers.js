// ============================================
// FIRESTORE HELPERS - FREE TIER OPTIMIZED
// ============================================

const logger = require('./logger');

async function chunkDelete(db, query, batchSize = 500) {
  let totalDeleted = 0;
  
  try {
    while (true) {
      const snapshot = await query.limit(batchSize).get();
      
      if (snapshot.empty) break;
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      totalDeleted += snapshot.size;
      
      logger.debug(`Deleted batch: ${snapshot.size}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    logger.info(`Total deleted: ${totalDeleted}`);
    return totalDeleted;
  } catch (error) {
    logger.error('chunkDelete failed:', error);
    throw error;
  }
}

async function enqueueEnrichment(db, payload) {
  const queue = process.env.ENRICHMENT_QUEUE_COLLECTION || 'enrichmentQueue';
  
  try {
    await db.collection(queue).add({
      ...payload,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    logger.debug('Enqueued enrichment:', payload.articleId);
  } catch (error) {
    logger.error('Enqueue failed:', error);
    throw error;
  }
}

async function acquireLock(db, key, ttl = 600000) {
  const lockRef = db.collection('locks').doc(key);
  const now = Date.now();
  
  try {
    const snap = await lockRef.get();
    
    if (!snap.exists) {
      await lockRef.set({
        owner: process.pid || 'unknown',
        leaseUntil: now + ttl,
        createdAt: now
      });
      logger.debug(`Lock acquired: ${key}`);
      return true;
    }
    
    const data = snap.data();
    if (!data.leaseUntil || data.leaseUntil < now) {
      await lockRef.set({
        owner: process.pid || 'unknown',
        leaseUntil: now + ttl,
        createdAt: now
      }, { merge: true });
      logger.debug(`Lock renewed: ${key}`);
      return true;
    }
    
    logger.debug(`Lock held: ${key}`);
    return false;
  } catch (error) {
    logger.error('acquireLock error:', error);
    return false;
  }
}

async function releaseLock(db, key) {
  try {
    await db.collection('locks').doc(key).delete();
    logger.debug(`Lock released: ${key}`);
  } catch (error) {
    logger.error('releaseLock error:', error);
  }
}

module.exports = {
  chunkDelete,
  enqueueEnrichment,
  acquireLock,
  releaseLock
};