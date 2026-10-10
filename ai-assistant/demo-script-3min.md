# 🎙️ AeroMate (PS-01) — 3-Minute Hackathon Demo Script

> **Module Focus:** AI Assistant, Disruption Reasoning Engine, Passenger Rights & Multilingual Assistance
> **Presenter:** Kaustubh (AI Assistant Lead)
> **Demo Data Notice:** All flight scenarios use synthetic demo datasets grounded in structured flight payloads.

---

## ⏱️ Timeline & Presentation Flow

### 0:00 – 0:30 | 1. Introduction & The Problem Statement
- **Speaker:**
  > "Hello judges and team! Flight disruptions are one of the most stressful experiences in modern travel. When flights are delayed or cancelled, passengers face confusing airline jargon, unverified rumor, and uncertainty about their legal rights to meals, hotels, or refunds.
  > Meet **AeroMate** — an AI-powered aviation companion designed to provide grounded, context-aware assistance during travel disruptions."
- **Visual:** Open AeroMate Web App showing the AI Assistant chat interface.

---

### 0:30 – 1:10 | 2. Scenario A — On-Time Domestic Flight (AI645 BOM ➔ DEL)
- **Context:** Flight `AI645` (Air India, Mumbai to Delhi, Status: `SCHEDULED`, Gate: `15A`, Terminal: `T2`).
- **User Message:**
  > *"What gate does my flight depart from and when is boarding?"*
- **Speaker Highlights:**
  > "Notice how AeroMate responds calmly and clearly. It provides the exact Gate `15A` and Terminal `T2` from our trusted payload without inventing unverified flight positions or claiming live radar access. It distinguishes verified facts from general pre-flight advice."
- **Expected Output:**
  ```markdown
  📍 Flight Status (AI645 (BOM ➔ DEL)): SCHEDULED
  🏢 Location: Terminal T2, Gate 15A
  ⚖️ Your Passenger Rights (Indian DGCA Charter): Flight operating as scheduled.
  ✈️ Recommended Next Steps: Arrive at Gate 15A 30 mins before boarding.
  ```

---

### 1:10 – 2:00 | 3. Scenario B — Disrupted Flight Guidance (BA142 LHR ➔ JFK, 180m Delay)
- **Context:** Flight `BA142` (British Airways, London Heathrow to JFK, Status: `DELAYED`, Delay: `180` minutes).
- **User Message:**
  > *"My flight is delayed by 3 hours! What are my rights?"*
- **Speaker Highlights:**
  > "Now watch how AeroMate handles a severe 3-hour delay on a UK-departing flight. It automatically evaluates **UK Air Passenger Rights** and explains that the passenger is entitled to immediate **Right to Care** (free food and drinks). Crucially, it qualifies cash compensation (€250–€600) as *conditional* on final arrival delay and weather/ATC delay cause — never promising unverified payouts."
- **Expected Output:**
  ```markdown
  📍 Flight Status (BA142 (LHR ➔ JFK)): DELAYED (180 min delay)
  🏢 Location: Terminal T5, Gate B34
  ⚖️ Your Passenger Rights (UK Air Passenger Rights):
  • Conditional Cash Compensation (€250 - €600): Requires final arrival delay ≥ 3h and controllable delay cause.
  • Right to Care: Free meals and refreshments at airport.
  ✈️ Recommended Next Steps: Claim meal vouchers at Gate B34; keep all receipts.
  ```

---

### 2:00 – 2:35 | 4. Scenario C — Multilingual Disruption & Context Preservation
- **Context:** User switches mid-conversation from English to Hindi (`hi`) or Spanish (`es`).
- **User Message (Hindi):**
  > *"क्या मेरी फ़्लाइट लेट है और मुझे भोजन मिलेगा?"*
- **Speaker Highlights:**
  > "AeroMate supports seamless multilingual assistance. When the passenger switches to Hindi mid-conversation, AeroMate responds naturally in Hindi while preserving critical aviation identifiers (`AI645`, `BOM ➔ DEL`, `Terminal T2`, `Gate 15A`)."
- **Expected Output:**
  ```markdown
  📍 फ़्लाइट स्थिति (AI645 (BOM ➔ DEL)): DELAYED (120 min delay)
  🏢 स्थान: Terminal T2, Gate 15A
  ⚖️ आपके अधिकार और सुरक्षा (DGCA Charter): मुफ़्त भोजन और रिफ्रेशमेंट का अधिकार।
  ✈️ अनुशंसित अगले कदम: गेट एजेंट से भोजन कूपन लें।
  ```

---

### 2:35 – 3:00 | 5. Architecture, Safety & Offline Resilience Wrap-Up
- **Speaker:**
  > "Under the hood:
  > 1. All API keys remain 100% server-side.
  > 2. Structured prompt guardrails prevent prompt injection and hallucinated gate numbers.
  > 3. Zero-Crash Fallback: If network drops or API limits occur, our local rules engine guarantees valid, multi-language passenger guidance without breaking the user experience.
  > Thank you!"

---

## 🛠️ Offline & Fallback Execution Instructions

If live OpenAI API calls are unavailable during the presentation:
1. The engine automatically enters `mode: 'offline_mock'`.
2. All 3 demo scenarios execute deterministically with complete markdown formatting.
3. To trigger mock mode manually, simply run without `OPENAI_API_KEY`:
   ```bash
   node ai-assistant/tests/test-runner.js
   ```
