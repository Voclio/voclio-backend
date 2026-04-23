# Production Refactor Implementation Plan

## New Folder Structure

```
voclio-backend/
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── index.js
│   │   ├── database.orm.js
│   │   ├── oauth.js
│   │   ├── redis.js              # NEW
│   │   ├── queue.js              # NEW
│   │   ├── storage.js            # NEW
│   │   └── swagger.js            # NEW
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── ai.service.js         # REFACTORED
│   │   ├── queue.service.js      # NEW
│   │   ├── storage.service.js    # NEW
│   │   ├── cache.service.js      # NEW
│   │   └── encryption.service.js # NEW
│   ├── jobs/                     # NEW
│   │   ├── transcription.job.js
│   │   ├── extraction.job.js
│   │   └── index.js
│   ├── utils/
│   └── validators/
├── tests/                        # NEW
│   ├── unit/
│   ├── integration/
│   └── setup.js
└── workers/                      # NEW
    └── queue.worker.js
```

## Implementation Order

1. ✅ Setup infrastructure (Redis, BullMQ, S3)
2. ✅ Implement job queue system
3. ✅ Implement cloud storage
4. ✅ Add encryption service
5. ✅ Add caching layer
6. ✅ Setup testing framework
7. ✅ Add Swagger documentation
8. ✅ Refactor AI service
9. ✅ Update controllers
10. ✅ Migration guide
