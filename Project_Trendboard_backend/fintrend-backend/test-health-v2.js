const http = require('http');

console.log('Running test against localhost:5000...');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.end();
