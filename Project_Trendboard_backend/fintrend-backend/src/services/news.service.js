// ============================================
// NEWS SERVICE - CORE BUSINESS LOGIC
// NO HARDCODING - FREE TIER OPTIMIZED
// ============================================

const { getFirestore } = require('../config/firebase');
const finnhubClient = require('../config/finnhubClient');
const aiClient = require('../config/aiClient');
const { FIRESTORE, FINNHUB, OPENROUTER, CATEGORIES } = require('../config/constants');
const logger = require('../utils/logger');
const retry = require('../utils/retry');

class NewsService {
  constructor() {
    this.db = null;
    this.collection = FIRESTORE.COLLECTION;
  }

  getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  /**
   * Map Finnhub/AI category to UI category
   * Critical for proper dashboard filtering
   */
  mapToUICategory(rawCategory = '', aiCategory = '') {
    const cat = (aiCategory || rawCategory || '').toLowerCase();

    // Crypto category
    if (cat.includes('crypto') || cat.includes('bitcoin') || cat.includes('ethereum') ||
      cat.includes('blockchain') || cat.includes('btc') || cat.includes('eth')) {
      return CATEGORIES.CRYPTO;
    }

    // IPO category
    if (cat.includes('ipo') || cat.includes('listing') || cat.includes('public offering')) {
      return CATEGORIES.IPOS;
    }

    // Default to Stocks (including market-related content)
    return CATEGORIES.STOCKS;
  }

  /**
   * Check if article exists (free tier optimized - single read)
   */
  async isDuplicate(articleId) {
    try {
      const db = this.getDb();
      const doc = await db.collection(this.collection).doc(String(articleId)).get();
      return doc.exists;
    } catch (error) {
      logger.error('isDuplicate error:', error);
      return false;
    }
  }

  /**
   * AI Enrichment with fallback (free tier safe)
   */
  async enrichWithAI(article) {
    try {
      const text = `${article.headline || article.title || ''}\n\n${article.summary || ''}`;

      if (!text.trim() || text.length < 20) {
        throw new Error('Insufficient text for analysis');
      }

      const response = await retry(
        () => aiClient.post('', {
          model: OPENROUTER.MODEL,
          temperature: OPENROUTER.TEMPERATURE,
          max_tokens: OPENROUTER.MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content: 'You are a financial sentiment analyst. Analyze the sentiment carefully - look for positive words (surge, gain, profit, growth, breakthrough), negative words (drop, loss, decline, crash, risk), or neutral tone. Return ONLY valid JSON without markdown.'
            },
            {
              role: 'user',
              content: `Analyze this financial news and determine its market sentiment:

Title: ${article.headline || article.title}
Content: ${(article.summary || '').substring(0, 500)}

Return JSON with:
{
  "summary": "2-3 sentence summary",
  "sentiment": "positive|neutral|negative" (be specific - positive for good news, negative for bad news, neutral only if truly neutral),
  "impact": "high|medium|low",
  "tags": ["TICKER1", "KEYWORD2"] (max 5, uppercase stock tickers or key terms),
  "category": "Stocks|IPOs|Markets|Crypto"
}

Text: ${text.substring(0, 1500)}`
            }
          ]
        }),
        {
          retries: 2,
          minTimeout: 2000,
          onRetry: (attempt) => logger.warn(`AI retry ${attempt}`)
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || '{}';
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Validate and use AI sentiment, or fallback to keyword analysis
      let sentiment = ['positive', 'neutral', 'negative'].includes(parsed.sentiment?.toLowerCase())
        ? parsed.sentiment.toLowerCase()
        : 'neutral';

      // If AI returns neutral, try keyword-based sentiment analysis
      if (sentiment === 'neutral') {
        sentiment = this.analyzeSentimentByKeywords(text);
      }

      return {
        summary: parsed.summary || article.summary || article.headline || 'No summary',
        sentiment,
        impact: ['high', 'medium', 'low'].includes(parsed.impact?.toLowerCase())
          ? parsed.impact.toLowerCase()
          : 'medium',
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.slice(0, 5).map(t => String(t).toUpperCase().trim()).filter(Boolean)
          : [],
        category: parsed.category || null
      };
    } catch (error) {
      logger.warn('AI enrichment failed, using keyword analysis:', error.message);

      // Fallback to keyword-based analysis
      const text = `${article.headline || article.title || ''} ${article.summary || ''}`;
      const sentiment = this.analyzeSentimentByKeywords(text);

      return {
        summary: article.summary || article.headline || 'No summary available',
        sentiment,
        impact: 'medium',
        tags: [],
        category: null
      };
    }
  }

