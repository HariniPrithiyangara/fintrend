# 🚀 FinTrend Deployment Guide

Complete guide for deploying FinTrend to production.

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Firebase project created
- [ ] API keys obtained (Finnhub, OpenRouter)
- [ ] Code pushed to GitHub
- [ ] `.env` files NOT committed (in `.gitignore`)

---

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)
**Recommended for beginners**

### Option 2: Vercel (Frontend) + Railway (Backend)
**Good for free tier**

### Option 3: Netlify (Frontend) + Render (Backend)
**Alternative option**

---

## 📦 STEP 1: Prepare Repository

### 1.1 Organize Structure

Your repo should look like:
```
fintrend/
├── frontend/           # React app
├── backend/            # Node.js API
├── README.md
├── .gitignore
└── docs/
```

### 1.2 Create `.gitignore`

Already created! Make sure it includes:
- `node_modules/`
- `.env`
- `dist/`
- `coverage/`

### 1.3 Push to GitHub

```bash
cd Project_Trendboard

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: FinTrend AI News Platform"

# Create main branch
git branch -M main

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/fintrend.git

# Push
git push -u origin main
```

---

## 🎨 STEP 2: Deploy Frontend (Vercel)

### 2.1 Go to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"

### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Select your `fintrend` repository
3. Click "Import"

### 2.3 Configure Build Settings

**Framework Preset**: Vite

**Root Directory**: `fintrend-frontend` (or `frontend` if you renamed)

**Build Command**: 
```bash
npm run build
```

**Output Directory**: 
```
dist
```

**Install Command**: 
```bash
npm install
```

### 2.4 Add Environment Variables

Click "Environment Variables" and add:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2.5 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your URL: `https://fintrend-xyz.vercel.app`

---

## ⚙️ STEP 3: Deploy Backend (Render)

### 3.1 Go to Render

1. Visit [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"

### 3.2 Connect Repository

1. Select your `fintrend` repository
2. Click "Connect"

### 3.3 Configure Service

**Name**: `fintrend-backend`

**Region**: Choose closest to you

**Branch**: `main`

**Root Directory**: `Project_Trendboard_backend/fintrend-backend` (or `backend`)

**Runtime**: `Node`

**Build Command**: 
```bash
npm install
```

**Start Command**: 
```bash
npm start
```

**Instance Type**: `Free`

### 3.4 Add Environment Variables

Click "Environment" → "Add Environment Variable":

```env
NODE_ENV=production
PORT=5000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key-with-newlines
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# APIs
FINNHUB_API_KEY=your-finnhub-key
OPENROUTER_API_KEY=your-openrouter-key

# Firestore Limits
FIRESTORE_MAX_READS_PER_DAY=49000
FIRESTORE_MAX_WRITES_PER_DAY=19000
FIRESTORE_MAX_DELETES_PER_DAY=19000

# Cron
CRON_ENABLE=true
CRON_SCHEDULE=0 */6 * * *
CRON_RUN_INITIAL=true

# OpenRouter
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_TEMPERATURE=0.3
OPENROUTER_MAX_TOKENS=150
```

**Important**: For `FIREBASE_PRIVATE_KEY`, replace `\n` with actual newlines.

### 3.5 Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for first deploy
3. Get your URL: `https://fintrend-backend.onrender.com`

### 3.6 Update Frontend

Go back to Vercel:
1. Settings → Environment Variables
2. Update `VITE_API_URL` to your Render URL
3. Redeploy frontend

---

## 🔥 STEP 4: Configure Firebase

### 4.1 Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Firestore Database → Create Database
4. Start in **production mode**
5. Choose location

### 4.2 Set Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /news_articles/{article} {
      allow read: if true;
      allow write: if false;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4.3 Enable Authentication

1. Authentication → Get Started
2. Enable "Email/Password"
3. (Optional) Enable Google Sign-In

---

## ✅ STEP 5: Verify Deployment

### 5.1 Test Backend

```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T..."
}
```

### 5.2 Test Frontend

1. Visit your Vercel URL
2. Check console for errors
3. Try logging in
4. Verify articles load

### 5.3 Test Full Flow

1. Register new account
2. Login
3. View dashboard
4. Search articles
5. Filter by category
6. Check notifications

---

## 🐛 Common Issues & Fixes

### Issue 1: CORS Error

**Problem**: Frontend can't connect to backend

**Fix**: Add to `backend/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true
}));
```

### Issue 2: Environment Variables Not Working

**Problem**: `undefined` errors

**Fix**: 
- Vercel: Prefix with `VITE_`
- Render: Restart service after adding vars

### Issue 3: Firebase Private Key Error

**Problem**: Authentication fails

**Fix**: In Render, use actual newlines in private key:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
(actual newlines, not \n)
-----END PRIVATE KEY-----
```

### Issue 4: Build Fails

**Problem**: Build command fails

**Fix**: Check `package.json` scripts match deployment settings

### Issue 5: API Not Fetching Articles

**Problem**: No articles in dashboard

**Fix**: 
1. Check backend logs in Render
2. Verify Finnhub API key
3. Manually trigger: `GET /api/news/fetch`

---

## 📊 Post-Deployment

### Monitor Performance

**Vercel**:
- Analytics → View metrics
- Check build times
- Monitor bandwidth

**Render**:
- Metrics → View CPU/Memory
- Logs → Check for errors
- Events → Deployment history

### Set Up Monitoring

1. **Sentry** (Error tracking)
   ```bash
   npm install @sentry/react @sentry/node
   ```

2. **LogRocket** (Session replay)
   ```bash
   npm install logrocket
   ```

### Enable HTTPS

Both Vercel and Render provide free SSL certificates automatically.

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push

**Vercel**: Automatically deploys on `git push`

**Render**: Automatically deploys on `git push`

### Manual Deploy

**Vercel**: Dashboard → Deployments → Redeploy

**Render**: Dashboard → Manual Deploy → Deploy Latest Commit

---

## 💰 Cost Breakdown

### Free Tier Limits

**Vercel**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains

**Render**:
- ✅ 750 hours/month (free instance)
- ⚠️ Spins down after 15min inactivity
- ✅ Auto-wake on request

**Firebase**:
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ 1GB storage

**Total Cost**: $0/month (within limits)

---

## 🚀 Production Optimizations

### 1. Enable Caching

```javascript
// backend/server.js
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### 2. Compress Responses

```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

---

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `.env` files in `.gitignore`
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] Firebase Firestore enabled
- [ ] Firebase Auth enabled
- [ ] CORS configured
- [ ] Health check passing
- [ ] Articles loading
- [ ] Search working
- [ ] Notifications working
- [ ] Mobile responsive
- [ ] SSL enabled
- [ ] Custom domain (optional)

---

## 🎉 You're Live!

Your FinTrend app is now deployed and accessible worldwide!

**Frontend**: `https://fintrend-xyz.vercel.app`  
**Backend**: `https://fintrend-backend.onrender.com`

---

**Need help?** Check the [README.md](../README.md) or create an issue on GitHub.
