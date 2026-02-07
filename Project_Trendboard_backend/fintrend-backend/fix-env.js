const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

try {
    // 1. Read existing .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 2. Remove problematic lines
    const lines = envContent.split('\n').filter(line =>
        !line.startsWith('FIREBASE_SERVICE_ACCOUNT=') &&
        !line.startsWith('FIRESTORE_PRIVATE_KEY=') &&
        line.trim() !== ''
    );

    // 3. Read Service Account
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    // 4. Create proper env string (single quoted)
    const minified = JSON.stringify(serviceAccount);
    const newLine = `FIREBASE_SERVICE_ACCOUNT='${minified}'`;

    // 5. Write back
    const finalContent = lines.join('\n') + '\n\n' + newLine;
    fs.writeFileSync(envPath, finalContent);

    console.log('✅ .env updated successfully: FIREBASE_SERVICE_ACCOUNT added.');

} catch (error) {
    console.error('❌ Error updating .env:', error.message);
    process.exit(1);
}
