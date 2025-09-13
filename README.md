# Voclio Backend

This repository contains the backend services for **Voclio**, built with Node.js and NestJS/Express.  
It powers the APIs, authentication, database management, and integrations with AI services.

## 🚀 Features
- RESTful APIs for mobile and web clients
- Authentication & Authorization (JWT/OAuth2)
- Database integration (PostgreSQL/MongoDB)
- Realtime communication (WebSockets)
- Integration with AI microservices (from `voclio-ai`)
- Unit & Integration testing

## 📂 Tech Stack
- Node.js
- NestJS / Express.js
- PostgreSQL / MongoDB
- Docker
- Redis (for caching/queues)

## 🛠️ Setup
```bash
# Clone the repo
git clone https://github.com/voclio/voclio-backend.git
cd voclio-backend

# Install dependencies
npm install

# Run dev server
npm run start:dev
