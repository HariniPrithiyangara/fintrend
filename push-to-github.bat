@echo off
echo ========================================
echo   FINTREND - GITHUB PUSH SCRIPT
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/6] Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [2/6] Initializing Git repository...
git init
if errorlevel 1 (
    echo Git already initialized
)
echo.

echo [3/6] Adding all files...
git add .
echo.

echo [4/6] Creating commit...
git commit -m "Initial commit: FinTrend AI-Powered Financial News Platform"
if errorlevel 1 (
    echo Note: No changes to commit or already committed
)
echo.

echo [5/6] Setting main branch...
git branch -M main
echo.

echo ========================================
echo   IMPORTANT: GitHub Repository Setup
echo ========================================
echo.
echo Please follow these steps:
echo.
echo 1. Go to https://github.com/new
echo 2. Repository name: fintrend
echo 3. Description: AI-Powered Financial News Intelligence
echo 4. Make it Public (for portfolio)
echo 5. DO NOT initialize with README
echo 6. Click "Create repository"
echo.
echo 7. Copy the repository URL (looks like):
echo    https://github.com/YOUR_USERNAME/fintrend.git
echo.
pause

echo.
echo [6/6] Adding remote and pushing...
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "

git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED - Possible Solutions:
    echo ========================================
    echo.
    echo 1. Make sure you're logged into GitHub
    echo 2. Check if the repository URL is correct
    echo 3. Try: git push -u origin main --force
    echo.
    echo Run this command manually:
    echo git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Code pushed to GitHub
echo ========================================
echo.
echo Your repository: %REPO_URL%
echo.
echo Next steps:
echo 1. Visit your GitHub repository
echo 2. Check that all files are there
echo 3. Follow DEPLOYMENT.md for deployment
echo.
echo Ready to deploy to:
echo - Frontend: Vercel (vercel.com)
echo - Backend: Render (render.com)
echo.
pause
