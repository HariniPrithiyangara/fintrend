// ============================================
// RE-ANALYZE SENTIMENT - Update existing articles
// ============================================

const { initializeFirebase, getFirestore } = require('../config/firebase');
const { FIRESTORE } = require('../config/constants');
const newsService = require('../services/news.service');
const logger = require('../utils/logger');

async function reanalyzeSentiment() {
    console.log('🔍 Re-analyzing sentiment for existing articles...\n');

    try {
        await initializeFirebase();
        const db = getFirestore();

        // Get all articles
        const snapshot = await db.collection(FIRESTORE.COLLECTION).get();
        console.log(`Found ${snapshot.size} articles to analyze\n`);

        if (snapshot.size === 0) {
            console.log('No articles to analyze');
            process.exit(0);
        }

        let updated = 0;
        let skipped = 0;
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

        for (const doc of snapshot.docs) {
            const article = doc.data();

            console.log(`\nAnalyzing: ${article.title?.substring(0, 60)}...`);
            console.log(`  Current sentiment: ${article.sentiment || 'none'}`);

            try {
                // Use the keyword-based sentiment analysis
                const text = `${article.title || ''} ${article.summary || article.aiSummary || ''}`;
                const newSentiment = newsService.analyzeSentimentByKeywords(text);

                console.log(`  New sentiment: ${newSentiment}`);

                // Update the article
                await db.collection(FIRESTORE.COLLECTION).doc(doc.id).update({
                    sentiment: newSentiment,
                    lastAnalyzed: Date.now()
                });

                sentimentCounts[newSentiment]++;
                updated++;

                // Small delay to avoid overwhelming Firestore
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
                skipped++;
            }
        }

        console.log('\n✅ Re-analysis complete!');
        console.log(`\nResults:`);
        console.log(`  Updated: ${updated}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`\nSentiment Distribution:`);
        console.log(`  Positive: ${sentimentCounts.positive} (${((sentimentCounts.positive / updated) * 100).toFixed(1)}%)`);
        console.log(`  Neutral: ${sentimentCounts.neutral} (${((sentimentCounts.neutral / updated) * 100).toFixed(1)}%)`);
        console.log(`  Negative: ${sentimentCounts.negative} (${((sentimentCounts.negative / updated) * 100).toFixed(1)}%)`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Re-analysis failed:', error);
        process.exit(1);
    }
}

reanalyzeSentiment();
