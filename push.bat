@echo off
set /p msg="Menambahkan README.md"
if "%msg%"=="" set msg="Update code"

echo Adding files...
git add .

echo Committing...
git commit -m "%msg%"

echo Pushing to GitHub...
git push origin main

echo Done!
pause
