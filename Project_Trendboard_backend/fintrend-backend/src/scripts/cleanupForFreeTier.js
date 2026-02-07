// ============================================
// CLEANUP SCRIPT - Optimize for Free Tier
// Run this to clean up database to new limits
// ============================================

const { initializeFirebase, getFirestore } = require('../config/firebase');
const { FIRESTORE } = require('../config/constants');
const logger = require('../utils/logger');

async function cleanupDatabase() {
    console.log('🧹 Starting database cleanup for free tier optimization...\n');

    try {
        // Initialize Firebase
        await initializeFirebase();
        const db = getFirestore();

        // Step 1: Get current stats
        console.log('📊 Step 1: Analyzing current database...');
        const allSnapshot = await db.collection(FIRESTORE.COLLECTION).get();
        console.log(`   Total articles: ${allSnapshot.size}`);

        if (allSnapshot.size === 0) {
            console.log('✅ Database is empty. Nothing to clean up.');
            process.exit(0);
        }

        // Step 2: Delete articles older than retention period
        console.log(`\n🗑️  Step 2: Removing articles older than ${FIRESTORE.RETENTION_DAYS} days...`);
        const cutoffDate = Date.now() - (FIRESTORE.RETENTION_DAYS * 24 * 60 * 60 * 1000);

        const oldSnapshot = await db.collection(FIRESTORE.COLLECTION)
            .where('datetime', '<', cutoffDate)
            .get();

        if (!oldSnapshot.empty) {
            console.log(`   Found ${oldSnapshot.size} old articles to delete`);

            // Delete in batches of 500 (Firestore limit)
            const batches = [];
            let batch = db.batch();
            let count = 0;

            oldSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                count++;

                if (count % 500 === 0) {
                    batches.push(batch);
                    batch = db.batch();
                }
            });

            if (count % 500 !== 0) {
                batches.push(batch);
            }

            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                console.log(`   Deleted batch ${i + 1}/${batches.length}`);
            }

            console.log(`   ✅ Deleted ${oldSnapshot.size} old articles`);
        } else {
            console.log('   ✅ No old articles to delete');
        }

        // Step 3: Enforce total article limit
        console.log(`\n📉 Step 3: Enforcing total limit of ${FIRESTORE.MAX_TOTAL_ARTICLES} articles...`);
        const currentSnapshot = await db.collection(FIRESTORE.COLLECTION).get();
        const currentTotal = currentSnapshot.size;

        console.log(`   Current total: ${currentTotal}`);

        if (currentTotal > FIRESTORE.MAX_TOTAL_ARTICLES) {
            const excess = currentTotal - FIRESTORE.MAX_TOTAL_ARTICLES;
            console.log(`   Exceeding limit by ${excess} articles`);
            console.log(`   Deleting oldest ${excess} articles...`);

            const oldestSnapshot = await db.collection(FIRESTORE.COLLECTION)
                .orderBy('datetime', 'asc')
                .limit(excess)
                .get();

            const batches = [];
            let batch = db.batch();
            let count = 0;

            oldestSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                count++;

                if (count % 500 === 0) {
                    batches.push(batch);
                    batch = db.batch();
                }
            });

            if (count % 500 !== 0) {
                batches.push(batch);
            }

            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                console.log(`   Deleted batch ${i + 1}/${batches.length}`);
            }

            console.log(`   ✅ Deleted ${excess} articles to meet limit`);
        } else {
            console.log(`   ✅ Within limit (${currentTotal}/${FIRESTORE.MAX_TOTAL_ARTICLES})`);
        }

        // Step 4: Final statistics
        console.log('\n📈 Step 4: Final database statistics...');
        const finalSnapshot = await db.collection(FIRESTORE.COLLECTION).get();

        const categoryCounts = {};
        let totalSize = 0;

        finalSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const category = data.category || 'Unknown';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            totalSize += JSON.stringify(data).length;
        });

        console.log(`   Total articles: ${finalSnapshot.size}`);
        console.log(`   Estimated size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   Percent of limit: ${((finalSnapshot.size / FIRESTORE.MAX_TOTAL_ARTICLES) * 100).toFixed(1)}%`);
        console.log('\n   Articles by category:');
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            console.log(`   - ${cat}: ${count}`);
        });

        // Get date range
        const oldest = await db.collection(FIRESTORE.COLLECTION)
            .orderBy('datetime', 'asc')
            .limit(1)
            .get();

        const newest = await db.collection(FIRESTORE.COLLECTION)
            .orderBy('datetime', 'desc')
            .limit(1)
            .get();

        if (!oldest.empty && !newest.empty) {
            const oldestDate = new Date(oldest.docs[0].data().datetime);
            const newestDate = new Date(newest.docs[0].data().datetime);
            console.log(`\n   Date range:`);
            console.log(`   - Oldest: ${oldestDate.toISOString()}`);
            console.log(`   - Newest: ${newestDate.toISOString()}`);
        }

        console.log('\n✅ Cleanup complete! Database optimized for free tier.');
        console.log('\n💡 Free Tier Limits:');
        console.log('   - 50,000 reads/day');
        console.log('   - 20,000 writes/day');
        console.log('   - 1 GB storage');
        console.log(`   - Current: ${finalSnapshot.size}/${FIRESTORE.MAX_TOTAL_ARTICLES} articles`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDatabase();
