const OpenAI = require('openai');

class JourneyService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  get isConfigured() {
    return !!this.apiKey && !this.apiKey.includes('your-') && !this.apiKey.includes('placeholder');
  }

  // ─── Transfer Guide ────────────────────────────────────────────────────────

  async getTransferGuide({ inboundFlight, outboundFlight, language = 'en' }) {
    const systemPrompt = `You are AeroMate's expert airport transfer guide. Your role is to give clear, step-by-step transfer instructions to travelers making connections.

STRICT RULES:
1. Only describe verified processes (security, immigration, baggage reclaim, terminal transfer).
2. NEVER invent specific gate numbers, carousel numbers, or transfer times unless provided in the flight data.
3. Clearly distinguish between: verified flight data, standard airport procedure, and things the traveler must confirm at the airport.
4. Always advise confirming final gate at airport.
5. Respond in language: "${language}".
6. Use numbered steps. Be concise and practical.`;

    const contextMsg = `INBOUND FLIGHT: ${JSON.stringify(inboundFlight)}
OUTBOUND FLIGHT: ${JSON.stringify(outboundFlight)}`;

    if (this.isConfigured) {
      try {
        const res = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${contextMsg}\n\nPlease give me step-by-step transfer instructions.` }
          ],
          temperature: 0.3,
          max_tokens: 800
        });
        return {
          guide: res.choices[0].message.content,
          isAiGenerated: true,
          language,
          modelUsed: 'gpt-4o-mini'
        };
      } catch (err) {
        console.warn('⚠️ [Journey] OpenAI transfer guide failed:', err.message);
      }
    }

    return this._transferFallback({ inboundFlight, outboundFlight, language });
  }

  _transferFallback({ inboundFlight, outboundFlight, language }) {
    const arrTerminal = inboundFlight?.arrival?.terminal || 'your arrival terminal';
    const depTerminal = outboundFlight?.departure?.terminal || 'the departure terminal';
    const arrIata = inboundFlight?.arrival?.iata || 'your arrival airport';
    const depIata = outboundFlight?.departure?.iata || '';
    const sameTerminal = arrTerminal === depTerminal;
    const international = inboundFlight?.international || false;

    const steps = [
      `**Step 1 — Exit Aircraft:** Follow signs to "Arrivals" or "Connections" at ${arrIata}.`,
      international
        ? `**Step 2 — Immigration/Passport Control:** As this is an international arrival, you must clear passport control. Have your passport and any required visa or entry documents ready.`
        : `**Step 2 — No Re-entry Needed:** This appears to be a domestic arrival — you generally do not need to re-clear immigration, but confirm at the airport.`,
      `**Step 3 — Baggage:** If your bags are checked through to your final destination on a single booking, you may not need to collect them. If on separate tickets, collect bags and recheck at the departure terminal. ⚠️ Confirm with your airline at the information desk.`,
      sameTerminal
        ? `**Step 4 — Terminal:** Both flights use **Terminal ${arrTerminal}** — proceed to security and your departure gate.`
        : `**Step 4 — Change Terminal:** Your departure is from **Terminal ${depTerminal}**. Follow terminal transfer signs, or ask airport staff for the shuttle or inter-terminal transport.`,
      `**Step 5 — Security & Gate:** Re-clear security screening if required. Monitor departure boards for your gate number for flight ${outboundFlight?.flightNumber || depIata}. Gates are typically assigned 1–2 hours before departure.`,
      `**Step 6 — Board:** Arrive at your gate at least 30–45 minutes before departure. Boarding typically starts 30–45 minutes before scheduled departure.`,
      `\n⚠️ **Always confirm transfer procedures, gate assignments, and baggage handling with airline staff or the airport information desk.**`
    ];

    return {
      guide: steps.join('\n\n'),
      isAiGenerated: false,
      language,
      modelUsed: 'aeromate-rule-engine'
    };
  }

  // ─── Journey Impact Engine ─────────────────────────────────────────────────

  async analyzeImpact({ segments, disruption, language = 'en' }) {
    const systemPrompt = `You are AeroMate's Journey Impact Analyzer. Evaluate how a flight disruption affects a traveler's complete journey.

STRICT RULES:
1. Evaluate each subsequent segment chronologically.
2. Calculate connection buffer times when arrival/departure times are available.
3. Assign severity: LOW (buffer > 90 min), MEDIUM (30-90 min), HIGH (< 30 min or missed).
4. Never declare a connection definitively missed without clear time data.
5. Recommend concrete next steps.
6. Respond in language: "${language}".
7. Return structured analysis in clear sections.`;

    if (this.isConfigured) {
      try {
        const res = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `SEGMENTS: ${JSON.stringify(segments)}\nDISRUPTION: ${JSON.stringify(disruption)}\n\nAnalyze the journey impact.`
            }
          ],
          temperature: 0.3,
          max_tokens: 900
        });
        return {
          analysis: res.choices[0].message.content,
          isAiGenerated: true,
          language,
          modelUsed: 'gpt-4o-mini'
        };
      } catch (err) {
        console.warn('⚠️ [Journey] OpenAI impact analysis failed:', err.message);
      }
    }

    return this._impactFallback({ segments, disruption, language });
  }

  _impactFallback({ segments, disruption, language }) {
    const delayMin = disruption?.delayMinutes || 0;
    const status   = disruption?.status || 'delayed';
    const flightNum = disruption?.flightNumber || 'your flight';

    let severity = 'LOW';
    let sevColor = '🟢';
    if (delayMin > 90) { severity = 'HIGH'; sevColor = '🔴'; }
    else if (delayMin > 30) { severity = 'MEDIUM'; sevColor = '🟡'; }

    const lines = [
      `## Journey Impact Analysis for ${flightNum}`,
      ``,
      `**Disruption:** ${status.toUpperCase()} — ${delayMin > 0 ? `${delayMin} minutes delay` : 'Status changed'}`,
      `**Overall Severity:** ${sevColor} ${severity}`,
      ``,
      `### Affected Segments`,
    ];

    if (segments && segments.length > 1) {
      segments.slice(1).forEach((seg, i) => {
        lines.push(`\n**Segment ${i + 2}:** ${seg.origin || '?'} → ${seg.destination || '?'} (${seg.flightNumber || 'Unknown'})`);
        if (delayMin > 90) {
          lines.push(`• ⚠️ **Risk:** Connection may be tight. Buffer has been reduced significantly.`);
          lines.push(`• **Action:** Contact airline now about alternative connections.`);
        } else if (delayMin > 30) {
          lines.push(`• ⚠️ **Risk:** Connection buffer reduced. Monitor closely.`);
          lines.push(`• **Action:** Watch for gate updates and be ready to move quickly.`);
        } else {
          lines.push(`• ✅ Likely manageable — standard airport transfer time should suffice.`);
        }
      });
    } else {
      lines.push(`No onward connections identified. This appears to be a single-leg journey.`);
    }

    lines.push(`\n### Recommended Next Steps`);
    if (status === 'cancelled') {
      lines.push(`1. Head to the airline's service desk immediately or open their app.`);
      lines.push(`2. Request rebooking on the next available flight at no additional cost.`);
      lines.push(`3. You are entitled to meals/accommodation if delay exceeds required thresholds.`);
    } else {
      lines.push(`1. Monitor the flight board and airline app for updates.`);
      if (delayMin > 60) lines.push(`2. Contact the airline proactively about onward connections.`);
      lines.push(`3. Check if your travel insurance covers missed connections.`);
    }

    lines.push(`\n_Note: This analysis is based on available data. Confirm all details with the airline._`);

    return {
      analysis: lines.join('\n'),
      severity,
      isAiGenerated: false,
      language,
      modelUsed: 'aeromate-rule-engine'
    };
  }

  // ─── Baggage Guidance ──────────────────────────────────────────────────────

  async getBaggageGuidance({ flightNumber, airline, status, segments, language = 'en' }) {
    const systemPrompt = `You are AeroMate's baggage assistance expert. Provide clear, honest baggage guidance.

STRICT RULES:
1. NEVER invent specific carousel numbers or claim real-time bag tracking unless confirmed by integration.
2. Explain the difference between through-checked baggage and separate-ticket bags.
3. Provide airline contact resources and baggage desk instructions.
4. If status is unavailable, explain what the traveler should do next.
5. Respond in language: "${language}".`;

    if (this.isConfigured) {
      try {
        const res = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `FLIGHT: ${flightNumber} (${airline}), STATUS: ${status}\nSEGMENTS: ${JSON.stringify(segments)}\n\nProvide baggage guidance and instructions.`
            }
          ],
          temperature: 0.3,
          max_tokens: 600
        });
        return {
          guidance: res.choices[0].message.content,
          isAiGenerated: true,
          language,
          modelUsed: 'gpt-4o-mini'
        };
      } catch (err) {
        console.warn('⚠️ [Journey] OpenAI baggage guidance failed:', err.message);
      }
    }

    return this._baggageFallback({ flightNumber, airline, language });
  }

  _baggageFallback({ flightNumber, airline, language }) {
    const guidance = [
      `## Baggage Guidance for ${flightNumber || 'your flight'}`,
      ``,
      `⚠️ **Live baggage tracking is not available** — no real-time integration with ${airline || 'the airline'}'s baggage system is active.`,
      ``,
      `### What to Do`,
      `1. **On Arrival:** Follow "Baggage Claim" signs to the carousel area. Your carousel number will appear on the arrivals board once the flight has landed.`,
      `2. **Carousel Assignment:** Check the airport's baggage claim screens — look for your flight number ${flightNumber || ''} to see the assigned carousel.`,
      `3. **Waiting Time:** Bags typically appear on the carousel within 15–30 minutes after landing. International flights may take longer.`,
      `4. **Tag Reference:** Keep your baggage tag receipts. You'll need them if a bag is delayed or missing.`,
      ``,
      `### If Your Bag Doesn't Arrive`,
      `1. Do not leave the baggage area — go directly to the airline's **Baggage Services Desk** (usually near the carousel area).`,
      `2. File a **Property Irregularity Report (PIR)** before leaving the airport.`,
      `3. Keep the PIR reference number — it's essential for tracking and compensation claims.`,
      ``,
      `### Connecting Flights`,
      `- If on a **single booking**: Bags are usually checked through to your final destination — you may not need to collect them at the connecting airport.`,
      `- If on **separate tickets**: You must collect and recheck your bags at each connection point.`,
      `- ⚠️ Always confirm baggage handling with the airline before your flight.`,
      ``,
      `_Confirm carousel and baggage status at the airport or via the airline's mobile app._`
    ].join('\n');

    return {
      guidance,
      isAiGenerated: false,
      language,
      modelUsed: 'aeromate-rule-engine'
    };
  }

  // ─── Hold-Trip Consequences ────────────────────────────────────────────────

  async getHoldConsequences({ currentTrip, proposedChange, language = 'en' }) {
    const systemPrompt = `You are AeroMate's travel decision advisor. Help travelers understand the consequences of postponing or changing their trip.

STRICT RULES:
1. Clearly distinguish between KNOWN consequences (confirmed facts) and POSSIBLE consequences (estimates).
2. NEVER promise refunds, fee waivers, seat availability, or specific fare prices.
3. Always recommend the traveler contact the airline directly for authoritative answers.
4. If the user provides fare information, use it; otherwise state that fare rules were not provided.
5. Respond in language: "${language}".`;

    if (this.isConfigured) {
      try {
        const res = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `CURRENT TRIP: ${JSON.stringify(currentTrip)}\nPROPOSED CHANGE: ${JSON.stringify(proposedChange)}\n\nWhat are the consequences of this change?`
            }
          ],
          temperature: 0.4,
          max_tokens: 700
        });
        return {
          consequences: res.choices[0].message.content,
          isAiGenerated: true,
          language,
          modelUsed: 'gpt-4o-mini'
        };
      } catch (err) {
        console.warn('⚠️ [Journey] OpenAI hold check failed:', err.message);
      }
    }

    return this._holdFallback({ currentTrip, proposedChange, language });
  }

  _holdFallback({ currentTrip, proposedChange, language }) {
    const flightNum = currentTrip?.flightNumber || 'your flight';
    const changeType = proposedChange?.type || 'postpone';

    const lines = [
      `## Hold/Change Consequences for ${flightNum}`,
      ``,
      `**Proposed Change:** ${changeType}`,
      ``,
      `### Possible Consequences`,
      `1. **Fare Difference:** If rescheduling, you may be required to pay the difference between your original fare and the new fare. _(Exact amounts depend on your fare rules — check your ticket conditions.)_`,
      `2. **Change Fees:** Many fare types incur change fees. Low-cost carriers often have higher fees. Flexible/refundable fares may have no fee.`,
      `3. **Seat Availability:** There is no guarantee that seats will be available on your preferred alternative date.`,
      `4. **Connecting Flights:** If any segments are on separate tickets, changes may not cascade automatically.`,
      `5. **Hotel & Ground Transport:** Postponing may incur cancellation fees if hotel/transport bookings are non-refundable.`,
      ``,
      `### What You Should Do`,
      `1. Check your **ticket conditions** (usually in your booking confirmation email) for change/cancellation rules.`,
      `2. Contact the **airline's customer service** before making changes.`,
      `3. Review your **travel insurance policy** — it may cover some change costs if the reason qualifies.`,
      `4. If the change is due to an airline disruption (not your choice), you have stronger rights.`,
      ``,
      `⚠️ _All cost estimates above are general guidance only. Actual charges depend on your specific fare rules. Contact the airline for confirmed amounts._`
    ];

    return {
      consequences: lines.join('\n'),
      isAiGenerated: false,
      language,
      modelUsed: 'aeromate-rule-engine'
    };
  }
}

module.exports = new JourneyService();
