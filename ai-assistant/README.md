# AeroMate — AI Assistant Engine & Verification Suite

**Module Scope:** Isolated AI Travel Assistant Engine, Disruption Guidance, Passenger Rights Reasoning, Multilingual Support, and QA Testing.
**Tech Stack:** OpenAI Node.js SDK (`gpt-4o-mini` / `gpt-4o`), CommonJS, Dynamic Context Grounding, Node.js Test Runners.

---

## 📌 Module Overview

The `ai-assistant` directory houses the core AI reasoning and disruption companion engine for AeroMate. It processes passenger queries, injects verified flight context, evaluates regulatory passenger rights (EU261, UK, US DOT, Indian DGCA), and delivers empathetic multi-language responses.

```
flight_dj/ai-assistant/
├── assistantService.js           # Core AI service module & processAssistantChat entry point
├── .env.example                  # Environment configuration template
├── README.md                     # Setup, architecture, and integration guide
├── demo-script-3min.md           # Hackathon 3-minute demo script
├── prompts/
│   └── disruption-system-prompt.md # Grounded system prompt specification
└── tests/
    ├── demo-scenarios.json       # Demo disruption test dataset
    ├── multilingual-tests.json   # Multilingual & key-preservation test dataset
    ├── api-contract-tests.js     # Deterministic schema & unit assertions runner
    └── test-runner.js            # Master test suite runner
```

---

## 🚀 Setup & Environment Configuration

### 1. Environment Variables
Create or update your backend `.env` file (`backend/.env`) or set environment variables in your runtime:

```bash
# Required for live OpenAI completions (if omitted, engine runs in deterministic offline mock mode)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: OpenAI Model selection (Default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

---

## 🧪 Testing Instructions

The AI Assistant module includes a comprehensive offline/online test suite that requires no external test frameworks.

### Run API Contract & Unit Tests:
```bash
node ai-assistant/tests/api-contract-tests.js
```

### Run Master Test Suite (Demo Scenarios + Multilingual Matrix):
```bash
node ai-assistant/tests/test-runner.js
```

---

## 🔌 Integration Guide for Backend (Manas)

The backend route `POST /api/assistant/chat` (in `backend/src/routes/assistant.js`) integrates directly with `assistantService.js`.

### Express Route Integration Example:
```javascript
const assistantService = require('../../../ai-assistant/assistantService.js');

router.post('/chat', async (req, res) => {
  try {
    const { message, flightContext, language = 'en', history = [] } = req.body;

    const result = await assistantService.processAssistantChat({
      message,
      flightContext,
      language,
      history,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Request Payload Format:
```json
{
  "message": "My flight is delayed by 3 hours. What are my rights?",
  "language": "en",
  "flightContext": {
    "flightNumber": "BA142",
    "airline": "British Airways",
    "status": "delayed",
    "scheduledDep": "14:00",
    "estimatedDep": "17:00",
    "delayMinutes": 180,
    "origin": "LHR",
    "destination": "JFK",
    "gate": "B34",
    "terminal": "T5"
  },
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! I am AeroMate. How can I help?" }
  ]
}
```

### Response Object Contract:
```json
{
  "status": "success",
  "data": {
    "reply": "📍 **Flight Status (BA142):** DELAYED (180 min delay)...",
    "mode": "live_openai",
    "model": "gpt-4o-mini",
    "flightContextApplied": true,
    "timestamp": "2026-10-10T11:48:50.000Z"
  }
}
```

---

## 🛡️ Anti-Hallucination & Security Rules
1. **Strict Context Grounding**: Missing gates, terminals, or flight times are marked as `TBD` / `Unavailable` and never invented.
2. **Prompt-Injection Defense**: User messages and conversation history are treated as untrusted input.
3. **Qualified Rights**: Passenger rights under EU261, DGCA, and US DOT are framed conditionally based on factual route and delay cause verification.
4. **Identifier Protection**: Flight numbers, IATA codes (BOM, DEL, LHR), PNRs, Gate/Terminal designations are preserved without alteration across all languages.
