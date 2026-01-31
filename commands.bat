@echo off
REM Voclio API - Quick Commands for Windows
REM Usage: commands.bat [command]

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="postman" goto postman
if "%1"=="docs" goto docs
if "%1"=="verify" goto verify
if "%1"=="fix-enums" goto fix-enums
if "%1"=="check-enums" goto check-enums
if "%1"=="start" goto start
if "%1"=="dev" goto dev
if "%1"=="test" goto test
goto unknown

:help
echo.
echo ========================================
echo   Voclio API - Quick Commands
echo ========================================
echo.
echo Usage: commands.bat [command]
echo.
echo Available Commands:
echo.
echo   postman       - Generate Postman collection
echo   docs          - Show available documentation
echo   verify        - Verify all database fixes
echo   fix-enums     - Fix all ENUM types
echo   check-enums   - Check ENUM status
echo   start         - Start server
echo   dev           - Start development server
echo   test          - Run tests
echo   help          - Show this help
echo.
echo Examples:
echo   commands.bat postman
echo   commands.bat verify
echo   commands.bat dev
echo.
goto end

:postman
echo Generating Postman collection...
npm run postman
goto end

:docs
echo.
echo Available Documentation:
echo   - ALL_APIS_COMPLETE.md
echo   - POSTMAN_GUIDE.md
echo   - API_COMPLETE_REFERENCE.md
echo   - MOBILE_APP_API_GUIDE.md
echo   - ADMIN_PANEL_GUIDE.md
echo   - VOICE_TO_EVERYTHING.md
echo   - NOTIFICATION_SYSTEM.md
echo   - DATABASE_FIXES_GUIDE.md
echo   - DOCUMENTATION_INDEX.md
echo.
goto end

:verify
echo Verifying all database fixes...
npm run verify:all
goto end

:fix-enums
echo Fixing all ENUM types...
npm run fix:enums
goto end

:check-enums
echo Checking ENUM status...
npm run check:enums
goto end

:start
echo Starting server...
npm start
goto end

:dev
echo Starting development server...
npm run dev
goto end

:test
echo Running tests...
npm test
goto end

:unknown
echo Unknown command: %1
echo Run "commands.bat help" for available commands
goto end

:end