  /**
   * Keyword-based sentiment analysis fallback
   */
  analyzeSentimentByKeywords(text) {
    const lowerText = text.toLowerCase();

    // Positive keywords
    const positiveKeywords = [
      'surge', 'soar', 'gain', 'profit', 'growth', 'rise', 'jump', 'rally',
      'breakthrough', 'success', 'record', 'high', 'boom', 'bullish', 'upgrade',
      'beat', 'exceed', 'strong', 'robust', 'positive', 'optimistic', 'recovery'
    ];

    // Negative keywords
    const negativeKeywords = [
      'drop', 'fall', 'decline', 'loss', 'crash', 'plunge', 'sink', 'tumble',
      'risk', 'concern', 'worry', 'fear', 'bearish', 'downgrade', 'miss',
      'weak', 'poor', 'negative', 'pessimistic', 'recession', 'crisis', 'fail'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) positiveCount++;
    });

    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) negativeCount++;
    });

    // Determine sentiment based on keyword counts
    if (positiveCount > negativeCount && positiveCount > 0) {
      return 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Save article to Firestore (free tier optimized)
   */
  async saveArticle(article, skipDuplicateCheck = false) {
    try {
      if (!article || !article.id) {
        logger.warn('Invalid article data');
        return { success: false, reason: 'invalid_article' };
      }

      // Duplicate check (single read operation)
      if (!skipDuplicateCheck && await this.isDuplicate(article.id)) {
        logger.debug(`Article ${article.id} exists, skipping`);
        return { success: false, reason: 'duplicate' };
      }

      // AI enrichment
      const enrichment = await this.enrichWithAI(article);

      // Map to UI category
      const category = this.mapToUICategory(article.category, enrichment.category);

      // Prepare document
      const doc = {
        id: String(article.id),
        title: article.headline || article.title || 'Untitled',
        summary: article.summary || '',
        aiSummary: enrichment.summary,
        source: article.source || 'Unknown',
        url: article.url || '',
        image: article.image || '',
        category,
        sentiment: enrichment.sentiment,
        impact: enrichment.impact,
        tags: enrichment.tags,
        datetime: article.datetime ? article.datetime * 1000 : Date.now(),
        fetchedAt: Date.now(),
        processedAt: Date.now(),
        status: 'enriched'
      };

      const db = this.getDb();
      await db.collection(this.collection).doc(String(article.id)).set(doc, { merge: true });

      logger.info(`✅ Saved: ${doc.id} [${doc.category}]`);
      return { success: true, doc };
    } catch (error) {
      logger.error('saveArticle error:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Fetch from Finnhub (with retry)
   */
  async fetchFromFinnhub(category = FINNHUB.CATEGORIES.GENERAL) {
    try {
      logger.info(`📡 Fetching Finnhub: ${category}`);

      const response = await retry(
        () => finnhubClient.get('/news', { params: { category } }),
        { retries: 2, minTimeout: 3000 }
      );

      const articles = response.data || [];
      logger.info(`✅ Fetched ${articles.length} from ${category}`);
      return articles;
    } catch (error) {
      logger.error(`❌ Finnhub fetch failed (${category}):`, error.message);
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      return [];
    }
  }

  /**
   * Fetch IPO calendar
   */
  async fetchUpcomingIPOs() {
    try {
      logger.info('📡 Fetching IPO calendar');

      const today = new Date();
      const fromDate = new Date(today);
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() + FINNHUB.IPO_WINDOW_DAYS);

      const response = await retry(
        () => finnhubClient.get('/calendar/ipo', {
          params: {
            from: fromDate.toISOString().split('T')[0],
            to: toDate.toISOString().split('T')[0]
          }
        }),
        { retries: 2, minTimeout: 3000 }
      );

      const ipos = response.data?.ipoCalendar || [];

      return ipos.map((ipo, idx) => ({
        id: `IPO_${ipo.symbol || idx}_${ipo.date}`,
        headline: `${ipo.name} IPO Scheduled`,
        summary: `${ipo.name} IPO on ${ipo.date}. Price range: ${ipo.priceRange || 'TBA'}. Shares: ${ipo.totalSharesValue || 'TBA'}.`,
        category: 'ipo',
        source: 'Finnhub IPO Calendar',
        datetime: new Date(ipo.date).getTime() / 1000,
        url: `https://finnhub.io/symbol/${ipo.symbol || ''}`,
        image: ''
      }));
    } catch (error) {
      logger.error('fetchUpcomingIPOs error:', error);
      throw error;
    }
  }

  /**
   * Get articles with filters (FREE TIER OPTIMIZED)
   * @param {Object} options - { category, search, limit }
   * @returns {Promise<Array>} Articles array
   */
  async getArticles(options = {}) {
    try {
      const { category, search, impact, limit = 100 } = options;
      const db = this.getDb();

      let query = db.collection(this.collection);
      let needsClientSort = false;

      // Filter by category (if not "All News")
      if (category && category !== 'All News') {
        query = query.where('category', '==', category);
        needsClientSort = true; // Avoid composite index requirement
      } else {
        // For "All News", we can use server-side orderBy
        query = query.orderBy('datetime', 'desc');
      }

      // Apply limit
      const fetchLimit = needsClientSort ? FIRESTORE.MAX_RESULTS : Math.min(limit, FIRESTORE.MAX_RESULTS);
      query = query.limit(fetchLimit);

      const snapshot = await query.get();
      let articles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side sorting if needed
      if (needsClientSort) {
        articles.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        articles = articles.slice(0, limit);
      }

      // Client-side filters (Search & Impact)
      if ((search && search.trim()) || impact) {
        const searchLower = search ? search.toLowerCase().trim() : '';

        articles = articles.filter(article => {
          // Impact filter
          if (impact && article.impact !== impact) {
            return false;
          }

          // Search filter
          if (searchLower) {
            const titleMatch = article.title?.toLowerCase().includes(searchLower);
            const summaryMatch = article.summary?.toLowerCase().includes(searchLower);
            const aiSummaryMatch = article.aiSummary?.toLowerCase().includes(searchLower);
            const tagsMatch = article.tags?.some(tag => tag.toLowerCase().includes(searchLower));

            if (!titleMatch && !summaryMatch && !aiSummaryMatch && !tagsMatch) {
              return false;
            }
          }

          return true;
        });
      }

      logger.debug(`getArticles: returned ${articles.length} articles (category: ${category || 'all'})`);
      return articles;
    } catch (error) {
      logger.error('getArticles error:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(articleId) {
    try {
      const db = this.getDb();
      const doc = await db.collection(this.collection).doc(String(articleId)).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error('getArticleById error:', error);
      throw error;
    }
  }

  /**
   * Get category statistics (FREE TIER OPTIMIZED)
   * Returns count for each UI category
   */
  async getCategoryStats() {
    try {
      const db = this.getDb();

      // Fetch recent articles only (free tier optimization)
      const snapshot = await db.collection(this.collection)
        .orderBy('datetime', 'desc')
        .limit(200)
        .get();

      const stats = {};

      // Initialize all UI categories
      Object.values(CATEGORIES).forEach(cat => {
        stats[cat] = 0;
      });

      // Count articles per category
      snapshot.docs.forEach(doc => {
        const category = doc.data().category || CATEGORIES.STOCKS;
        stats[category] = (stats[category] || 0) + 1;
      });

      logger.debug('Category stats:', stats);
      return stats;
    } catch (error) {
      logger.error('getCategoryStats error:', error);
      return {};
    }
  }

  /**
   * Cleanup old articles (free tier safe)
   */
  async cleanupOld(daysToKeep = null) {
    try {
      const days = daysToKeep || FIRESTORE.RETENTION_DAYS;
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

      logger.info(`Cleanup: removing articles older than ${days} days`);

      const db = this.getDb();
      const query = db.collection(this.collection).where('datetime', '<', cutoff);

      const { chunkDelete } = require('../utils/firestoreHelpers');
      const deleted = await chunkDelete(db, query, 500);

      logger.info(`✅ Cleaned ${deleted} old articles`);
      return deleted;
    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  }
}

module.exports = new NewsService();