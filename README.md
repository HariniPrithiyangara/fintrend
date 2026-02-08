# FinTrend
Real-time financial news intelligence platform with AI sentiment analysis.

[![Live Demo](https://img.shields.io/badge/Live_Demo-fintrendai.vercel.app-blue?style=for-the-badge&logo=vercel)](https://fintrendai.vercel.app/)

## Project Overview
Investors and market enthusiasts often struggle with financial information overload. **FinTrend** solves this by aggregating real-time news from global sources and applying AI-powered sentiment analysis to highlight market impact. It enables users to make informed decisions quickly through categorized insights, meaningful trend tracking, and impact-based filtering.

## Features
- **Real-time news aggregation**: Fetches latest financial news continuously.
- **AI sentiment analysis**: Evaluates news tone (Positive, Negative, Neutral) using OpenRouter LLMs.
- **Category filtering**: Smart classification into Stocks, Crypto, IPOs, and Mergers.
- **Full-text search**: Instant search across all news articles.
- **Authentication**: Secure user login/signup via Firebase.
- **Impact scoring**: Filtering based on market impact (High/Medium/Low).

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Vite, Axios, Firebase SDK
- **Backend**: Node.js, Express.js, Firebase Admin SDK
- **Database**: Cloud Firestore (NoSQL)
- **AI/ML**: OpenRouter API (LLM Integration for Sentiment)
- **External APIs**: Finnhub (Financial Data)
- **DevOps**: Vercel (Frontend), Render (Backend)

## Project Structure
```
fintrend/
├── fintrend-frontend/          # React Client Application
│   ├── src/
│   │   ├── api/                # API connection services
│   │   ├── components/         # Reusable UI Components
│   │   ├── context/            # Auth & Application State
│   │   └── pages/              # Application Pages
│
├── Project_Trendboard_backend/ # Express Server Application
│   └── fintrend-backend/
│       ├── src/
│       │   ├── controllers/    # Request Handling Logic
│       │   ├── jobs/           # Cron Jobs for Data Fetching
│       │   ├── services/       # Business Logic & AI Integration
│       │   └── routes/         # API Endpoint Definitions
│
└── README.md
```

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/HariniPrithiyangara/fintrend.git
cd fintrend
```

### 2. Backend Setup
```bash
cd Project_Trendboard_backend/fintrend-backend
npm install
# Configure necessary environment variables
npm run dev
```

### 3. Frontend Setup
```bash
cd ../../fintrend-frontend
npm install
# Configure necessary environment variables
npm run dev
```

## Environment Variables
Create `.env` files in the respective directories with the following configurations:

**Backend (`Project_Trendboard_backend/fintrend-backend/.env`)**
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
FINNHUB_API_KEY=your_finnhub_key
OPENROUTER_API_KEY=your_openrouter_key
FRONTEND_URL=http://localhost:5173
```

**Frontend (`fintrend-frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## API Endpoints
- `GET /api/news/articles` - Retrieves paginated list of news articles.
- `GET /api/news/categories` - Retrieves news count statistics by category.
- `GET /api/analytics/sentiment` - Retrieves sentiment analysis distribution.
- `POST /api/auth/register` - Registers a new user via the backend (optional, usually handled by client SDK).

## Testing
To run the backend test suite:
```bash
cd Project_Trendboard_backend/fintrend-backend
npm test
```

## Deployment
- **Frontend**: [Vercel](https://fintrendai.vercel.app/)
- **Backend**: [Render](https://render.com)

## Security Considerations
- **Firebase Auth**: Verifies user identity tokens on protected routes.
- **Helmet & CORS**: Implements standard security headers and strictly controlled cross-origin resource sharing.
- **Input Validation**: Sanitizes inputs to prevent injection attacks.
- **Rate Limiting**: Protects API endpoints from excessive request traffic.

## Future Improvements
- **Personalized Watchlists**: Allow users to pin specific stocks or sectors.
- **Real-time WebSocket Alerts**: Push notifications for high-impact news events.
- **Recommendation Engine**: Suggest articles based on reading history.

## Author
**Harini Prithiyangara**
- [GitHub](https://github.com/HariniPrithiyangara)
