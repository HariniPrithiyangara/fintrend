
const limitEnforcer = require('../services/limitEnforcer.service');
const { initializeFirebase, testConnection } = require('../config/firebase');

async function testLimits() {
    console.log('🧪 Testing Limit Enforcer...');
    initializeFirebase();
    await testConnection();

    // Run full enforcement
    const result = await limitEnforcer.enforceAllLimits();

    console.log('\n📊 Enforcement Results:');
    console.log(`   - Deleted (Retention): ${result.retentionDeleted}`);
    console.log(`   - Deleted (Over Limit): ${result.limitDeleted}`);
    if (result.stats) {
        console.log(`   - Total Docs: ${result.stats.totalDocuments}`);
        console.log(`   - Storage Used: ${result.stats.estimatedSizeMB} MB`);
        console.log(`   - Limit Usage: ${result.stats.percentOfLimit}%`);
    }
    process.exit(0);
}

testLimits();
