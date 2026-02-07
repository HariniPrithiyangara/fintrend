// ============================================
// DEBUG DATABASE - DIAGNOSTIC SCRIPT
// ============================================

const { getFirestore, initializeFirebase } = require('../config/firebase');
const { FIRESTORE, SCRIPTS, CATEGORIES } = require('../config/constants');
const logger = require('../utils/logger');

async function debugDatabase() {
  if (!SCRIPTS.ALLOW) {
    console.error('❌ Scripts disabled. Set ALLOW_SCRIPTS=true');
    process.exit(1);
  }

  try {
    console.log('🐛 Debug mode...\n');

    initializeFirebase();
    const db = getFirestore();

    const allSnap = await db.collection(FIRESTORE.COLLECTION).get();
    console.log(`Total articles: ${allSnap.size}`);

    const categoryMap = {};
    allSnap.forEach(d => {
      const cat = d.data().category || 'NO_CATEGORY';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    console.log('\nCategories:');
    Object.entries(categoryMap).forEach(([k, v]) => 
      console.log(`  ${k}: ${v}`)
    );

    const recent = await db.collection(FIRESTORE.COLLECTION)
      .orderBy('datetime', 'desc')
      .limit(5)
      .get();

    console.log('\nRecent articles:');
    recent.forEach((doc, i) => {
      const d = doc.data();
      console.log(`${i + 1}. [${d.category}] ${d.title}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Debug failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  debugDatabase();
}

module.exports = { debugDatabase };