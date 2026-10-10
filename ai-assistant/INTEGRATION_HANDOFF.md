# 🤝 AeroMate AI Assistant — Integration Handoff Document

**Author:** Kaustubh (AI Assistant Lead)
**Target Recipient:** Manas (Backend Lead) & Frontend Team
**Module Directory:** `ai-assistant/`

---

## 📌 1. Module Overview & Responsibilities

The `ai-assistant` module provides the core reasoning, flight-context grounding, passenger rights evaluation (EU261, UK, US DOT, Indian DGCA), and multilingual translation service for AeroMate.

---

## 🔌 2. Service Interface & Backend Integration

### Exported Entry Point
- **File Path:** [`ai-assistant/assistantService.js`](file:///Users/kaustubhpatil/.gemini/antigravity-ide/scratch/flight_dj/ai-assistant/assistantService.js)
- **Method Signature:**
  ```javascript
  const assistantService = require('../../../ai-assistant/assistantService.js');

  const result = await assistantService.processAssistantChat({
    message,       // Required: string
    flightContext, // Optional: object
    language,      // Optional: string ('en', 'hi', 'es', 'fr', 'de', 'ja', or 'auto')
    history        // Optional: array of { role: 'user'|'assistant', content: string }
  });
  ```

### Input Payload Object Signature (`ProcessChatParams`)
```typescript
{
  message: string;                      // User prompt (e.g. "What is my flight status?")
  flightContext?: {
    flightNumber?: string;              // e.g. "AI645", "BA142"
    airline?: string;                   // e.g. "Air India", "British Airways"
    status?: string;                    // "scheduled" | "delayed" | "cancelled" | "in-flight"
    scheduledDep?: string;              // Alias for scheduledDeparture (e.g. "14:00")
    scheduledDeparture?: string;        // e.g. "2026-10-10T14:00:00Z"
    estimatedDep?: string;              // Alias for estimatedDeparture (e.g. "17:00")
    estimatedDeparture?: string;        // e.g. "2026-10-10T17:00:00Z"
    delayMinutes?: number;              // e.g. 180
    origin?: string;                    // IATA code, e.g. "BOM", "LHR", "JFK"
    destination?: string;               // IATA code, e.g. "DEL", "JFK", "BLR"
    gate?: string;                      // e.g. "15A" or "TBD"
    terminal?: string;                  // e.g. "T2" or "TBD"
  };
  language?: string;                    // Preferred language ('en', 'hi', 'es', 'fr', 'de', 'ja')
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

### Output Result Object Signature
```json
{
  "reply": "Markdown formatted string response",
  "mode": "live_openai | offline_mock | fallback_error",
  "model": "gpt-4o-mini",
  "flightContextApplied": true,
  "timestamp": "2026-10-10T12:00:00.000Z"
}
```

---

## ⚙️ 3. Environment Variables Configuration

In `backend/.env`, configure the following variables:

```bash
# Required for live OpenAI completion mode
OPENAI_API_KEY=your_actual_openai_api_key

# Optional model selection (Defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

> **Note:** If `OPENAI_API_KEY` is not provided, `assistantService` automatically operates in deterministic `offline_mock` mode without throwing unhandled exceptions.

---

## 🚀 4. How Manas Can Mount the Route in `backend/src/server.js`

The route handler is already drafted in `backend/src/routes/assistant.js`. To mount it in the Express application:

```javascript
// In backend/src/server.js:
const assistantRouter = require('./routes/assistant');

// Mount AI Assistant endpoints
app.use('/api/assistant', assistantRouter);
```

### Route Endpoint Details:
- **HTTP Method:** `POST /api/assistant/chat`
- **Request Body:** JSON payload matching the input signature above.
- **HTTP Response:**
  - `200 OK`: `{ "status": "success", "data": result }`
  - `400 Bad Request`: `{ "error": "Bad Request", "details": "..." }`
  - `500 Internal Server Error`: `{ "error": "Internal Server Error", "details": "..." }`

---

## 🧪 5. How to Run AI Module Tests

Execute these commands from the root directory:

```bash
# 1. Run API Contract & Unit Tests (11/11 tests)
node ai-assistant/tests/api-contract-tests.js

# 2. Run Master Hackathon Demo & Multilingual Test Suite (12/12 scenarios)
node ai-assistant/tests/test-runner.js
```

---

## ⚖️ 6. Mock Data vs Live Data Distinction & Known Limitations

1. **Synthetic Demo Data**: Test datasets in `ai-assistant/tests/demo-scenarios.json` are synthetic payloads designed for demo validation.
2. **Conditional Rights Advice**: Passenger rights under EU261, UK law, US DOT, and DGCA are advice guidelines, not legal guarantees. Compensation claims require official airline verification.
3. **Coordination Note**: Uncommitted files in `backend/` (`backend/package-lock.json` and `backend/src/routes/`) should be staged and committed by Manas when ready.
