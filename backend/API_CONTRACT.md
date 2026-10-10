# AeroMate — REST API Contract for Frontend & AI Integration
**Version:** 1.0 (Hackathon MVP)  
**Base URL (Local):** `http://localhost:5000/api`  
**Base URL (Production):** `https://aeromate-backend.onrender.com/api` (or designated Render URL)

---

## 1. System Health
### `GET /health`
Returns backend health and server metrics.

#### Response `200 OK`:
```json
{
  "success": true,
  "service": "AeroMate Backend API",
  "status": "healthy",
  "uptimeSeconds": 128,
  "timestamp": "2026-10-10T12:00:00.000Z",
  "environment": "development"
}
```

---

## 2. Flight Services

### `GET /flights/search`
Searches flight offers using Amadeus API.

#### Query Parameters:
| Param | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `origin` | string | Yes | 3-letter IATA code (e.g. `JFK`, `BOM`) |
| `destination` | string | Yes | 3-letter IATA code (e.g. `LHR`, `DEL`) |
| `date` | string | Yes | Format `YYYY-MM-DD` (e.g. `2026-10-15`) |
| `adults` | number | No | Number of passengers (Default: 1) |

#### Response `200 OK`:
```json
{
  "success": true,
  "count": 3,
  "params": {
    "origin": "JFK",
    "destination": "LHR",
    "date": "2026-10-15"
  },
  "data": [
    {
      "id": "offer-1",
      "airline": "British Airways",
      "airlineCode": "BA",
      "flightNumber": "BA178",
      "origin": "JFK",
      "destination": "LHR",
      "departureTime": "2026-10-15T08:00:00Z",
      "arrivalTime": "2026-10-15T19:55:00Z",
      "duration": "6h 55m",
      "stops": 0,
      "price": 540.00,
      "currency": "USD",
      "numberOfBookableSeats": 5
    }
  ]
}
```

---

### `GET /flights/:flightNumber/status`
Retrieves live or scheduled flight status.

#### Path Parameter:
- `flightNumber`: e.g. `BA142`, `AI645`

#### Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "flightNumber": "BA142",
    "airline": "British Airways",
    "airlineIata": "BA",
    "status": "delayed", // 'scheduled' | 'active' | 'delayed' | 'cancelled'
    "delayMinutes": 210,
    "departure": {
      "iata": "LHR",
      "airport": "London Heathrow Airport",
      "terminal": "5",
      "gate": "B36",
      "scheduled": "2026-10-15T10:00:00Z",
      "estimated": "2026-10-15T13:30:00Z",
      "actual": null
    },
    "arrival": {
      "iata": "JFK",
      "airport": "John F. Kennedy International Airport",
      "terminal": "7",
      "gate": "12",
      "scheduled": "2026-10-15T14:00:00Z",
      "estimated": "2026-10-15T17:30:00Z",
      "actual": null
    },
    "aircraft": {
      "registration": "G-XWBA",
      "iata": "A350-1000"
    },
    "liveAvailable": true,
    "lastUpdated": "2026-10-10T12:00:00.000Z",
    "isMock": false
  }
}
```

---

### `GET /flights/:flightNumber/position`
Retrieves aircraft position for interactive map rendering.

#### Path Parameter:
- `flightNumber`: e.g. `BA142`

#### Response `200 OK` (Live Radar Telemetry Available):
```json
{
  "success": true,
  "available": true,
  "data": {
    "available": true,
    "flightNumber": "BA142",
    "callsign": "BAW142",
    "latitude": 52.3555,
    "longitude": -25.6882,
    "altitude": 36000,
    "velocityKts": 480,
    "heading": 260,
    "onGround": false,
    "lastUpdated": "2026-10-10T12:05:00.000Z",
    "source": "OpenSky Network Live Radar"
  }
}
```

#### Response `200 OK` (Live Radar Telemetry Unavailable):
```json
{
  "success": true,
  "available": false,
  "data": {
    "available": false,
    "flightNumber": "SW909",
    "message": "Live ADS-B aircraft radar tracking is not currently active for this flight. The aircraft may be on ground, out of receiver range, or not yet airborne.",
    "lastUpdated": "2026-10-10T12:05:00.000Z"
  }
}
```

---

## 3. AI Travel Assistant

### `POST /assistant/chat`
Sends user question with optional flight context to get multilingual guidance.

#### Request Headers:
`Content-Type: application/json`

#### Request Body:
```json
{
  "message": "My flight is delayed by 3 hours, what should I do?",
  "language": "en",
  "flightContext": {
    "flightNumber": "BA142",
    "airline": "British Airways",
    "status": "delayed",
    "delayMinutes": 210,
    "departure": {
      "iata": "LHR",
      "terminal": "5",
      "gate": "B36"
    }
  },
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help with your flight today?" }
  ]
}
```

#### Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "reply": "✈️ **Flight Disruption Guidance for BA142:**\n\n• **Current Status:** Delayed by 210 minutes.\n• Under UK/EU261 rules, you are entitled to food/drink vouchers and up to €600 compensation.",
    "language": "en",
    "modelUsed": "gpt-4o-mini",
    "isAiGenerated": true
  }
}
```

---

## 4. Saved Trips (Requires Authentication)

All `/trips` endpoints require an Authorization header:  
`Authorization: Bearer <supabase_access_token>`  
*(For local testing without Supabase credentials, use `Bearer demo-token`)*

### `GET /trips`
Returns saved journeys for the authenticated user.

#### Response `200 OK`:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "e2f03f3a-8671-4d7a-8b1b-9442a8b3d641",
      "user_id": "00000000-0000-0000-0000-000000000001",
      "flight_number": "BA142",
      "airline": "British Airways",
      "origin": "LHR",
      "destination": "JFK",
      "travel_date": "2026-10-15",
      "status": "delayed",
      "metadata": { "terminal": "5", "gate": "B36" },
      "created_at": "2026-10-10T12:00:00Z"
    }
  ]
}
```

### `POST /trips`
Saves a new flight to the user's account.

#### Request Body:
```json
{
  "flightNumber": "AI645",
  "airline": "Air India",
  "origin": "BOM",
  "destination": "DEL",
  "travelDate": "2026-10-18",
  "status": "scheduled",
  "metadata": { "terminal": "2", "gate": "48" }
}
```

#### Response `201 Created`:
```json
{
  "success": true,
  "message": "Trip successfully saved.",
  "data": { ... }
}
```

### `DELETE /trips/:id`
Removes a saved flight by ID.

#### Response `200 OK`:
```json
{
  "success": true,
  "message": "Trip deleted successfully.",
  "data": { "success": true, "id": "e2f03f3a-8671-4d7a-8b1b-9442a8b3d641" }
}
```
