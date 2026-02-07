
require('dotenv').config();
const { initializeFirebase, testConnection } = require('../config/firebase');
const newsService = require('../services/news.service');
const logger = require('../utils/logger');
const { FINNHUB } = require('../config/constants');

async function manualFetch() {
    console.log('🚀 Starting Manual Fetch...');

    initializeFirebase();
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Firestore connection failed!');
        process.exit(1);
    }

    try {
        const category = 'general';
        console.log(`📥 Fetching ${category} news from Finnhub...`);
        const articles = await newsService.fetchFromFinnhub(category);
        console.log(`✅ Fetched ${articles.length} articles.`);

        if (articles.length === 0) {
            console.warn('⚠️ No articles returned from Finnhub.');
            return;
        }

        console.log('💾 Saving first 5 articles to Firestore...');
        let saved = 0;
        for (const article of articles.slice(0, 5)) {
            const result = await newsService.saveArticle(article);
            if (result.success) {
                console.log(`   ✅ Saved: ${article.headline.substring(0, 50)}...`);
                saved++;
            } else if (result.reason === 'duplicate') {
                console.log(`   ℹ️ Duplicate: ${article.headline.substring(0, 30)}...`);
            } else {
                console.error(`   ❌ Error: ${result.reason}`, result.error);
            }
        }

        console.log(`🏁 Manual fetch complete. Saved ${saved} new articles.`);

        // Verify count
        const db = require('../config/firebase').getFirestore();
        const snapshot = await db.collection('articles').count().get();
        console.log(`📊 Total Articles in DB: ${snapshot.data().count}`);

    } catch (error) {
        console.error('❌ Manual fetch failed:', error);
    } finally {
        process.exit(0);
    }
}

manualFetch();
