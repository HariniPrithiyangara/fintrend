// ============================================
// NEWS CRON JOB - SCHEDULED FETCHING
// NO HARDCODING - FREE TIER OPTIMIZED
// ============================================

const cron = require('node-cron');
const logger = require('../utils/logger');
const newsService = require('../services/news.service');
const limitEnforcer = require('../services/limitEnforcer.service');
const { getFirestore } = require('../config/firebase');
const { acquireLock, releaseLock } = require('../utils/firestoreHelpers');
const { CRON, FINNHUB } = require('../config/constants');

let cronTask = null;
let lastRun = null;
let isRunning = false;

async function runFetchJob() {
  const db = getFirestore();
  const lockKey = 'news_fetch_lock';

  try {
    if (isRunning) {
      logger.warn('Job already running');
      return { skipped: true, reason: 'already_running' };
    }

    const acquired = await acquireLock(db, lockKey, CRON.LOCK_TTL_MS);

    if (!acquired) {
      logger.info('Lock held by another instance');
      return { skipped: true, reason: 'lock_held' };
    }

    isRunning = true;
    logger.info('🔄 Cron job started');
    lastRun = Date.now();

    const results = {
      fetched: {},
      saved: 0,
      skipped: 0,
      errors: []
    };

    const categories = [
      FINNHUB.CATEGORIES.GENERAL,
      FINNHUB.CATEGORIES.CRYPTO,
      FINNHUB.CATEGORIES.MERGER
    ];

    for (const category of categories) {
      if (!category) continue; // Skip undefined categories

      try {
        logger.info(`Fetching ${category}...`);
        const articles = await newsService.fetchFromFinnhub(category);
        results.fetched[category] = articles.length;

        // Process in smaller batches
        const batch = articles.slice(0, CRON.BATCH_SIZE);

        for (const article of batch) {
          const result = await newsService.saveArticle(article);

          if (result.success) results.saved++;
          else if (result.reason === 'duplicate') results.skipped++;
          else if (result.error) results.errors.push(result.error);

          await new Promise(resolve => setTimeout(resolve, CRON.BATCH_DELAY_MS));
        }

        logger.info(`✅ ${category}: saved ${results.saved}/${batch.length}`);

      } catch (error) {
        logger.error(`Error fetching ${category}:`, error.message);
        results.errors.push({ category, error: error.message });
      }

      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // ============================================
    // FETCH UPCOMING IPOs
    // ============================================
    try {
      logger.info('📡 Fetching Upcoming IPOs...');
      const ipos = await newsService.fetchUpcomingIPOs();
      results.fetched['IPOs'] = ipos.length;

      // Save IPOs
      for (const ipo of ipos) {
        // IPOs don't need AI enrichment usually as they are structured data, 
        // but saveArticle handles them fine.
        // We explicitly skip duplicate check optimization here because statuses might update
        const result = await newsService.saveArticle(ipo, false);

        if (result.success) results.saved++;
        else if (result.reason === 'duplicate') results.skipped++;
        else if (result.error) results.errors.push(result.error);
      }
      logger.info(`✅ IPOs: saved ${results.saved} (cumulative)`);
    } catch (error) {
      logger.error('Error fetching IPOs:', error.message);
      results.errors.push({ category: 'IPOs', error: error.message });
    }

    logger.info('✅ Cron job completed', results.saved);

    // ENFORCE LIMITS AFTER FETCH
    await limitEnforcer.enforceAllLimits();

    return { success: true, results };

  } catch (error) {
    logger.error('❌ Cron job failed:', error);
    return { success: false, error: error.message };
  } finally {
    isRunning = false;
    try {
      await releaseLock(db, lockKey);
    } catch (e) {
      logger.warn('Failed to release lock', e.message);
    }
  }
}

function scheduleNewsFetch() {
  if (!CRON.ENABLE) {
    logger.info('Cron disabled');
    return null;
  }

  if (!CRON.SCHEDULE || ['off', 'disabled'].includes(CRON.SCHEDULE.toLowerCase())) {
    logger.info('Cron not configured');
    return null;
  }

  if (cronTask) {
    logger.info('Cron already scheduled');
    return cronTask;
  }

  try {
    if (!cron.validate(CRON.SCHEDULE)) {
      throw new Error(`Invalid cron: ${CRON.SCHEDULE}`);
    }

    cronTask = cron.schedule(CRON.SCHEDULE, () => {
      runFetchJob().catch(error => {
        logger.error('Cron execution error:', error);
      });
    });

    logger.info(`✅ Cron scheduled: ${CRON.SCHEDULE}`);
    return cronTask;
  } catch (error) {
    logger.error('❌ Cron schedule failed:', error);
    throw error;
  }
}

async function initialFetchIfRequired() {
  if (!CRON.RUN_INITIAL) {
    logger.info('Initial fetch disabled');
    return { skipped: true, reason: 'disabled' };
  }

  logger.info('Running initial fetch...');
  return await runFetchJob();
}

function getCronStatus() {
  return {
    healthy: true,
    enabled: CRON.ENABLE,
    scheduled: !!cronTask,
    running: isRunning,
    lastRun: lastRun ? new Date(lastRun).toISOString() : null,
    schedule: CRON.SCHEDULE
  };
}

function getCronInstance() {
  return cronTask;
}

async function stopCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('✅ Cron stopped');
  }
}

module.exports = {
  scheduleNewsFetch,
  runFetchJob,
  initialFetchIfRequired,
  getCronStatus,
  getCronInstance,
  stopCron
};