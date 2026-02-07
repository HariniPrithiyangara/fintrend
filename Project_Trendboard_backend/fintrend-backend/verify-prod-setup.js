require('dotenv').config();
const { initializeFirebase, testConnection, shutdown } = require('./src/config/firebase');

console.log('🚀 Starting Strict Configuration Test...');
console.log('--------------------------------------');

try {
    // 1. Check Env Vars directly first to be sure they are loaded
    console.log('Checking Environment Variables:');
    console.log(`- PROJECT_ID: ${process.env.FIRESTORE_PROJECT_ID ? '✅ Found' : '❌ MISSING'}`);
    console.log(`- CLIENT_EMAIL: ${process.env.FIRESTORE_CLIENT_EMAIL ? '✅ Found' : '❌ MISSING'}`);
    console.log(`- PRIVATE_KEY: ${process.env.FIRESTORE_PRIVATE_KEY ? '✅ Found' : '❌ MISSING'}`);
    if (process.env.FIRESTORE_PRIVATE_KEY) {
        console.log(`  Key Length: ${process.env.FIRESTORE_PRIVATE_KEY.length}`);
        console.log(`  Key Start: ${process.env.FIRESTORE_PRIVATE_KEY.substring(0, 20)}...`);
    }

    // 2. Initialize
    console.log('\nInitializing Firebase...');
    initializeFirebase();
    console.log('✅ Initialization call successful');

    // 3. Test Connection
    console.log('\nTesting Firestore Connection...');
    testConnection().then(connected => {
        if (connected) {
            console.log('✅✅✅ SUCCESS: Firestore connected successfully!');
            console.log('This proves the .env file is correct and code works without serviceAccountKey.json');
        } else {
            console.log('❌❌❌ FAILURE: Connection failed.');
        }
    }).catch(err => {
        console.error('❌ Connection Error:', err);
    }).finally(() => {
        shutdown();
    });

} catch (error) {
    console.error('\n❌ CRITICAL ERROR during initialization:', error.message);
    process.exit(1);
}
