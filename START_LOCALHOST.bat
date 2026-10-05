@echo off
title REALYZE Local Server
cd /d "%~dp0"

echo.
echo ============================================
echo   REALYZE - LOCAL WEB SERVER
echo ============================================
echo.

where py >nul 2>nul
if %errorlevel%==0 (
    echo Starting with Python launcher...
    start "" "http://localhost:5500/admin.html"
    py -m http.server 5500
    goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo Starting with Python...
    start "" "http://localhost:5500/admin.html"
    python -m http.server 5500
    goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo Starting with Node / npx...
    start "" "http://localhost:5500/admin.html"
    npx --yes http-server -p 5500 -c-1
    goto :eof
)

echo.
echo ERROR: Khong tim thay Python hoac Node.js.
echo.
echo Cach nhanh nhat:
echo 1. Mo folder nay bang VS Code
echo 2. Cai extension "Live Server"
echo 3. Right click index.html ^> Open with Live Server
echo.
pause
