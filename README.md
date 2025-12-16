# Voclio Backend API

Voice notes and task management system with AI-powered features.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Git

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Voclio/voclio-backend.git
cd voclio-backend

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voclio_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup

```bash
# Create database (using psql)
psql -U postgres -c "CREATE DATABASE voclio_db;"

# Initialize database schema
npm run init-db
```

### 5. Start Server

```bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
```

Server will run at: **http://localhost:3000**

## Features

- 🔐 **Authentication** - JWT-based auth with refresh tokens
- 🎤 **Voice Recording** - Upload and transcribe audio files
- 📝 **Notes** - Create, manage, and AI-summarize notes
- ✅ **Tasks** - Task management with priorities and categories
- 🏷️ **Tags** - Organize notes and tasks with tags
- ⏰ **Reminders** - Set and manage reminders
- 📊 **Productivity** - Focus sessions, streaks, and achievements
- 🤖 **AI Features** - Powered by Google Gemini AI
  - Text summarization
  - Task extraction from notes
  - Productivity suggestions

## API Documentation

Import `Voclio_API.postman_collection.json` into Postman to test all endpoints.

### Main Endpoints

- **Auth**: `/api/auth/*` - Register, login, profile management
- **Voice**: `/api/voice/*` - Upload and manage recordings
- **Notes**: `/api/notes/*` - CRUD operations, AI features
- **Tasks**: `/api/tasks/*` - Task management and statistics
- **Tags**: `/api/tags/*` - Tag management
- **Reminders**: `/api/reminders/*` - Reminder CRUD
- **Notifications**: `/api/notifications/*` - User notifications
- **Settings**: `/api/settings/*` - User preferences
- **Productivity**: `/api/productivity/*` - Focus tracking, AI insights

## Project Structure

```
voclio-backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── models/          # Database operations
│   ├── routes/          # API endpoints
│   ├── validators/      # Input validation
│   ├── middleware/      # Auth & error handling
│   ├── services/        # External services (Gemini AI)
│   ├── utils/           # Helper functions
│   └── config/          # Configuration files
├── database/
│   └── schema.sql       # Database schema (20 tables)
├── scripts/
│   └── initDatabase.js  # DB initialization script
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json
```

## Development

```bash
# Run database initialization
npm run init-db

# Test database connection
npm run test-db

# Start development server
npm run dev
```

## Tech Stack

- **Runtime**: Node.js 24+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 18
- **AI**: Google Gemini AI
- **Auth**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting
- **File Upload**: Multer

## License

MIT
