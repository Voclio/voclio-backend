# Architecture Notes & Future Improvements

## Current Architecture Status

### ✅ Completed Improvements
- Fixed all critical bugs (logout, Google Calendar race condition, double AI calls)
- Implemented security hardening (CORS, JWT validation, rate limiting)
- Added performance optimizations (compression, timeouts, logging)
- Cleaned up dependencies

### ⚠️ Known Architectural Debt

#### 1. Dual Data Layer (Not Fixed - Requires Major Refactor)

**Current State:**
The codebase has TWO parallel data access layers:

1. **Raw SQL Models** (`src/models/*.model.js`)
   - Uses `pg` Pool directly
   - Manual SQL queries
   - Used by: Voice, Task, Note, Reminder, Category controllers

2. **Sequelize ORM Models** (`src/models/orm/*.js`)
   - Uses Sequelize ORM
   - Model definitions with associations
   - Used by: Auth, Calendar, Webex, Productivity controllers

**Why This Exists:**
- Project started with raw SQL
- Sequelize was added later for complex relationships
- Both layers were kept for backward compatibility

**Impact:**
- Inconsistent patterns across codebase
- Harder to maintain
- Duplicate logic in some places
- New developers get confused

**Recommendation for Future:**
Choose ONE approach and migrate everything to it.

**Option A: Migrate to Sequelize (Recommended)**
- ✅ Better for complex relationships
- ✅ Built-in migrations
- ✅ Easier to maintain
- ✅ Better TypeScript support
- ❌ Slightly slower than raw SQL
- ❌ Learning curve for team

**Option B: Migrate to Raw SQL**
- ✅ Maximum performance
- ✅ Full control over queries
- ✅ Simpler for small teams
- ❌ Manual migration management
- ❌ More boilerplate code
- ❌ Harder to maintain relationships

**Migration Strategy (If Choosing Sequelize):**
1. Start with low-risk models (Tags, Categories)
2. Create Sequelize equivalents
3. Update controllers one at a time
4. Test thoroughly after each migration
5. Remove old raw SQL models
6. Estimated time: 2-3 weeks

**Decision:** NOT implemented in this production-ready pass because:
- High risk of breaking existing functionality
- Requires extensive testing
- Should be done in a dedicated sprint
- Current dual-layer works (just not ideal)

---

## 🏗️ Architecture Patterns

### Current Patterns

#### Controller → Model → Database
```
Request → Controller → Model → Database
                    ↓
                 Response
```

#### Controller → Service → External API
```
Request → Controller → Service → External API
                    ↓
                 Response
```

### Recommended Patterns (For Future)

#### Add Service Layer for Business Logic
```
Request → Controller → Service → Model → Database
                              ↓
                          Response
```

**Benefits:**
- Controllers stay thin (just validation & response)
- Business logic in services (reusable)
- Models stay focused on data access
- Easier to test

**Example Refactor:**
```javascript
// BEFORE (Controller has business logic)
class TaskController {
  static async createTask(req, res, next) {
    // Validation
    // Business logic
    // Database call
    // Response
  }
}

// AFTER (Service has business logic)
class TaskService {
  async createTask(userId, taskData) {
    // Business logic
    // Database call via model
    return task;
  }
}

class TaskController {
  static async createTask(req, res, next) {
    // Validation only
    const task = await TaskService.createTask(req.user.user_id, req.body);
    return successResponse(res, { task });
  }
}
```

---

## 🔄 Data Flow Diagrams

### Voice Processing Flow (Current)
```
1. Upload Audio
   ↓
2. Save to Local Disk (⚠️ Not scalable)
   ↓
3. Create VoiceRecording in DB
   ↓
4. Transcribe with AssemblyAI (⏱️ Blocks request)
   ↓
5. Extract Tasks/Notes with AI (⏱️ Blocks request)
   ↓
6. Create Tasks/Notes in DB
   ↓
7. Return Response
```

### Voice Processing Flow (Recommended)
```
1. Upload Audio
   ↓
2. Save to S3/Cloud Storage
   ↓
3. Create VoiceRecording in DB (status: pending)
   ↓
4. Queue Job for Processing
   ↓
5. Return Response (with job_id)

[Background Job]
6. Transcribe with AssemblyAI
   ↓
7. Extract Tasks/Notes with AI
   ↓
8. Create Tasks/Notes in DB
   ↓
9. Send Notification to User
```

**Benefits:**
- Non-blocking API responses
- Scalable file storage
- Better error handling
- User gets immediate feedback

---

## 📊 Database Schema Notes

### Well-Designed Tables
- ✅ `users` - Good indexes, proper constraints
- ✅ `tasks` - Self-referential for subtasks works well
- ✅ `note_tags` - Proper junction table
- ✅ `sessions` - Good for JWT refresh tokens

### Tables Needing Attention
- ⚠️ `calendar_sync` - Stores tokens in plaintext (security risk)
- ⚠️ `backups` - Table exists but completely unused
- ⚠️ `api_keys` - Table exists but not used anywhere

