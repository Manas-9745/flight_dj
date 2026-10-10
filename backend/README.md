# AeroMate — Backend Service

**Lead / Owner:** Manas Parekar  
**Stack:** Node.js, Express.js, Supabase (PostgreSQL, Auth), Amadeus API, Aviationstack API, OpenSky ADS-B.

---

## 📌 Responsibilities
- REST API endpoints (`/api/flights/search`, `/api/flights/:flightNumber/status`, `/api/flights/:flightNumber/position`)
- Supabase integration: Auth verification, `saved_trips`, `profiles` tables with Row Level Security (RLS)
- Bridge endpoint for AI assistant: `POST /api/assistant/chat`
- Rate-limiting, caching, and fallback mock data for when third-party API quotas are reached.

---

## 🛠️ Setup Instructions
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## 🤖 Dedicated AI Prompt for Manas
```text
You are a Senior Backend Engineer working on "AeroMate" (PS-01).
My name is Manas, and I am responsible for the Express backend, Supabase DB & Auth, and external Flight APIs.
Follow the PRD specification for:
- GET /api/health
- GET /api/flights/search
- GET /api/flights/:flightNumber/status
- GET /api/flights/:flightNumber/position
- POST /api/assistant/chat
- GET /api/trips, POST /api/trips, DELETE /api/trips/:id
Ensure clean error handling, environment variable security, and fallback mock data when third-party APIs hit rate limits.
```
