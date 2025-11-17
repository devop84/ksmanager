@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Checking git status...
git status --short
echo.
echo Staging all changes...
git add .
echo.
echo Committing changes...
git commit -m "Update project files"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done!
pause

