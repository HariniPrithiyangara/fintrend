// ============================================
// STANDALONE FETCH - MANUAL NEWS IMPORT
// NO HARDCODING
// ============================================

const { initializeFirebase } = require('../config/firebase');
const newsService = require('../services/news.service');
const { FINNHUB, SCRIPTS } = require('../config/constants');
const logger = require('../utils/logger');

async function standaloneFetch() {
  if (!SCRIPTS.ALLOW) {
    console.error('❌ Scripts disabled. Set ALLOW_SCRIPTS=true');
    process.exit(1);
  }

  try {
    console.log('🚀 Standalone fetch starting...\n');

    initializeFirebase();
    logger.info('Firebase initialized');

    const results = { fetched: {}, saved: 0, skipped: 0, errors: [] };

    const categories = [
      { key: FINNHUB.CATEGORIES.GENERAL, name: 'General' },
      { key: FINNHUB.CATEGORIES.CRYPTO, name: 'Crypto' }
    ];

    for (const category of categories) {
      console.log(`\n📡 Fetching ${category.name}...`);
      
      try {
        const articles = await newsService.fetchFromFinnhub(category.key);
        results.fetched[category.key] = articles.length;
        console.log(`   Found: ${articles.length}`);

        if (articles.length === 0) continue;

        for (let i = 0; i < articles.length; i++) {
          const result = await newsService.saveArticle(articles[i]);

          if (result.success) results.saved++;
          else if (result.reason === 'duplicate') results.skipped++;
          else results.errors.push(result.error);

          process.stdout.write(`\r   Progress: ${i + 1}/${articles.length} | Saved: ${results.saved} | Skipped: ${results.skipped}`);

          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('');

      } catch (error) {
        console.error(`\n❌ ${category.name} error:`, error.message);
        results.errors.push({ category: category.key, error: error.message });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📡 Fetching IPOs...');
    try {
      const ipos = await newsService.fetchUpcomingIPOs();
      console.log(`   Found: ${ipos.length}`);

      for (const ipo of ipos) {
        const result = await newsService.saveArticle(ipo);
        if (result.success) results.saved++;
        else if (result.reason === 'duplicate') results.skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('IPO error:', error.message);
    }

    console.log('\n\n✅ Fetch complete!');
    console.log('━'.repeat(50));
    console.log(`Fetched: ${Object.values(results.fetched).reduce((a, b) => a + b, 0)}`);
    console.log(`Saved: ${results.saved}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log('━'.repeat(50));

    process.exit(0);

  } catch (error) {
    logger.error('Fetch failed:', error);
    console.error('\n❌ Fatal:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  standaloneFetch();
}

module.exports = { standaloneFetch };