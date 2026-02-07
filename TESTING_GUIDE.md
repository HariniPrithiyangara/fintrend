# 🧪 FinTrend Testing Guide

## ✅ Manual Testing Checklist

### 1. Backend API Testing

#### Health & Status
- [ ] GET `/api/health` - Returns 200 with status "healthy"
- [ ] GET `/api/status` - Returns system information

#### News Endpoints
- [ ] GET `/api/news/articles` - Returns articles array
- [ ] GET `/api/news/articles?category=Stocks` - Filters by category
- [ ] GET `/api/news/articles?impact=high` - Filters by impact
- [ ] GET `/api/news/articles?q=bitcoin` - Search functionality
- [ ] GET `/api/news/articles?limit=5` - Respects limit parameter
- [ ] GET `/api/news/categories` - Returns category stats
- [ ] GET `/api/news/search?q=market` - Search endpoint
- [ ] GET `/api/news/:id` - Get single article
- [ ] GET `/api/news/fetch` - Manual fetch trigger (dev only)

#### Authentication
- [ ] POST `/api/auth/register` - User registration
- [ ] POST `/api/auth/login` - User login
- [ ] POST `/api/auth/logout` - User logout
- [ ] GET `/api/auth/me` - Get current user (requires auth)

#### Error Cases
- [ ] Invalid routes return 404
- [ ] Missing parameters return 400
- [ ] Invalid auth returns 401
- [ ] Rate limiting works (429 after many requests)

### 2. Frontend UI Testing

#### Authentication Flow
- [ ] Login page loads correctly
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Invalid credentials show error
- [ ] Logout works correctly
- [ ] Protected routes redirect to login

#### Dashboard
- [ ] Dashboard loads with articles
- [ ] Article count displays correctly
- [ ] Categories show in sidebar
- [ ] Category counts are accurate
- [ ] Clicking category filters articles
- [ ] "All News" shows all articles

#### Search & Filters
- [ ] Search bar is visible
- [ ] Typing in search filters articles
- [ ] Search works across title, summary, tags
- [ ] Clear button removes search
- [ ] Search persists across navigation

#### Notifications
- [ ] Notification bell shows count
- [ ] Clicking bell opens dropdown
- [ ] Sentiment breakdown displays correctly
- [ ] High impact events show
- [ ] Time stamps are accurate
- [ ] "View Dashboard" button works

#### Article Display
- [ ] Articles display in cards
- [ ] Sentiment badges show correct color
- [ ] Impact levels display
- [ ] Tags are visible
- [ ] Source attribution present
- [ ] Timestamps formatted correctly
- [ ] Images load (if available)

#### Responsive Design
- [ ] Mobile view works (< 768px)
- [ ] Tablet view works (768px - 1024px)
- [ ] Desktop view works (> 1024px)
- [ ] Sidebar collapses on mobile
- [ ] Search bar responsive
- [ ] Cards stack properly

### 3. Data Flow Testing

#### Complete User Journey
1. [ ] User visits site
2. [ ] Registers account
3. [ ] Logs in
4. [ ] Dashboard loads with articles
5. [ ] Filters by "Crypto" category
6. [ ] Searches for "Bitcoin"
7. [ ] Opens notifications
8. [ ] Views sentiment breakdown
9. [ ] Clicks article to read more
10. [ ] Logs out

#### Data Freshness
- [ ] Articles are recent (check timestamps)
- [ ] Cron job runs on schedule
- [ ] Manual fetch works
- [ ] Firestore data matches API response
- [ ] Frontend displays latest data

### 4. Performance Testing

#### Load Times
- [ ] Dashboard loads < 2 seconds
- [ ] API responses < 500ms
- [ ] Search results instant
- [ ] Category switch smooth
- [ ] No UI freezing

#### Resource Usage
- [ ] No memory leaks (check DevTools)
- [ ] Network requests optimized
- [ ] Images lazy load
- [ ] API calls debounced

### 5. Error Handling

#### Network Errors
- [ ] Offline mode shows message
- [ ] Failed API calls show error
- [ ] Retry mechanism works
- [ ] Loading states display

#### Data Errors
- [ ] Empty state shows when no articles
- [ ] Invalid data handled gracefully
- [ ] Missing fields don't crash app
- [ ] Malformed JSON caught

### 6. Security Testing

#### Authentication
- [ ] JWT tokens expire correctly
- [ ] Refresh token flow works
- [ ] Protected routes secured
- [ ] XSS prevention working
- [ ] CSRF protection enabled

#### Data Validation
- [ ] Input sanitization works
- [ ] SQL injection prevented
- [ ] API rate limiting active
- [ ] CORS configured correctly

---

## 🚀 Quick Test Commands

### Backend
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run unit tests only
npm run test:unit

# Watch mode
npm run test:watch

# Check health
npm run health

# Manual fetch
curl http://localhost:5000/api/news/fetch
```

### Frontend
```bash
# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Test Coverage Goals

- **Backend API**: > 80% coverage
- **Frontend Components**: > 70% coverage
- **Critical Paths**: 100% coverage

---

## 🐛 Common Issues & Fixes

### Backend won't start
- Check `.env` file exists
- Verify Firebase credentials
- Check port 5000 not in use

### No articles showing
- Run `npm run db:check`
- Trigger manual fetch: `GET /api/news/fetch`
- Check Firestore connection

### Frontend not connecting
- Verify `VITE_API_URL` in `.env`
- Check backend is running
- Check CORS settings

### Tests failing
- Run `npm install` in both folders
- Check Firebase mock setup
- Verify test environment variables

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Firebase limits checked
- [ ] API keys secured
- [ ] CORS configured for production
- [ ] Build succeeds
- [ ] Performance optimized
- [ ] Error tracking enabled
- [ ] Logs configured

---

**Last Updated**: 2026-02-07
**Version**: 1.0.0
