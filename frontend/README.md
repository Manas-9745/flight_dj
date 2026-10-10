# AeroMate — Frontend Application

**Lead / Owner:** Kaustubh  
**Stack:** React.js, Vite, Tailwind CSS, Lucide React, Mapbox GL JS, React Router.

---

## 📌 Responsibilities
- Responsive UI (Mobile, Tablet, Desktop)
- Dashboard (`/`), Flight Search (`/search`), Flight Details & Radar Map (`/flight/:flightId`)
- AI Chat Drawer / View (`/assistant`)
- Saved Trips (`/trips`) & Supabase Login/Signup screens
- Mapbox interactive live radar aircraft marker display with clear fallback when live position is unavailable.

---

## 🛠️ Setup Instructions
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🤖 Dedicated AI Prompt for Kaustubh
```text
You are a Lead Frontend Engineer working on "AeroMate" (PS-01).
My name is Kaustubh, and I am responsible for the React + Vite frontend, Tailwind CSS styling, and Mapbox GL JS integration.
Build a modern, responsive aviation companion UI with:
- Dashboard (/) with flight lookup and quick stats
- Flight search (/search) with filters and flight cards
- Flight details (/flight/:flightId) with route timeline, status badge, and live Mapbox radar tracking
- AI chat interface (/assistant) with multilingual selector
- Saved trips (/trips) and Supabase authentication forms
Include mock API services so the UI works smoothly before connecting to the backend.
```
