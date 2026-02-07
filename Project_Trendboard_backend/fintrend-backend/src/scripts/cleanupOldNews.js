// ============================================
// CLEANUP OLD NEWS - MAINTENANCE SCRIPT
// ============================================

const { initializeFirebase } = require('../config/firebase');
const newsService = require('../services/news.service');
const { SCRIPTS } = require('../config/constants');
const logger = require('../utils/logger');

async function cleanupOldNews() {
  if (!SCRIPTS.ALLOW) {
    console.error('❌ Scripts disabled. Set ALLOW_SCRIPTS=true');
    process.exit(1);
  }

  try {
    console.log('🧹 Cleanup starting...\n');

    initializeFirebase();

    const deleted = await newsService.cleanupOld();

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deleted} articles`);

    process.exit(0);
  } catch (error) {
    logger.error('Cleanup failed:', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupOldNews();
}

module.exports = { cleanupOldNews };