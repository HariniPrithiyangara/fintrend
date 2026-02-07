// ============================================
// SIDEBAR - CATEGORY NAVIGATION
// NO HARDCODING
// ============================================

import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { fetchCategoryStats } from '../api/newsApi';

const CATEGORY_CONFIG = [
  { id: 'all-news', label: 'All News', category: 'All News', icon: '📂', description: 'View all financial news', color: 'blue' },
  { id: 'stocks', label: 'Stocks', category: 'Stocks', icon: '📈', description: 'Stock market updates', color: 'green' },
  { id: 'ipos', label: 'IPOs', category: 'IPOs', icon: '🎯', description: 'Initial public offerings', color: 'purple' },
  { id: 'crypto', label: 'Crypto', category: 'Crypto', icon: '₿', description: 'Cryptocurrency news', color: 'orange' }
];

const Sidebar = () => {
  const { currentCategory, setCurrentCategory } = useContext(AppContext);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const loadCounts = async () => {
    setLoading(true);
    try {
      const stats = await fetchCategoryStats();
      setCategoryCounts(stats || {});
    } catch (err) {
      console.error('Failed to fetch category stats:', err);
      setCategoryCounts({});
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setCurrentCategory(category);
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          flex flex-col h-screen shadow-lg
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FinTrend</h1>
              <p className="text-xs text-gray-600 font-medium">AI News Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3 px-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</p>
              {loading && <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>}
            </div>

            {CATEGORY_CONFIG.map((item) => {
              const isActive = currentCategory === item.category;
              const count = categoryCounts[item.category] || 0;
              return (
                <CategoryItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  count={count}
                  onClick={() => handleCategoryClick(item.category)}
                />
              );
            })}
          </div>

          <div className="my-6 border-t border-gray-200" />

          <Link
            to="/profile"
            className={`
              flex items-center px-3 py-2.5 rounded-xl text-sm font-medium
              ${location.pathname === '/profile' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <span className="mr-3 text-lg">⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="text-xs text-gray-600 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="font-semibold">Real-time Updates</p>
            </div>
            <p className="text-gray-500">Last synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm" onClick={() => setIsCollapsed(true)} />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
};

const CategoryItem = ({ item, isActive, count, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-white',
    green: 'from-green-500 to-green-600 text-white',
    purple: 'from-purple-500 to-purple-600 text-white',
    indigo: 'from-indigo-500 to-indigo-600 text-white',
    orange: 'from-orange-500 to-orange-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all
        ${isActive ? `bg-gradient-to-r ${colorClasses[item.color]} shadow-md` : 'text-gray-700 hover:bg-gray-50'}
      `}
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </div>

      {count > 0 && (
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white bg-opacity-30' : 'bg-blue-100 text-blue-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default Sidebar;