// ============================================
// ENVIRONMENT VALIDATION
// ============================================
require('dotenv').config();

function validateEnv() {
    const requiredVars = [
        'FINNHUB_API_KEY',
        'OPENROUTER_API_KEY'
    ];

    const firebaseVars = [
        'FIRESTORE_PROJECT_ID',
        'FIRESTORE_CLIENT_EMAIL',
        'FIRESTORE_PRIVATE_KEY'
    ];

    const missing = [];
    const firebaseMissing = [];

    // Check critical API keys
    requiredVars.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    // Check Firebase configuration
    firebaseVars.forEach(key => {
        if (!process.env[key]) {
            firebaseMissing.push(key);
        }
    });

    // Report missing critical variables
    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please add these to your .env file');
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Report missing Firebase variables (warning only, as they might use service account file)
    if (firebaseMissing.length > 0) {
        console.warn(`⚠️ Missing Firebase environment variables: ${firebaseMissing.join(', ')}`);
        console.warn('These are required unless using a service account file');
    }

    console.log('✅ Environment validation complete');
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Server Port: ${process.env.PORT || 5000}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
}

module.exports = { validateEnv };
