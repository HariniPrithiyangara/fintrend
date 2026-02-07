// src/pages/NewsDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { AuthContext } from '../context/AuthContext';
import { fetchArticleById } from '../api/newsAPI';
import formatDate from '../utils/formatDate';

const NewsDetail = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadArticle() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticleById(id);
      if (!data) {
        setError('Article not found');
        setArticle(null);
      } else {
        setArticle(data);
      }
    } catch (err) {
      console.error('NewsDetail loadArticle error', err);
      setError('Failed to load article. Please try again.');
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} articleCount={1} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2 pt-6">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} articleCount={0} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-16 w-16 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
                <p className="text-gray-600 mb-6">{error || "The article you're looking for doesn't exist or has been removed."}</p>
                <div className="flex items-center justify-center space-x-4">
                  <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Back to Dashboard</button>
                  <button onClick={loadArticle} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200">Try Again</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const sentimentColors = {
    positive: 'text-green-600 bg-green-50',
    neutral: 'text-gray-600 bg-gray-50',
    negative: 'text-red-600 bg-red-50'
  };

  const sentimentIcons = {
    positive: '📈',
    neutral: '➖',
    negative: '📉'
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} articleCount={1} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium group">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>

            <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {article.image && (
                <div className="relative h-64 md:h-96 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}

              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{article.category}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${impactColors[article.impact] || impactColors.medium}`}>{article.impact?.toUpperCase()} IMPACT</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${sentimentColors[article.sentiment] || sentimentColors.neutral}`}><span>{sentimentIcons[article.sentiment] || '➖'}</span><span>{article.sentiment?.charAt(0).toUpperCase() + article.sentiment?.slice(1)}</span></span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6 pb-6 border-b">
                  <div className="flex items-center space-x-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg><span className="font-medium text-blue-600">{article.source}</span></div>
                  <div className="flex items-center space-x-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{formatDate(article.date)}</span></div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">{article.summary || article.content}</p>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => (
                        <span key={tag || idx} className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {article.url && (
                  <div className="mt-8 pt-6 border-t">
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                      <span>Read Full Article</span>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                )}
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewsDetail;
