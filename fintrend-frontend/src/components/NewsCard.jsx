// ============================================
// NEWS CARD - ARTICLE DISPLAY COMPONENT
// NO HARDCODING
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import formatDate from '../utils/formatDate';

const NewsCard = ({ news }) => {
  const impactStyles = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const sentimentStyles = {
    positive: 'text-green-600 bg-green-50',
    neutral: 'text-gray-600 bg-gray-50',
    negative: 'text-red-600 bg-red-50'
  };

  const sentimentIcons = {
    positive: '📈',
    neutral: '➖',
    negative: '📉'
  };

  const categoryColors = {
    'Stocks': 'bg-green-100 text-green-700',
    'IPOs': 'bg-purple-100 text-purple-700',
    'Markets': 'bg-indigo-100 text-indigo-700',
    'Crypto': 'bg-orange-100 text-orange-700',
    'All News': 'bg-blue-100 text-blue-700'
  };

  const impact = news.impact || 'medium';
  const sentiment = news.sentiment || 'neutral';
  const category = news.category || 'All News';

  return (
    <div className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {news.image && (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${categoryColors[category] || categoryColors['All News']}`}>
            {category}
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link to={`/news/${news.id}`} className="group-hover:text-blue-600 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                {news.title}
              </h3>
            </Link>
          </div>

          <span className={`ml-3 px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0 ${impactStyles[impact] || impactStyles.medium}`}>
            {impact.toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
          {news.aiSummary || news.summary}
        </p>

        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center space-x-3">
            <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-semibold ${sentimentStyles[sentiment] || sentimentStyles.neutral}`}>
              <span>{sentimentIcons[sentiment] || '➖'}</span>
              <span>{(sentiment || 'neutral').charAt(0).toUpperCase() + (sentiment || 'neutral').slice(1)}</span>
            </span>

            <span className="text-gray-500 flex items-center space-x-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(news.datetime)}</span>
            </span>
          </div>
        </div>

        {news.tags && news.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {news.tags.slice(0, 4).map((tag, idx) => (
              <span key={tag || idx} className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 hover:border-gray-300 transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="font-medium text-blue-600">{news.source}</span>
          </div>

          <Link
            to={news.url || `/news/${news.id}`}
            target={news.url ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold text-sm group-hover:translate-x-1 transition-transform"
          >
            <span>Read More</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;