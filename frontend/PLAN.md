# AeroMate Frontend Technical Implementation Plan

This document outlines the detailed architectural and component-level implementation plan for completing the remaining phases of the AeroMate application.

## Phase 2: Flight Search & Tracking Implementation

### 1. Flight Search (`src/pages/Search.jsx`)
- **State Management**:
  - `searchQuery` (object): stores `{ origin: '', destination: '', date: '' }`
  - `results` (array): stores the filtered array of flights.
  - `loading` & `error` (booleans/strings).
- **Sub-Components Needed**:
  - `src/components/flights/SearchForm.jsx`: Controlled form with validation.
  - `src/components/flights/FlightCard.jsx`: Reusable component displaying flight summary (times, airline, status badge).
  - `src/components/common/StatusBadge.jsx`: Dynamic Tailwind colored badge based on status string (ON_TIME, DELAYED, CANCELLED).
- **Service Integration**: Add `flightService.searchFlights(query)` to filter `MOCK_FLIGHTS`.

### 2. Flight Details (`src/pages/FlightDetails.jsx`)
- **State Management**:
  - `flight` (object): fetched using the `useParams` flightId.
- **Sub-Components Needed**:
  - `src/components/flights/FlightTimeline.jsx`: A vertical/horizontal timeline showing Scheduled vs Estimated times, Terminal, and Gate info.
  - `src/components/flights/MapTracker.jsx`: 
    - Dependencies: `leaflet`, `react-leaflet`.
    - Implementation: A mock static map with a polyline connecting origin and destination coordinates, using a plane icon for the mock current position.
- **Mock Data Updates**: Add `coordinates` `{ lat, lng }` to the origin and destination objects in `mockData.js`.

### 3. Saved Trips (`src/pages/Trips.jsx`)
- **State Management**:
  - `savedTrips` (array): synced with `localStorage`.
- **Sub-Components Needed**:
  - `src/components/common/EmptyState.jsx`: Reusable UI when no trips are saved.
- **Service Integration**: Create `src/services/storageService.js` with `saveTrip()`, `removeTrip()`, and `getTrips()`.

---

## Phase 3: AI Assistant Implementation

### 1. Chat Interface (`src/pages/Assistant.jsx`)
- **State Management**:
  - `messages` (array): `[{ id, sender: 'user'|'ai', text, timestamp }]`.
  - `isTyping` (boolean): For AI typing indicator.
- **Sub-Components Needed**:
  - `src/components/assistant/ChatWidget.jsx`: The main layout (scrollable message list + fixed input area).
  - `src/components/assistant/MessageBubble.jsx`: Differentiated by sender (Tailwind alignment and colors).
  - `src/components/assistant/SuggestedQuestions.jsx`: Pills for quick user actions.
- **Service Integration**: 
  - Create `src/services/aiService.js` with `mockChatResponse(message)`.
  - The logic will parse keywords (e.g., "delay", "SW101") and return a predefined string or standard disruption protocol text.

---

## Phase 4: Authentication UI Implementation

### 1. Login & Signup Pages (`src/pages/Login.jsx`, `src/pages/Signup.jsx`)
- **State Management**:
  - `formData` (object): email, password, confirmPassword.
  - `formErrors` (object): specific field errors.
  - `showPassword` (boolean): toggles input type between `text` and `password`.
- **Sub-Components Needed**:
  - Standard HTML5 form inputs styled with Tailwind's `@apply`.
- **Mock Auth Context**:
  - Create `src/context/AuthContext.jsx`.
  - Provide a mock `login`, `logout`, and `user` state wrapped around the `App` to reflect login status in the `Navbar`.

---

## Phase 5: Polish & Demo Readiness

- **Error Boundaries**: Wrap routes to prevent crashing on unhandled errors.
- **Loading States**: Replace standard text loading with skeleton loaders (`animate-pulse`) in `src/components/common/Skeleton.jsx`.
- **Responsive Review**: Verify grid configurations (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) across all pages.
- **Local Storage Cleanup**: Ensure mock states handle corrupted `localStorage` gracefully.