### Missing Indexes (For Future)
```sql
-- Add these for better performance
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
CREATE INDEX idx_voice_recordings_user_status ON voice_recordings(user_id, status);
```

---

## 🔐 Security Architecture

### Current Security Layers
```
1. Rate Limiting (IP-based)
   ↓
2. CORS Check
   ↓
3. JWT Validation (authMiddleware)
   ↓
4. Input Validation (express-validator)
   ↓
5. Business Logic
   ↓
6. Database (with constraints)
```

### Recommended Additions
1. **API Key Authentication** (for mobile apps)
2. **Request Signing** (for webhooks)
3. **Audit Logging** (for sensitive operations)
4. **Token Encryption** (for OAuth tokens at rest)

---

## 🚀 Scalability Considerations

### Current Bottlenecks
1. **File Storage**: Local disk doesn't scale horizontally
2. **AI Processing**: Synchronous calls block requests
3. **No Caching**: Every request hits database
4. **Single Instance**: No load balancing support

### Scaling Path

#### Phase 1: Horizontal Scaling (1-10K users)
- Move files to S3/CloudFlare R2
- Add Redis for caching
- Add load balancer
- Use managed PostgreSQL

#### Phase 2: Async Processing (10K-100K users)
- Add job queue (Bull/BullMQ)
- Background workers for AI processing
- Webhook notifications
- CDN for static assets

#### Phase 3: Microservices (100K+ users)
- Split voice processing to separate service
- Split AI service
- Event-driven architecture
- Message queue (RabbitMQ/Kafka)

---

## 📝 Code Quality Metrics

### Current State
- **Test Coverage**: 0% (no tests)
- **Linting**: Not configured
- **Type Safety**: None (plain JavaScript)
- **Documentation**: Good (markdown docs exist)

### Recommended Targets
- **Test Coverage**: 70%+ for critical paths
- **Linting**: ESLint with Airbnb config
- **Type Safety**: Consider TypeScript migration
- **API Docs**: Swagger/OpenAPI

---

## 🎯 Technical Debt Priority

### High Priority (Do Next)
1. **File Storage Migration** - Blocks horizontal scaling
2. **OAuth Token Encryption** - Security risk
3. **Job Queue for AI** - Performance & UX

### Medium Priority (Next Quarter)
4. **Data Layer Consolidation** - Code quality
5. **Redis Caching** - Performance
6. **Test Suite** - Reliability

### Low Priority (Future)
7. **TypeScript Migration** - Type safety
8. **Microservices Split** - Only if needed at scale
9. **GraphQL API** - Alternative to REST

---

## 🔧 Development Workflow

### Current Workflow
```
1. Edit code
2. Restart server manually
3. Test with Postman
4. Check console logs
5. Commit
```

### Recommended Workflow
```
1. Edit code
2. Auto-restart (nodemon - already configured)
3. Run tests (npm test)
4. Check logs (Winston files)
5. Lint (npm run lint)
6. Commit (with pre-commit hooks)
7. CI/CD runs tests
8. Auto-deploy to staging
```

---

## 📚 Learning Resources

### For New Developers

**Understanding the Codebase:**
1. Start with `server.js` - entry point
2. Read `src/app.js` - middleware setup
3. Check `src/routes/index.js` - all endpoints
4. Pick one controller to understand flow

**Key Files to Read:**
- `src/controllers/voice.controller.js` - Core feature
- `src/services/ai.service.js` - AI integration
- `src/middleware/auth.middleware.js` - Authentication
- `src/utils/errors.js` - Error handling

**External Services:**
- AssemblyAI: Speech-to-text
- OpenRouter: GPT-4o for task extraction
- Resend: Email delivery
- Google Calendar API: Calendar integration

---

## 🎨 Design Decisions

### Why Express?
- Mature, stable, well-documented
- Large ecosystem
- Team familiarity
- Good for REST APIs

### Why PostgreSQL?
- ACID compliance
- JSON support (for flexible data)
- Great for relational data
- Excellent performance

### Why Sequelize + Raw SQL?
- Historical reasons (see Dual Data Layer above)
- Should be consolidated in future

### Why Winston for Logging?
- Industry standard
- File rotation built-in
- Multiple transports
- Structured logging

---

## 🔮 Future Architecture Vision

### Ideal State (1-2 Years)
```
┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  API Server 1  │    │  API Server 2   │
│  (Node.js)     │    │  (Node.js)      │
└───────┬────────┘    └────────┬─────────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼─────────┐
│   PostgreSQL   │  │   Redis Cache    │
│   (Primary)    │  │                  │
└────────────────┘  └──────────────────┘
        │
┌───────▼────────┐
│   S3 Storage   │
│  (Audio Files) │
└────────────────┘
        │
┌───────▼────────┐
│  Job Queue     │
│  (Bull/Redis)  │
└────────────────┘
        │
┌───────▼────────┐
│  AI Workers    │
│  (Background)  │
└────────────────┘
```

---

**Last Updated**: 2026-04-23
**Status**: Production-Ready (with noted technical debt)
