
const newsService = require('../services/news.service');

async function testFetchIPOs() {
    console.log('Testing IPO Fetch...');
    try {
        const ipos = await newsService.fetchUpcomingIPOs();
        console.log(`Fetched ${ipos.length} IPOs`);
        if (ipos.length > 0) {
            console.log('Sample IPO:', ipos[0]);
        } else {
            console.warn('No IPOs found. Finnhub might be returning empty list or error.');
        }
    } catch (error) {
        console.error('Error fetching IPOs:', error);
    }
}

testFetchIPOs();
