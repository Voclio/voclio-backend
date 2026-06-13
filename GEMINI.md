# Voclio Backend

## Project Overview
Voclio System API is a Node.js backend application designed for voice notes and task management. It integrates various services for a rich productivity experience.

**Key Technologies:**
- **Runtime & Framework:** Node.js (>=18), Express
- **Database & ORM:** PostgreSQL (`pg`), Sequelize
- **Caching & Queue:** Redis (`ioredis`), BullMQ
- **Authentication & Security:** JWT (`jsonwebtoken`), bcryptjs, Helmet, Express Rate Limit, CORS
- **Cloud Storage:** AWS S3 (`@aws-sdk/client-s3`)
- **AI Integrations:** Google Generative AI (`@google/generative-ai`)
- **Third-Party APIs:** Google Calendar

## Architecture & Structure
The project follows a standard MVC-like architecture for Express applications:
- `src/controllers/`: Route handlers.
- `src/services/`: Core business logic, including third-party integrations (`googleCalendar.service.js`, `ai/`).
- `src/models/`: Database models, likely utilizing Sequelize.
- `src/routes/`: Express route definitions.
- `src/middleware/`: Express middlewares (auth, error handling).
- `src/utils/`: Helpers and shared utilities.
- `workers/`: Background job processors using BullMQ.
- `tests/`: Integration and Unit tests using Jest.

## Building and Running
The application defines several npm scripts for development and production workflows:

- **Start Production:** `npm start` (Runs `node server.js`)
- **Start Development:** `npm run dev` (Runs `node --watch server.js`)
- **Run Worker:** `npm run worker` (Runs `node workers/queue.worker.js`)
- **Run Worker (Dev):** `npm run dev:worker` (Runs `node --watch workers/queue.worker.js`)
- **Run Tests:** `npm test` or `npm run test:watch`
- **Linting & Formatting:** `npm run lint`, `npm run format`

## Development Conventions
- ES Modules (`"type": "module"`) are used.
- Code quality is enforced by ESLint and Prettier.
- Tests are written using Jest with `--experimental-vm-modules` enabled for ESM support.
- API documentation is likely generated via `swagger-jsdoc` and served with `swagger-ui-express`.ui-express`.