// src/pages/Dashboard.jsx
import React, { useState, useContext, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import NewsCard from '../components/NewsCard';
import ChartPanel from '../components/ChartPanel';
import { fetchNews } from '../api/newsApi.js';
import apiClient from '../api/index.js';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const { currentCategory, globalSearch } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode((prev) => !prev);
        console.log('🐛 Debug Mode:', !debugMode ? 'ENABLED' : 'DISABLED');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [debugMode]);

  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory, globalSearch]);

  const loadNews = async () => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNews(globalSearch, currentCategory);
      const loadTime = Date.now() - startTime;

      setDebugInfo({
        category: currentCategory,
        search: globalSearch,
        count: data.length,
        loadTime,
        timestamp: new Date().toISOString()
      });

      setNews(data);
    } catch (err) {
      console.error('❌ Load news error:', err);
      setError('Failed to load news. Please try again.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} articleCount={0} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 font-medium">Loading {currentCategory}...</p>
                {debugMode && (
                  <div className="text-xs text-gray-400 font-mono">
                    Category: {currentCategory} <br />
                    Search: {globalSearch || 'none'} <br />
                    Time: {new Date().toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} articleCount={news.length} />

        <main className="flex-1 overflow-y-auto p-6">
          {debugMode && debugInfo && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-yellow-900 flex items-center">🐛 DEBUG MODE</h3>
                <button onClick={() => setDebugMode(false)} className="text-xs text-yellow-700 hover:text-yellow-900">
                  Close (Ctrl+Shift+D)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-yellow-700">Category:</span>
                  <p className="font-bold text-yellow-900">{debugInfo.category}</p>
                </div>
                <div>
                  <span className="text-yellow-700">Search:</span>
                  <p className="font-bold text-yellow-900">{debugInfo.search || 'none'}</p>
                </div>
                <div>
                  <span className="text-yellow-700">Articles:</span>
                  <p className="font-bold text-yellow-900">{debugInfo.count}</p>
                </div>
                <div>
                  <span className="text-yellow-700">Load Time:</span>
                  <p className="font-bold text-yellow-900">{debugInfo.loadTime}ms</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-yellow-300">
                <button
                  onClick={async () => {
                    try {
                      const response = await apiClient.get('/news/debug');
                      // eslint-disable-next-line no-console
                      console.log('🐛 Backend Debug Data:', response.data);
                      alert('Check console for backend debug data');
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error('Debug fetch error:', err);
                      alert('Debug fetch failed - see console');
                    }
                  }}
                  className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded font-semibold hover:bg-yellow-500"
                >
                  Fetch Backend Debug Data
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentCategory}</h2>
            <p className="text-gray-600">
              {news.length > 0 ? `${news.length} articles found • Stay updated with the latest trends` : 'No articles available yet'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>

              <button onClick={loadNews} className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium underline">
                Try Again
              </button>
            </div>
          )}

          <ChartPanel />

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Latest Articles</h3>

              {news.length > 0 && (
                <button onClick={loadNews} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((article) => <NewsCard key={article.id} news={article} />)}
              </div>
            ) : (
              <EmptyState category={currentCategory} onRetry={loadNews} debugMode={debugMode} />
            )}
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
          <p className="text-sm text-gray-500">© 2024 FinTrend • AI-Powered Financial News {debugMode && (<span className="ml-2 text-yellow-600 font-mono">🐛 DEBUG</span>)}</p>
        </footer>
      </div>
    </div>
  );
};

const EmptyState = ({ category, onRetry, debugMode }) => {
  const isAllNews = category === 'All News';

  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-300">
      <div className="mb-6">
        <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3">No {category} Articles Found</h3>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {isAllNews ? 'The system is fetching the latest market updates. This happens automatically every hour.' : <>No articles yet in <strong>{category}</strong>. Try switching to <strong>All News</strong>.</>}
      </p>

      {debugMode && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-left max-w-md mx-auto">
          <p className="text-xs font-mono text-yellow-900">
            <strong>Debug:</strong><br />
            • Category: {category}<br />
            • Check sidebar count<br />
            • Check backend logs<br />
            • Firestore index status<br />
          </p>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4">
        <button onClick={onRetry} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Now</span>
        </button>

        {!isAllNews && (
          <button onClick={() => (window.location.href = '/dashboard')} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            View All News
          </button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">💡 Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Shift+D</kbd> for debug</p>
      </div>
    </div>
  );
};

export default Dashboard;
