// ============================================
// SIMPLE TEST RUNNER
// Run basic API tests without full Jest setup
// ============================================

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const tests = [];
let passed = 0;
let failed = 0;

// Test helper
function test(name, fn) {
    tests.push({ name, fn });
}

// HTTP request helper
function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const req = http.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Define tests
test('Health endpoint returns 200', async () => {
    const res = await request('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.status !== 'healthy') throw new Error('Status not healthy');
});

test('Articles endpoint returns data', async () => {
    const res = await request('/api/news/articles?limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Success flag not true');
    if (!Array.isArray(res.data.data)) throw new Error('Data is not an array');
});

test('Category stats endpoint works', async () => {
    const res = await request('/api/news/categories');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.data) throw new Error('No data returned');
    if (typeof res.data.data !== 'object') throw new Error('Data is not an object');
});

test('Category filter works', async () => {
    const res = await request('/api/news/articles?category=Stocks&limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Success flag not true');
});

test('Impact filter works', async () => {
    const res = await request('/api/news/articles?impact=high&limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Success flag not true');
});

test('Search works', async () => {
    const res = await request('/api/news/articles?q=stock&limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Success flag not true');
});

test('Limit parameter respected', async () => {
    const res = await request('/api/news/articles?limit=3');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.data.length > 3) throw new Error('Limit not respected');
});

test('Invalid route returns 404', async () => {
    const res = await request('/api/nonexistent');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
});

// Run tests
async function runTests() {
    console.log('\n🧪 Running FinTrend API Tests...\n');
    console.log(`Testing against: ${BASE_URL}\n`);

    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${error.message}\n`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed\n');
        process.exit(1);
    }
}

// Check if server is running
http.get(`${BASE_URL}/api/health`, (res) => {
    if (res.statusCode === 200) {
        runTests();
    }
}).on('error', () => {
    console.error('\n❌ Server not running on', BASE_URL);
    console.error('   Start the server with: npm run dev\n');
    process.exit(1);
});
