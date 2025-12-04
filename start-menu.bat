@echo off
:: Voclio API - Quick Start Menu
:: This helps you run common tasks easily

:menu
cls
echo.
echo ================================================
echo    VOCLIO API - Quick Start Menu
echo ================================================
echo.
echo  1. Test Database Connection
echo  2. Initialize Database (Create Tables)
echo  3. Start Development Server
echo  4. Start Production Server
echo  5. Install Dependencies
echo  6. Open README
echo  7. Open Postman Collection Folder
echo  8. Exit
echo.
echo ================================================
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto testdb
if "%choice%"=="2" goto initdb
if "%choice%"=="3" goto dev
if "%choice%"=="4" goto prod
if "%choice%"=="5" goto install
if "%choice%"=="6" goto readme
if "%choice%"=="7" goto postman
if "%choice%"=="8" goto end

echo Invalid choice! Please try again.
timeout /t 2 >nul
goto menu

:testdb
cls
echo.
echo Testing Database Connection...
echo.
call npm run test-db
echo.
pause
goto menu

:initdb
cls
echo.
echo Initializing Database (Creating Tables)...
echo.
echo WARNING: This will create all tables in the database.
echo.
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    call npm run init-db
) else (
    echo Operation cancelled.
)
echo.
pause
goto menu

:dev
cls
echo.
echo Starting Development Server...
echo.
echo The server will auto-reload when you make changes.
echo Press Ctrl+C to stop the server.
echo.
call npm run dev
pause
goto menu

:prod
cls
echo.
echo Starting Production Server...
echo.
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
goto menu

:install
cls
echo.
echo Installing Dependencies...
echo.
call npm install
echo.
echo Dependencies installed!
pause
goto menu

:readme
cls
echo Opening README...
start README.md
goto menu

:postman
cls
echo Opening Postman Collection folder...
explorer .
goto menu

:end
cls
echo.
echo Thank you for using Voclio API!
echo.
exit
