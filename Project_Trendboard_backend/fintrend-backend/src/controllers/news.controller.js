// ============================================
// NEWS CONTROLLER - REQUEST HANDLERS
// NO HARDCODING
// ============================================

const asyncHandler = require('../utils/asyncHandler');
const newsService = require('../services/news.service');
const logger = require('../utils/logger');

/**
 * GET /api/news/articles
 * Fetch articles with filters (category, search, limit)
 */
exports.getArticles = asyncHandler(async (req, res) => {
  const { category, q: search, limit = '100', impact } = req.query;

  logger.debug('getArticles:', { category, search, limit, impact });

  try {
    const articles = await newsService.getArticles({
      category,
      search,
      impact,
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    if (error.code === 8 || error.message?.includes('Quota exceeded')) {
      logger.warn('⚠️ Firestore Quota Exceeded (Read). Returning empty list.');
      return res.json({ success: true, count: 0, data: [], warning: 'FS_QUOTA_EXCEEDED' });
    }
    throw error;
  }
});

/**
 * GET /api/news/article/:id
 * Get single article
 */
exports.getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.debug('getArticleById:', { id });

  const article = await newsService.getArticleById(id);

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found'
    });
  }

  res.json({
    success: true,
    data: article
  });
});

/**
 * GET /api/news/search
 * Search by keyword
 */
exports.searchArticles = asyncHandler(async (req, res) => {
  const { q: query, category, limit = '50' } = req.query;

  if (!query || query.trim().length < 2) {
    return res.json({
      success: true,
      count: 0,
      data: [],
      message: 'Query too short (min 2 chars)'
    });
  }

  logger.debug('searchArticles:', { query, category });

  const articles = await newsService.getArticles({
    search: query,
    category,
    limit: parseInt(limit, 10)
  });

  res.json({
    success: true,
    count: articles.length,
    data: articles
  });
});

/**
 * GET /api/news/categories
 * Get category statistics for sidebar
 */
exports.getCategoryStats = asyncHandler(async (req, res) => {
  logger.debug('getCategoryStats');

  try {
    const stats = await newsService.getCategoryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    if (error.code === 8 || error.message?.includes('Quota exceeded')) {
      logger.warn('⚠️ Firestore Quota Exceeded (Stats). Returning empty stats.');
      return res.json({ success: true, data: {}, warning: 'FS_QUOTA_EXCEEDED' });
    }
    throw error;
  }
});

/**
 * POST /api/news/fetch
 * Manual news fetch (admin)
 */
/**
 * POST/GET /api/news/fetch
 * Manual news fetch (admin/dev)
 * Triggers the full cron job logic
 */
exports.fetchNews = asyncHandler(async (req, res) => {
  // Support both body (POST) and query (GET) parameters
  const category = req.body.category || req.query.category;

  logger.info('Manual fetch triggered via API');

  // Import cron job dynamically to avoid circular dependencies if any
  const { runFetchJob } = require('../jobs/newsCron');

  // Run the full job (non-blocking if you want immediate response, 
  // but for manual fetch we usually want to see the result)
  const result = await runFetchJob();

  res.json({
    success: result.success,
    message: result.success ? 'Manual fetch completed' : 'Manual fetch failed',
    details: result
  });
});

/**
 * GET /api/news/debug
 * Debug endpoint (dev only)
 */
exports.debug = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Not available in production'
    });
  }

  const stats = await newsService.getCategoryStats();
  const recent = await newsService.getArticles({ limit: 5 });

  res.json({
    success: true,
    debug: {
      environment: process.env.NODE_ENV,
      collection: process.env.FIRESTORE_COLLECTION,
      categoryStats: stats,
      recentArticles: recent.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        datetime: new Date(a.datetime).toISOString()
      }))
    }
  });
});