// src/pages/Search.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchNews } from '../api/newsAPI';
import NewsCard from '../components/NewsCard';

const SearchPage = () => {
  const { globalSearch, currentCategory } = useContext(AppContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNews(globalSearch, currentCategory).then(data => {
      if (!mounted) return;
      setResults(data);
      setLoading(false);
    }).catch(err => {
      console.error('SearchPage fetch failed', err);
      if (!mounted) return;
      setResults([]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [globalSearch, currentCategory]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Search Results for: <span className="text-blue-600">{globalSearch || 'All'}</span></h2>
      {loading ? (
        <p className="text-gray-500">Searching...</p>
      ) : results.length === 0 ? (
        <p className="text-gray-500">No results found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(item => <NewsCard key={item.id} news={item} />)}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
