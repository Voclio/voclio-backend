# 🪟 Windows Quick Guide

## 🚀 Quick Commands

Since `make` is not available on Windows, use these alternatives:

### Option 1: NPM Scripts (Recommended)
```bash
npm run postman          # Generate Postman collection
npm run docs             # Show documentation list
npm run verify:all       # Verify all fixes
npm run fix:enums        # Fix ENUM types
npm run check:enums      # Check ENUM status
npm run start            # Start server
npm run dev              # Development mode
npm test                 # Run tests
```

### Option 2: Batch File
```bash
commands.bat postman     # Generate Postman collection
commands.bat docs        # Show documentation
commands.bat verify      # Verify all fixes
commands.bat fix-enums   # Fix ENUM types
commands.bat check-enums # Check ENUM status
commands.bat start       # Start server
commands.bat dev         # Development mode
commands.bat test        # Run tests
commands.bat help        # Show all commands
```

### Option 3: Direct Commands
```bash
node generate-postman-collection.js    # Generate Postman
node verify-all-fixes.js               # Verify fixes
node fix-all-enums.js                  # Fix ENUMs
node check-enum-status.js              # Check ENUMs
node server.js                         # Start server
```

---

## 📋 All Available NPM Scripts

### Database Fixes
```bash
npm run fix:enums              # Fix all ENUM types
npm run fix:timestamps         # Fix all timestamps
npm run migrate:notifications  # Fix notifications schema
npm run migrate:fix            # Run schema fixes
npm run migrate:enums          # Migrate ENUMs
```

### Verification
```bash
npm run verify:all        # Verify all fixes
npm run check:enums       # Check ENUM status
npm run check:categories  # Check categories
npm run test-db           # Test database connection
```

### Development
```bash
npm start                 # Start production server
npm run dev               # Start development server (nodemon)
npm run init-db           # Initialize database
```

### Testing
```bash
npm test                      # Run all tests
npm run test:voice            # Test voice processing
npm run test:notifications    # Test notifications
npm run test:unit             # Unit tests
npm run test:integration      # Integration tests
npm run test:coverage         # Coverage report
```

### Documentation
```bash
npm run postman           # Generate Postman collection
npm run docs              # Show documentation list
```

### Docker
```bash
npm run docker:build      # Build Docker image
npm run docker:up         # Start containers
npm run docker:down       # Stop containers
npm run docker:logs       # View logs
```

---

## 🔧 Setup on Windows

### 1. Install Prerequisites
```bash
# Install Node.js (v18+)
# Download from: https://nodejs.org/

# Install PostgreSQL
# Download from: https://www.postgresql.org/download/windows/

# Verify installations
node --version
npm --version
psql --version
```

### 2. Clone & Setup
```bash
# Clone repository
git clone <repository-url>
cd voclio-api

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env with your settings
notepad .env
```

### 3. Database Setup
```bash
# Initialize database
npm run init-db

# Fix ENUM types
npm run fix:enums

# Verify everything
npm run verify:all
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Or production mode
npm start
```

---

## 🐛 Common Windows Issues

### Issue 1: Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process
taskkill /F /PID <PID>
```

### Issue 2: PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
sc query postgresql-x64-14

# Start PostgreSQL service
net start postgresql-x64-14

# Or use Services app (services.msc)
```

### Issue 3: Permission Denied
```bash
# Run PowerShell as Administrator
# Right-click PowerShell → Run as Administrator
```

### Issue 4: Script Execution Policy
```bash
# If you get execution policy error
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 5: Node Modules Issues
```bash
# Clear and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 📝 PowerShell vs CMD

### PowerShell (Recommended)
```powershell
# Better for development
npm run dev
npm run postman
npm run verify:all
```

### CMD
```cmd
# Also works
npm run dev
npm run postman
npm run verify:all
```

---

## 🎯 Quick Start Workflow

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
copy .env.example .env
notepad .env

# 3. Initialize database
npm run init-db

# 4. Fix database issues
npm run fix:enums
npm run verify:all

# 5. Start server
npm run dev
```

### Daily Development
```bash
# 1. Start server
npm run dev

# 2. Generate Postman collection (if needed)
npm run postman

# 3. Test APIs in Postman
# Import: Voclio_Complete_APIs_2026.postman_collection.json
```

---

## 📦 Alternative: Use WSL (Windows Subsystem for Linux)

If you want to use `make` commands:

### Install WSL
```bash
# In PowerShell (as Administrator)
wsl --install

# Restart computer

# Install Ubuntu from Microsoft Store
```

### Use Make in WSL
```bash
# Open WSL terminal
wsl

# Navigate to project
cd /mnt/e/bp/back

# Use make commands
make postman
make verify
make dev
```

---

## 🔗 Quick Links

### Documentation
- [ALL_APIS_COMPLETE.md](./ALL_APIS_COMPLETE.md) - All APIs
- [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) - Postman guide
- [DATABASE_FIXES_GUIDE.md](./DATABASE_FIXES_GUIDE.md) - Database fixes
- [QUICK_START.md](./QUICK_START.md) - Quick start

### Scripts
- `commands.bat` - Batch file for quick commands
- `generate-postman-collection.js` - Generate Postman
- `verify-all-fixes.js` - Verify database
- `fix-all-enums.js` - Fix ENUMs

---

## 💡 Tips

### 1. Use PowerShell ISE
- Better for running scripts
- Syntax highlighting
- Easier debugging

### 2. Use VS Code Terminal
- Integrated terminal
- Multiple terminals
- Git integration

### 3. Create Shortcuts
```bash
# Create desktop shortcut for commands.bat
# Right-click → Send to → Desktop (create shortcut)
```

### 4. Use Task Scheduler
- Schedule database backups
- Auto-start server on boot
- Run maintenance scripts

---

## 📞 Support

For Windows-specific issues:
1. Check this guide first
2. Check [QUICK_START.md](./QUICK_START.md)
3. Check [DATABASE_FIXES_GUIDE.md](./DATABASE_FIXES_GUIDE.md)
4. Run `npm run verify:all`

---

**Last Updated:** January 31, 2026
**Platform:** Windows 10/11
**Node Version:** 18+
