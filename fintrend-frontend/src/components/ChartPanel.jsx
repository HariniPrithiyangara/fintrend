// ============================================
// CHART PANEL - ANALYTICS DASHBOARD
// NO HARDCODING - Fetches data per category
// ============================================

import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchTrends, fetchSentiment, fetchSectors, fetchMentions } from '../api/analyticsApi';

const ChartPanel = () => {
  const { currentCategory } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    trends: { topics: [], volumes: [] },
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    sectors: [],
    mentions: { labels: [], data: [] }
  });

  useEffect(() => {
    loadAnalytics();
  }, [currentCategory]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics in parallel
      const [trends, sentiment, sectors, mentions] = await Promise.allSettled([
        fetchTrends(currentCategory),
        fetchSentiment(currentCategory),
        fetchSectors(currentCategory),
        fetchMentions(currentCategory)
      ]).then(results =>
        results.map(result =>
          result.status === 'fulfilled' ? result.value : null
        )
      );

      setAnalytics({
        trends: trends || { topics: [], volumes: [] },
        sentiment: sentiment || { positive: 0, neutral: 0, negative: 0 },
        sectors: sectors || [],
        mentions: mentions || { labels: [], data: [] }
      });
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p className="text-red-800 text-sm">{error}</p>
        <button onClick={loadAnalytics} className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Sentiment Score"
          value={`${analytics.sentiment.positive}%`}
          subtitle="Positive Articles"
          color="green"
          icon="📈"
        />
        <SummaryCard
          title="Total Coverage"
          value={analytics.trends.volumes.reduce((a, b) => a + b, 0)}
          subtitle="Articles Analyzed"
          color="blue"
          icon="📰"
        />
        <SummaryCard
          title="Active Sectors"
          value={analytics.sectors.length}
          subtitle="Sectors Tracked"
          color="purple"
          icon="🏢"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Topics */}
        <ChartCard title="Trending Topics" subtitle={`Most mentioned in ${currentCategory}`}>
          <TrendingTopicsChart data={analytics.trends} />
        </ChartCard>

        {/* Sentiment Distribution */}
        <ChartCard title="Sentiment Distribution" subtitle="Overall market mood">
          <SentimentChart data={analytics.sentiment} />
        </ChartCard>

        {/* Sector Performance */}
        <ChartCard title="Sector Performance" subtitle="Sentiment by sector">
          <SectorList sectors={analytics.sectors} />
        </ChartCard>

        {/* Mentions Trend */}
        <ChartCard title="Article Volume" subtitle="Last 7 days">
          <MentionsChart data={analytics.mentions} />
        </ChartCard>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, color, icon }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${colorClasses[color]?.split(' ')[0] || 'text-gray-900'} mb-1`}>
        {value}
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};

// Chart Card Container
const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    {children}
  </div>
);

// Trending Topics Bar Chart
const TrendingTopicsChart = ({ data }) => {
  const maxVolume = Math.max(...data.volumes, 1);

  return (
    <div className="space-y-3">
      {data.topics.map((topic, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 truncate">{topic}</span>
            <span className="text-gray-500 ml-2">{data.volumes[i]}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(data.volumes[i] / maxVolume) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.topics.length === 0 && (
        <p className="text-gray-400 text-center py-8">No trending topics yet</p>
      )}
    </div>
  );
};

// Sentiment Chart
const SentimentChart = ({ data }) => {
  const sentiments = [
    { label: 'Positive', value: data.positive, color: 'bg-green-500', icon: '😊' },
    { label: 'Neutral', value: data.neutral, color: 'bg-gray-400', icon: '😐' },
    { label: 'Negative', value: data.negative, color: 'bg-red-500', icon: '😟' }
  ];

  return (
    <div className="space-y-4">
      {sentiments.map((sentiment, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{sentiment.icon}</span>
              <span className="font-medium text-gray-700">{sentiment.label}</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{sentiment.value}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`${sentiment.color} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${sentiment.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Sector Performance List
const SectorList = ({ sectors }) => {
  return (
    <div className="space-y-3">
      {sectors.slice(0, 6).map((sector, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${sector.color === 'green' ? 'bg-green-500' :
                sector.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            <div>
              <p className="font-medium text-gray-900">{sector.name}</p>
              {sector.articles && (
                <p className="text-xs text-gray-500">{sector.articles} articles</p>
              )}
            </div>
          </div>
          <span className={`text-sm font-semibold ${sector.color === 'green' ? 'text-green-600' :
              sector.color === 'red' ? 'text-red-600' : 'text-gray-600'
            }`}>
            {sector.change}
          </span>
        </div>
      ))}
      {sectors.length === 0 && (
        <p className="text-gray-400 text-center py-8">No sector data available</p>
      )}
    </div>
  );
};

// Mentions Line Chart
const MentionsChart = ({ data }) => {
  const maxMentions = Math.max(...data.data, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-40 space-x-2">
        {data.labels.map((label, i) => {
          const height = (data.data[i] / maxMentions) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${label}: ${data.data[i]} articles`}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <span>Min: {Math.min(...data.data)}</span>
        <span>Max: {Math.max(...data.data)}</span>
        <span>Avg: {Math.round(data.data.reduce((a, b) => a + b, 0) / data.data.length)}</span>
      </div>
    </div>
  );
};

export default ChartPanel;