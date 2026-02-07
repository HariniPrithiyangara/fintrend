// ============================================
// ANALYTICS CONTROLLER
// NO HARDCODING - Returns data for ChartPanel
// ============================================

const asyncHandler = require('../utils/asyncHandler');
const { getFirestore } = require('../config/firebase');
const { FIRESTORE, ANALYTICS, CATEGORIES } = require('../config/constants');
const logger = require('../utils/logger');

// Cache for analytics (free tier optimization)
const cache = new Map();
const CACHE_TTL = ANALYTICS.CACHE_TTL_MS;

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch articles for analytics (cached)
 */
async function fetchArticles(category = null, limit = 100) {
  const cacheKey = `articles:${category || 'all'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const db = getFirestore();
  let query = db.collection(FIRESTORE.COLLECTION);

  if (category && category !== CATEGORIES.ALL) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.orderBy('datetime', 'desc').limit(limit).get();
  const articles = snapshot.docs.map(doc => doc.data());

  setCache(cacheKey, articles);
  return articles;
}

/**
 * GET /api/analytics/trends
 * Trending topics
 */
exports.getTrendingTopics = asyncHandler(async (req, res) => {
  const { category, limit = '6' } = req.query;

  const articles = await fetchArticles(category, 100);

  if (articles.length === 0) {
    return res.json({
      success: true,
      data: { topics: ['No Data'], volumes: [0] }
    });
  }

  const tagCounts = {};
  articles.forEach(article => {
    (article.tags || []).forEach(tag => {
      if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sorted = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, parseInt(limit, 10));

  const result = sorted.length > 0
    ? { topics: sorted.map(([t]) => t), volumes: sorted.map(([, v]) => v) }
    : { topics: ['No Tags'], volumes: [0] };

  res.json({ success: true, data: result });
});

/**
 * GET /api/analytics/sentiment
 * Sentiment distribution
 */
exports.getSentimentDistribution = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const articles = await fetchArticles(category, 100);

  if (articles.length === 0) {
    return res.json({
      success: true,
      data: { positive: 33, neutral: 34, negative: 33 }
    });
  }

  const counts = { positive: 0, neutral: 0, negative: 0 };
  articles.forEach(a => {
    const s = (a.sentiment || 'neutral').toLowerCase();
    if (counts.hasOwnProperty(s)) counts[s]++;
  });

  const total = articles.length;
  const result = {
    positive: Math.round((counts.positive / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
    negative: Math.round((counts.negative / total) * 100)
  };

  res.json({ success: true, data: result });
});

/**
 * GET /api/analytics/sectors
 * Sector performance
 */
exports.getSectorPerformance = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const articles = await fetchArticles(category, 100);

  if (articles.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Simple sector analysis based on tags
  const sectors = [
    { name: 'Technology', keywords: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AI', 'TECH'], color: 'green', count: 0 },
    { name: 'Finance', keywords: ['JPM', 'BAC', 'GS', 'V', 'MA'], color: 'blue', count: 0 },
    { name: 'Healthcare', keywords: ['JNJ', 'PFE', 'UNH'], color: 'purple', count: 0 },
    { name: 'Energy', keywords: ['XOM', 'CVX', 'OIL'], color: 'orange', count: 0 }
  ];

  articles.forEach(article => {
    const tags = article.tags || [];
    sectors.forEach(sector => {
      if (tags.some(tag => sector.keywords.includes(tag))) {
        sector.count++;
      }
    });
  });

  const result = sectors
    .filter(s => s.count > 0)
    .map(s => ({
      name: s.name,
      change: `+${((s.count / articles.length) * 100).toFixed(1)}%`,
      color: s.color,
      articles: s.count
    }));

  res.json({
    success: true,
    data: result.length > 0 ? result : [{ name: 'No data', change: '0%', color: 'gray', articles: 0 }]
  });
});

/**
 * GET /api/analytics/mentions
 * Article volume trend (last 7 days)
 */
exports.getMentionsTrend = asyncHandler(async (req, res) => {
  const { category, days = '7' } = req.query;

  const articles = await fetchArticles(category, 200);
  const numDays = parseInt(days, 10);

  const now = Date.now();
  const labels = [];
  const data = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = numDays - 1; i >= 0; i--) {
    const dayStart = now - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);

    const count = articles.filter(a => 
      a.datetime >= dayStart && a.datetime < dayEnd
    ).length;

    const date = new Date(dayStart);
    labels.push(dayNames[date.getDay()]);
    data.push(count);
  }

  res.json({
    success: true,
    data: { labels, data }
  });
});

/**
 * GET /api/analytics/dashboard
 * Combined dashboard stats (single optimized call)
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const cacheKey = `dashboard:${category || 'all'}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  const articles = await fetchArticles(category, 100);

  // Compute all analytics
  const tagCounts = {};
  const sentCounts = { positive: 0, neutral: 0, negative: 0 };

  articles.forEach(article => {
    (article.tags || []).forEach(tag => {
      if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const s = (article.sentiment || 'neutral').toLowerCase();
    if (sentCounts.hasOwnProperty(s)) sentCounts[s]++;
  });

  const trendsSorted = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 6);
  const total = articles.length || 1;

  const result = {
    trends: trendsSorted.length > 0
      ? { topics: trendsSorted.map(([t]) => t), volumes: trendsSorted.map(([, v]) => v) }
      : { topics: ['No Data'], volumes: [0] },
    sentiment: {
      positive: Math.round((sentCounts.positive / total) * 100),
      neutral: Math.round((sentCounts.neutral / total) * 100),
      negative: Math.round((sentCounts.negative / total) * 100)
    },
    sectors: [],
    mentions: { labels: [], data: [] },
    articleCount: articles.length
  };

  setCache(cacheKey, result);
  res.json({ success: true, data: result });
});