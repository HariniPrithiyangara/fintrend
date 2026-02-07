@echo off
echo ============================================
echo 🚀 PROJECT FIN_TREND - STARTUP SCRIPT
echo ============================================

echo.
echo 1. Starting Backend Server (Port 5000)...
start "FinTrend Backend" /d "Project_Trendboard_backend\fintrend-backend" cmd /k "npm run dev"

echo.
echo 2. Starting Frontend (Port 5173)...
start "FinTrend Frontend" /d "fintrend-frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo ✅ Both services started!
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo ============================================
echo.
pause
