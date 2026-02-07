// ============================================
// CHECK FIRESTORE - Diagnostic Script
// ============================================

const { getFirestore } = require('../config/firebase');
const { FIRESTORE } = require('../config/constants');
const logger = require('../utils/logger');

async function checkFirestore() {
  try {
    console.log('\n🔍 CHECKING FIRESTORE DATABASE...\n');

    const db = getFirestore();
    const collection = FIRESTORE.COLLECTION;

    console.log(`📁 Collection: ${collection}`);

    // Get total count
    const snapshot = await db.collection(collection).limit(100).get();
    console.log(`📊 Total documents (first 100): ${snapshot.size}`);

    if (snapshot.empty) {
      console.log('\n❌ NO ARTICLES FOUND IN FIRESTORE!');
      console.log('\n💡 Possible reasons:');
      console.log('   1. Cron job hasn\'t run yet');
      console.log('   2. Initial fetch failed');
      console.log('   3. Firebase credentials issue');
      console.log('   4. API rate limit reached');
      console.log('\n🔧 Try running: npm run fetch (or call GET /api/news/fetch)');
      return;
    }

    console.log('\n✅ ARTICLES FOUND!\n');

    // Category breakdown
    const categories = {};
    const sentiments = {};
    const impacts = {};
    let newest = null;
    let oldest = null;

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // Count categories
      const cat = data.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;

      // Count sentiments
      const sent = data.sentiment || 'Unknown';
      sentiments[sent] = (sentiments[sent] || 0) + 1;

      // Count impacts
      const imp = data.impact || 'Unknown';
      impacts[imp] = (impacts[imp] || 0) + 1;

      // Track dates
      if (data.datetime) {
        if (!newest || data.datetime > newest) newest = data.datetime;
        if (!oldest || data.datetime < oldest) oldest = data.datetime;
      }
    });

    console.log('📂 CATEGORIES:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    console.log('\n💭 SENTIMENTS:');
    Object.entries(sentiments).forEach(([sent, count]) => {
      console.log(`   ${sent}: ${count}`);
    });

    console.log('\n⚡ IMPACTS:');
    Object.entries(impacts).forEach(([imp, count]) => {
      console.log(`   ${imp}: ${count}`);
    });

    if (newest && oldest) {
      console.log('\n📅 DATE RANGE:');
      console.log(`   Newest: ${new Date(newest).toLocaleString()}`);
      console.log(`   Oldest: ${new Date(oldest).toLocaleString()}`);
    }

    // Show sample articles
    console.log('\n📰 SAMPLE ARTICLES (first 5):');
    snapshot.docs.slice(0, 5).forEach((doc, i) => {
      const data = doc.data();
      console.log(`\n   ${i + 1}. [${data.category}] ${data.title}`);
      console.log(`      Sentiment: ${data.sentiment} | Impact: ${data.impact}`);
      console.log(`      Source: ${data.source}`);
      console.log(`      Date: ${new Date(data.datetime).toLocaleString()}`);
    });

    console.log('\n✅ FIRESTORE CHECK COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ ERROR CHECKING FIRESTORE:', error.message);
    console.error(error);
  }

  process.exit(0);
}

checkFirestore();