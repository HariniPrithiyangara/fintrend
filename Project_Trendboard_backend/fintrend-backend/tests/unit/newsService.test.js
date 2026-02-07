// ============================================
// UNIT TESTS - News Service
// ============================================

const newsService = require('../../src/services/news.service');

describe('📊 News Service - Unit Tests', () => {

    describe('mapToUICategory', () => {
        it('should map crypto keywords to Crypto category', () => {
            expect(newsService.mapToUICategory('bitcoin')).toBe('Crypto');
            expect(newsService.mapToUICategory('ethereum')).toBe('Crypto');
            expect(newsService.mapToUICategory('blockchain')).toBe('Crypto');
        });

        it('should map IPO keywords to IPOs category', () => {
            expect(newsService.mapToUICategory('ipo')).toBe('IPOs');
            expect(newsService.mapToUICategory('public offering')).toBe('IPOs');
            expect(newsService.mapToUICategory('listing')).toBe('IPOs');
        });

        it('should default to Stocks for unknown categories', () => {
            expect(newsService.mapToUICategory('random')).toBe('Stocks');
            expect(newsService.mapToUICategory('')).toBe('Stocks');
            expect(newsService.mapToUICategory()).toBe('Stocks');
        });

        it('should be case-insensitive', () => {
            expect(newsService.mapToUICategory('BITCOIN')).toBe('Crypto');
            expect(newsService.mapToUICategory('Bitcoin')).toBe('Crypto');
            expect(newsService.mapToUICategory('IPO')).toBe('IPOs');
        });
    });

    describe('analyzeSentimentByKeywords', () => {
        it('should detect positive sentiment', () => {
            const text = 'Stock prices surge to record high with strong growth';
            expect(newsService.analyzeSentimentByKeywords(text)).toBe('positive');
        });

        it('should detect negative sentiment', () => {
            const text = 'Market crash leads to massive losses and decline';
            expect(newsService.analyzeSentimentByKeywords(text)).toBe('negative');
        });

        it('should detect neutral sentiment', () => {
            const text = 'Company announces quarterly report';
            expect(newsService.analyzeSentimentByKeywords(text)).toBe('neutral');
        });

        it('should handle empty text', () => {
            expect(newsService.analyzeSentimentByKeywords('')).toBe('neutral');
        });
    });

    describe('isDuplicate', () => {
        it('should check for article existence', async () => {
            const result = await newsService.isDuplicate('test-id-123');
            expect(typeof result).toBe('boolean');
        });
    });

});
