// ============================================
// API TESTS - News Endpoints
// ============================================

const request = require('supertest');
const app = require('../../server');

describe('📰 News API Endpoints', () => {

    describe('GET /api/health', () => {
        it('should return 200 and health status', async () => {
            const res = await request(app).get('/api/health');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status');
            expect(res.body.status).toBe('healthy');
        });
    });

    describe('GET /api/news/articles', () => {
        it('should return articles array', async () => {
            const res = await request(app)
                .get('/api/news/articles')
                .query({ limit: 10 });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter by category', async () => {
            const res = await request(app)
                .get('/api/news/articles')
                .query({ category: 'Stocks', limit: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            if (res.body.data.length > 0) {
                res.body.data.forEach(article => {
                    expect(article).toHaveProperty('category');
                });
            }
        });

        it('should filter by impact level', async () => {
            const res = await request(app)
                .get('/api/news/articles')
                .query({ impact: 'high', limit: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should support search query', async () => {
            const res = await request(app)
                .get('/api/news/articles')
                .query({ q: 'stock', limit: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should respect limit parameter', async () => {
            const limit = 3;
            const res = await request(app)
                .get('/api/news/articles')
                .query({ limit });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(limit);
        });
    });

    describe('GET /api/news/categories', () => {
        it('should return category statistics', async () => {
            const res = await request(app).get('/api/news/categories');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(typeof res.body.data).toBe('object');
        });

        it('should include all expected categories', async () => {
            const res = await request(app).get('/api/news/categories');

            const categories = res.body.data;
            expect(categories).toHaveProperty('Stocks');
            expect(categories).toHaveProperty('IPOs');
            expect(categories).toHaveProperty('Crypto');
        });
    });

    describe('GET /api/news/search', () => {
        it('should return 400 without query parameter', async () => {
            const res = await request(app).get('/api/news/search');

            expect(res.statusCode).toBe(400);
        });

        it('should search articles with query', async () => {
            const res = await request(app)
                .get('/api/news/search')
                .query({ q: 'market' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success');
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/news/:id', () => {
        it('should return 404 for non-existent article', async () => {
            const res = await request(app).get('/api/news/nonexistent123');

            expect(res.statusCode).toBe(404);
        });
    });

});

describe('🔐 Authentication Endpoints', () => {

    describe('POST /api/auth/register', () => {
        it('should return 400 without required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(res.statusCode).toBe(400);
        });

        it('should validate email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Test123!@#'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 without credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.statusCode).toBe(400);
        });
    });

});

describe('⚡ Rate Limiting', () => {

    it('should handle multiple rapid requests', async () => {
        const requests = Array(5).fill().map(() =>
            request(app).get('/api/health')
        );

        const responses = await Promise.all(requests);

        responses.forEach(res => {
            expect([200, 429]).toContain(res.statusCode);
        });
    });

});

describe('❌ Error Handling', () => {

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/nonexistent');

        expect(res.statusCode).toBe(404);
    });

    it('should handle malformed JSON', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('invalid json');

        expect(res.statusCode).toBe(400);
    });

});
