// ============================================
// APP CONTEXT - GLOBAL STATE MANAGEMENT
// NO HARDCODING
// ============================================

import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext({
  currentCategory: 'All News',
  globalSearch: '',
  setCurrentCategory: () => {},
  setGlobalSearch: () => {}
});

export const AppProvider = ({ children }) => {
  const [currentCategory, setCurrentCategory] = useState('All News');
  const [globalSearch, setGlobalSearch] = useState('');

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('appState');
      if (saved) {
        const { currentCategory: savedCategory, globalSearch: savedSearch } = JSON.parse(saved);
        if (savedCategory) setCurrentCategory(savedCategory);
        if (savedSearch) setGlobalSearch(savedSearch);
      }
    } catch (error) {
      console.error('Error loading app state:', error);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('appState', JSON.stringify({ 
        currentCategory, 
        globalSearch 
      }));
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }, [currentCategory, globalSearch]);

  const value = {
    currentCategory,
    setCurrentCategory,
    globalSearch,
    setGlobalSearch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;