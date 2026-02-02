@echo off
echo Starting static file server for OAuth testing...
echo.
echo Privacy Policy: http://localhost:8080/privacy.html
echo Terms of Service: http://localhost:8080/terms.html
echo Google Calendar Tester: http://localhost:8080/test-google-calendar.html
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8080 --directory public
pause