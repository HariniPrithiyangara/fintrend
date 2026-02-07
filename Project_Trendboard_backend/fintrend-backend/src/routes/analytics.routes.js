// ============================================
// ANALYTICS ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/trends', analyticsController.getTrendingTopics);
router.get('/sentiment', analyticsController.getSentimentDistribution);
router.get('/sectors', analyticsController.getSectorPerformance);
router.get('/mentions', analyticsController.getMentionsTrend);
router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;