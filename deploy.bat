@echo off
echo ==========================================
echo 🚀 Deploying to GitHub...
echo ==========================================

:: Add all changes
echo [1/3] Adding files...
git add .

:: Commit with timestamp
echo [2/3] Committing changes...
set "timestamp=%date% %time%"
git commit -m "Auto-deploy: %timestamp%"

:: Push to remote
echo [3/3] Pushing to remote...
git push

echo ==========================================
echo ✅ Done! Verify build on Netlify/Render.
echo ==========================================
pause
