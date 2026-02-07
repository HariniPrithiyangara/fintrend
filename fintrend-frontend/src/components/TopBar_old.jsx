// src/components/TopBar.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { fetchNotifications } from '../api/newsApi';
import toast from 'react-hot-toast';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return "just now";
};

const TopBar = ({ user, articleCount = 0 }) => {
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const { setGlobalSearch, currentCategory, globalSearch } = useContext(AppContext);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Sync with global search
  useEffect(() => {
    setSearch(globalSearch);
  }, [globalSearch]);

  // Fetch Notifications (High Impact News)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications(5);
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    clearTimeout(window.searchTimer);
    window.searchTimer = setTimeout(() => {
      setGlobalSearch(value);
    }, 400); // Increased debounce slightly for better UX
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user?.displayName || user?.email || 'User';
  const avatarLetter = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <header className="bg-white backdrop-blur-md bg-opacity-90 border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">

      {/* LEFT — CATEGORY AND ARTICLE COUNT */}
      <div className="hidden md:block space-y-0.5">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          {currentCategory}
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          {articleCount > 0 ? `${articleCount} active signals` : 'Syncing data...'}
        </p>
      </div>

      {/* CENTER — SEARCH */}
      <div className="flex-1 max-w-2xl mx-4 md:mx-12">
        <div className="
          relative
          bg-gray-100 
          focus-within:bg-white
          rounded-xl 
          focus-within:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20
          border border-transparent focus-within:border-blue-500/50
          transition-all duration-200
          group
        ">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search symbols, news, or trends..."
            className="
              w-full pl-12 pr-10 py-3
              text-sm font-medium text-gray-700
              placeholder-gray-400
              focus:outline-none 
              rounded-xl 
              bg-transparent
            "
            value={search}
            onChange={handleSearchChange}
          />

          {/* Search icon */}
          <span className="absolute left-4 top-3 text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {/* Clear button */}
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setGlobalSearch('');
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* RIGHT — NOTIFICATIONS + PROFILE */}
      <div className="flex items-center space-x-3 md:space-x-5">

        {/* 🔔 NOTIFICATION BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className={`
              relative p-2.5 rounded-xl 
              transition-all duration-200
              ${notificationsOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11c0-3.3-1.7-5.3-4-6V4a2 2 0 10-4 0v1C7.7 5.7 6 7.7 6 11v3a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
            </svg>

            {/* Red count badge */}
            {notifications.length > 0 && (
              <span className="
                absolute top-2 right-2 
                bg-red-500 text-white 
                w-2.5 h-2.5 
                rounded-full
                border-2 border-white
              ">
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="
                absolute right-0 mt-4 w-96 
                bg-white rounded-2xl shadow-xl 
                border border-gray-100 z-20
                animate-fadeIn ring-1 ring-black/5
                overflow-hidden
              ">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900">Market Alerts</h3>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No new alerts
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="group px-5 py-4 border-b border-gray-50 hover:bg-blue-50/50 transition cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`
                             text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                             ${n.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                           `}>
                            {n.impact || 'Update'}
                          </span>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">
                            {n.datetime ? timeAgo(n.datetime) : 'now'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                          {n.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button className="text-xs font-semibold text-gray-500 hover:text-gray-900">
                    View All Activity
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 👤 PROFILE BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200
              ${profileOpen ? 'bg-gray-100' : 'hover:bg-gray-50'}
            `}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm object-cover" />
            ) : (
              <div className="
                w-9 h-9 rounded-full 
                bg-gradient-to-br from-indigo-500 to-purple-600 
                text-white flex items-center 
                justify-center text-sm font-bold shadow-sm
              ">
                {avatarLetter}
              </div>
            )}

            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 leading-tight">
                {displayName.split(' ')[0]}
              </span>
            </div>

            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* PROFILE DROPDOWN */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />

              <div className="
                absolute right-0 mt-3 w-64 
                bg-white rounded-2xl shadow-xl 
                border border-gray-100 z-20
                animate-fadeIn ring-1 ring-black/5
                overflow-hidden
              ">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </Link>

                  <Link
                    to="/dashboard"
                    className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                </div>

                <div className="border-t border-gray-50 py-2">
                  <button
                    onClick={handleLogout}
                    className="
                      w-full text-left px-5 py-3 
                      text-sm text-red-600 font-medium
                      hover:bg-red-50 transition-colors flex items-center
                    "
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  );
};

export default TopBar;
