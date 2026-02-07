// ============================================
// NEWS ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.get('/articles', optionalAuth, newsController.getArticles);
router.get('/article/:id', optionalAuth, newsController.getArticleById);
router.get('/categories', optionalAuth, newsController.getCategoryStats);

// Protected routes (auth required)
router.get('/search', authenticateToken, newsController.searchArticles);
router.post('/fetch', optionalAuth, newsController.fetchNews); // relaxed auth for dev
router.get('/fetch', optionalAuth, newsController.fetchNews); // allowable via browser for dev
router.get('/debug', authenticateToken, newsController.debug);

module.exports = router;