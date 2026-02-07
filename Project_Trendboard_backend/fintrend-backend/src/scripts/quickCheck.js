// Quick Firestore Check
const { getFirestore } = require('../config/firebase');

async function quickCheck() {
    const db = getFirestore();
    const snapshot = await db.collection('news_articles').limit(200).get();

    const stats = {
        total: snapshot.size,
        categories: {},
        sentiments: {},
        impacts: {}
    };

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        stats.categories[d.category] = (stats.categories[d.category] || 0) + 1;
        stats.sentiments[d.sentiment] = (stats.sentiments[d.sentiment] || 0) + 1;
        stats.impacts[d.impact] = (stats.impacts[d.impact] || 0) + 1;
    });

    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
}

quickCheck().catch(console.error);
