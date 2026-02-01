@echo off
echo ========================================
echo  Pinky Dashboard Launcher
echo ========================================
echo.
echo Starting local web server...
echo.

cd /d D:\pinky-workspace\dashboard

REM Check if http-server is installed
where http-server >nul 2>nul
if %errorlevel% neq 0 (
    echo http-server not found! Installing...
    call npm install -g http-server
)

echo.
echo Starting server on http://localhost:8080
echo.
echo Dashboard will open in your browser...
echo Press Ctrl+C to stop the server when done.
echo.

start http://localhost:8080
http-server -p 8080
