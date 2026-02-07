// ============================================
// FIX CATEGORIES - MIGRATION SCRIPT
// ============================================

const { getFirestore, initializeFirebase } = require('../config/firebase');
const { FIRESTORE, SCRIPTS, CATEGORIES } = require('../config/constants');
const logger = require('../utils/logger');

function normalize(rawCat = '') {
  const c = rawCat.toLowerCase();

  if (c.includes('crypto')) return CATEGORIES.CRYPTO;
  if (c.includes('ipo')) return CATEGORIES.IPOS;
  if (c.includes('market') || c.includes('forex')) return CATEGORIES.MARKETS;
  
  return CATEGORIES.STOCKS;
}

async function fixCategories() {
  if (!SCRIPTS.ALLOW) {
    console.error('❌ Scripts disabled. Set ALLOW_SCRIPTS=true');
    process.exit(1);
  }

  try {
    console.log('🔧 Fixing categories...\n');

    initializeFirebase();
    const db = getFirestore();

    const snap = await db.collection(FIRESTORE.COLLECTION).get();
    let updated = 0;

    for (const doc of snap.docs) {
      const old = doc.data().category;
      const newCat = normalize(old);

      if (old !== newCat) {
        await doc.ref.update({ category: newCat });
        updated++;
        console.log(`  ${old} → ${newCat}`);
      }
    }

    console.log(`\n✅ Updated: ${updated} articles`);
    process.exit(0);
  } catch (error) {
    logger.error('Fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixCategories();
}

module.exports = { fixCategories };