// ============================================
// NEWS ARTICLE MODEL
// NO HARDCODING
// ============================================

const { SENTIMENT, IMPACT, CATEGORIES } = require('../config/constants');

class NewsArticle {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.summary = data.summary || '';
    this.aiSummary = data.aiSummary || null;
    this.source = data.source || 'Unknown';
    this.url = data.url || '';
    this.image = data.image || '';
    this.category = data.category || CATEGORIES.STOCKS;
    this.sentiment = data.sentiment || SENTIMENT.NEUTRAL;
    this.impact = data.impact || IMPACT.MEDIUM;
    this.tags = data.tags || [];
    this.datetime = data.datetime || Date.now();
    this.fetchedAt = data.fetchedAt || Date.now();
    this.processedAt = data.processedAt || null;
    this.status = data.status || 'pending';
  }

  validate() {
    const errors = [];

    if (!this.id) errors.push('ID required');
    if (!this.title) errors.push('Title required');
    if (!Object.values(SENTIMENT).includes(this.sentiment)) {
      errors.push(`Invalid sentiment: ${this.sentiment}`);
    }
    if (!Object.values(IMPACT).includes(this.impact)) {
      errors.push(`Invalid impact: ${this.impact}`);
    }
    if (!Object.values(CATEGORIES).includes(this.category)) {
      errors.push(`Invalid category: ${this.category}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  toFirestore() {
    return {
      id: String(this.id),
      title: this.title,
      summary: this.summary,
      aiSummary: this.aiSummary,
      source: this.source,
      url: this.url,
      image: this.image,
      category: this.category,
      sentiment: this.sentiment,
      impact: this.impact,
      tags: this.tags,
      datetime: this.datetime,
      fetchedAt: this.fetchedAt,
      processedAt: this.processedAt,
      status: this.status
    };
  }

  static fromFirestore(doc) {
    if (!doc.exists) return null;
    return new NewsArticle({
      id: doc.id,
      ...doc.data()
    });
  }

  static fromFinnhub(apiData) {
    return new NewsArticle({
      id: apiData.id,
      title: apiData.headline,
      summary: apiData.summary,
      source: apiData.source,
      url: apiData.url,
      image: apiData.image,
      category: apiData.category,
      datetime: apiData.datetime ? apiData.datetime * 1000 : Date.now()
    });
  }
}

module.exports = NewsArticle;