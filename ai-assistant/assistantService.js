const path = require('path');
const fs = require('fs');

// Ensure modules can be loaded from backend/node_modules when running standalone
const backendNodeModules = path.join(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.push(backendNodeModules);
}

let OpenAI;
try {
  OpenAI = require('openai').OpenAI;
} catch (e) {
  // Lazy require fallback if openai package is loaded dynamically
}

let openaiClient = null;

/**
 * Returns an instantiated OpenAI client if OPENAI_API_KEY is available in process.env
 */
function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY && OpenAI) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Loads system prompt template from ai-assistant/prompts/disruption-system-prompt.md
 */
function loadSystemPrompt() {
  try {
    const promptPath = path.join(__dirname, 'prompts', 'disruption-system-prompt.md');
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
  } catch (err) {
    console.warn('⚠️ Could not read system prompt file, using default fallback prompt.');
  }

  return `You are AeroMate, an empathetic, highly knowledgeable AI Aviation Companion.
Your mission is to relieve travel stress, explain flight status, and give practical disruption guidance (EU261, US DOT, DGCA rights).
Always distinguish verified flight data from general travel advice. Respond warmly and concisely in the requested language.`;
}

/**
 * Normalizes flight context input to ensure consistent field names and missing-value guardrails.
 */
function normalizeFlightContext(rawContext = {}) {
  if (!rawContext || typeof rawContext !== 'object') {
    return null;
  }

  const flightNumber = rawContext.flightNumber ? String(rawContext.flightNumber).trim().toUpperCase() : 'TBD';
  const airline = rawContext.airline ? String(rawContext.airline).trim() : 'Unavailable';
  const status = rawContext.status ? String(rawContext.status).trim().toLowerCase() : 'scheduled';

  const origin = rawContext.origin ? String(rawContext.origin).trim().toUpperCase() : 'TBD';
  const destination = rawContext.destination ? String(rawContext.destination).trim().toUpperCase() : 'TBD';

  const scheduledDeparture = rawContext.scheduledDeparture || rawContext.scheduledDep || 'TBD';
  const estimatedDeparture = rawContext.estimatedDeparture || rawContext.estimatedDep || 'TBD';

  let delayMinutes = 0;
  if (typeof rawContext.delayMinutes === 'number' && !isNaN(rawContext.delayMinutes)) {
    delayMinutes = Math.max(0, Math.floor(rawContext.delayMinutes));
  } else if (rawContext.delayMinutes && !isNaN(parseInt(rawContext.delayMinutes, 10))) {
    delayMinutes = Math.max(0, parseInt(rawContext.delayMinutes, 10));
  }

  const gate = rawContext.gate ? String(rawContext.gate).trim() : 'TBD';
  const terminal = rawContext.terminal ? String(rawContext.terminal).trim() : 'TBD';

  const hasFlightDetails = flightNumber !== 'TBD' || origin !== 'TBD' || destination !== 'TBD';

  return {
    flightNumber,
    airline,
    status,
    origin,
    destination,
    scheduledDeparture,
    estimatedDeparture,
    delayMinutes,
    gate,
    terminal,
    hasFlightDetails,
    isVerified: !!rawContext.isVerified,
  };
}

/**
 * Deterministic Passenger Rights evaluation rules engine.
 */
function determinePassengerRights(flightContext = {}) {
  const norm = normalizeFlightContext(flightContext);
  if (!norm || !norm.hasFlightDetails) {
    return {
      jurisdiction: 'General Global Aviation Standards',
      rightsSummary: ['No verified flight route or airline provided. General airline Conditions of Carriage apply.'],
      qualificationNotice: 'Confirm specific terms with your airline customer service representative.',
    };
  }

  const { origin, destination, delayMinutes, status, airline } = norm;
  const isDelayed = status === 'delayed' || delayMinutes > 0;
  const isCancelled = status === 'cancelled';

  const euAirports = ['CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MUC', 'ZRH', 'VIE', 'BRU', 'DUB'];
  const ukAirports = ['LHR', 'LGW', 'STN', 'MAN', 'EDI', 'BHX'];
  const inAirports = ['BOM', 'DEL', 'BLR', 'MAA', 'CCU', 'HYD', 'AMD', 'COK', 'GOI'];
  const usAirports = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'ATL', 'EWR', 'DFW', 'BOS', 'IAD'];

  const euUkAirports = [...euAirports, ...ukAirports];

  // Identifiers for EU / UK Community Carriers
  const euUkCarriers = ['BA', 'BRITISH AIRWAYS', 'AF', 'AIR FRANCE', 'LH', 'LUFTHANSA', 'KL', 'KLM', 'IB', 'IBERIA', 'EI', 'AER LINGUS'];
  const airlineUpper = airline.toUpperCase();
  const isEUUKCarrier = euUkCarriers.some(c => airlineUpper.includes(c));

  let jurisdiction = 'General International IATA Standards';
  let rightsSummary = [];
  let qualificationNotice = 'Eligibility is conditional on delay cause (extraordinary vs controllable), verified arrival delay, and airline confirmation.';

  const departsEUUK = euUkAirports.includes(origin);
  const arrivesEUUK = euUkAirports.includes(destination);
  const departsIN = inAirports.includes(origin);
  const departsUS = usAirports.includes(origin);

  // 1. EU261 / UK Air Passenger Rights Evaluation
  if (departsEUUK || (arrivesEUUK && isEUUKCarrier)) {
    jurisdiction = departsEUUK && ukAirports.includes(origin)
      ? 'UK Air Passenger Rights (Retained EU261 Law)'
      : 'EU Regulation 261/2004 Passenger Protections';

    if (isCancelled || delayMinutes >= 180) {
      rightsSummary.push(
        'Conditional Cash Compensation (€250 - €600): Requires final arrival delay ≥ 3 hours and that the disruption is controllable by the airline (not caused by extraordinary circumstances like severe weather or ATC strikes).'
      );
    }
    if (delayMinutes >= 120) {
      rightsSummary.push('Right to Care: Free meals, refreshments, and access to 2 communications (calls/emails).');
    }
    if (delayMinutes >= 300 || isCancelled) {
      rightsSummary.push('Right to Refund or Rebooking: 100% full ticket refund within 7 days OR rebooking on the next available flight at no additional cost.');
    }
  }
  // 2. Indian DGCA Passenger Charter
  else if (departsIN) {
    jurisdiction = 'Indian DGCA Passenger Charter Guidelines';
    if (delayMinutes >= 120 && delayMinutes < 360) {
      rightsSummary.push('Airline Assistance: Free meals and refreshments provided at the airport.');
    } else if (delayMinutes >= 360) {
      rightsSummary.push('Alternative Flight / Refund: Airline must offer alternate flight option or 100% full refund.');
    }
    if (isCancelled) {
      rightsSummary.push('Cancellation Entitlement: Full ticket refund or alternate flight + compensation up to ₹10,000 depending on notification lead time.');
    }
  }
  // 3. US DOT Rules (Non-EU carrier departing US or US domestic)
  else if (departsUS || usAirports.includes(destination)) {
    jurisdiction = 'US Department of Transportation (US DOT) Rules';
    if (isCancelled) {
      rightsSummary.push('Mandatory Refund Rule: Full cash refund (not just airline vouchers) guaranteed if you choose not to travel after a cancellation.');
    }
    if (isDelayed) {
      rightsSummary.push('Controllable Delay Assistance: Request meal or hotel vouchers from gate agents based on airline customer service commitments.');
    }
  }

  if (rightsSummary.length === 0) {
    if (isDelayed) {
      rightsSummary.push('Monitor airport monitor screens and inquire at your departure gate desk for updates.');
    } else if (isCancelled) {
      rightsSummary.push('Contact airline customer service for rebooking assistance and refund instructions.');
    } else {
      rightsSummary.push('Flight currently operating as scheduled. Ensure you arrive at the gate before boarding begins.');
    }
  }

  return { jurisdiction, rightsSummary, qualificationNotice };
}

/**
 * Builds the structured system message context block.
 */
function buildFlightContextString(flightContext = {}) {
  const norm = normalizeFlightContext(flightContext);
  if (!norm || !norm.hasFlightDetails) {
    return `=== CURRENT INJECTED FLIGHT CONTEXT ===
Status: No verified flight context provided. Answer general passenger questions calmly.
=======================================`;
  }

  const rights = determinePassengerRights(flightContext);

  return `=== CURRENT INJECTED FLIGHT CONTEXT ===
- Flight Number: ${norm.flightNumber}
- Airline: ${norm.airline}
- Route: ${norm.origin} ➔ ${norm.destination}
- Status: ${norm.status.toUpperCase()}
- Delay Duration: ${norm.delayMinutes} minutes
- Scheduled Departure: ${norm.scheduledDeparture}
- Estimated Departure: ${norm.estimatedDeparture}
- Gate / Terminal: Gate ${norm.gate}, Terminal ${norm.terminal}
- Data Freshness: ${norm.isVerified ? 'Verified Live System Payload' : 'Unverified / Static Context Input'}
- Applicable Jurisdiction: ${rights.jurisdiction}
- Evaluated Passenger Protections:
  ${rights.rightsSummary.map(r => `* ${r}`).join('\n  ')}
- Notice: ${rights.qualificationNotice}
=======================================`;
}

/**
 * Automatic language detection helper.
 */
function detectLanguage(message = '', history = []) {
  if (!message || typeof message !== 'string') return 'en';

  const text = message.trim();

  // Hindi Unicode range or distinct Hindi romanized keywords
  if (/[\u0900-\u097F]/.test(text) || /(kya|kab|samay|namaste|batao|milega|haim|chahiye)/i.test(text)) {
    return 'hi';
  }
  // Spanish keywords or punctuation
  if (/[¿¡]/.test(text) || /(vuelo|retraso|derechos|cancelado|gracias|hola|puerta|embarque)/i.test(text)) {
    return 'es';
  }
  // French keywords
  if (/(vol|retard|annulé|annule|droits|merci|bonjour|porte|heure)/i.test(text)) {
    return 'fr';
  }
  // German keywords
  if (/(flug|verspätung|verspaetung|verspätet|storniert|rechte|danke|hallo)/i.test(text)) {
    return 'de';
  }
  // Japanese Unicode range
  if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return 'ja';
  }

  return 'en';
}

/**
 * Deterministic multi-language offline response generator.
 */
function generateOfflineFallbackResponse(userMessage, flightContext = {}, language = 'en') {
  const norm = normalizeFlightContext(flightContext);
  const rights = determinePassengerRights(flightContext);
  const lang = (language && language !== 'auto') ? language.toLowerCase() : detectLanguage(userMessage);

  const flightNo = norm?.flightNumber !== 'TBD' ? norm.flightNumber : 'your flight';
  const routeStr = norm && norm.origin !== 'TBD' && norm.destination !== 'TBD' ? ` (${norm.origin} ➔ ${norm.destination})` : '';
  const gateStr = norm?.gate !== 'TBD' ? `Gate ${norm.gate}` : 'Gate TBD (Check airport monitors)';
  const termStr = norm?.terminal !== 'TBD' ? `Terminal ${norm.terminal}` : 'Terminal TBD';
  const statusStr = norm ? norm.status.toUpperCase() : 'SCHEDULED';
  const delayStr = norm?.delayMinutes > 0 ? `(${norm.delayMinutes} min delay)` : '';

  const rightsFormatted = rights.rightsSummary.map(r => `• ${r}`).join('\n');

  if (lang === 'hi') {
    return `📍 **फ़्लाइट स्थिति (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **स्थान:** ${termStr}, ${gateStr}

⚖️ **आपके अधिकार और सुरक्षा (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **अनुशंसित अगले कदम:**
1. एयरलाइन काउंटर / गेट एजेंट से संपर्क करें।
2. सभी रसीदें संभालकर रखें।

*(नोट: AeroMate ऑफ़लाइन मोड में काम कर रहा है।)*`;
  }

  if (lang === 'es') {
    return `📍 **Estado del vuelo (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **Ubicación:** ${termStr}, ${gateStr}

⚖️ **Sus derechos de pasajero (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **Pasos recomendados:**
1. Verifique la información en el mostrador de la aerolínea en el aeropuerto.
2. Guarde todos los recibos si solicita vales de comida o reembolso.

*(Nota: AeroMate operando en modo fuera de línea.)*`;
  }

  if (lang === 'fr') {
    return `📍 **Statut du vol (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **Emplacement:** ${termStr}, ${gateStr}

⚖️ **Vos droits de passager (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **Prochaines étapes recommandées:**
1. Renseignez-vous auprès du comptoir de la compagnie aérienne à l'aéroport.
2. Conservez tous vos reçus de dépenses.

*(Remarque: AeroMate fonctionne en mode hors ligne.)*`;
  }

  if (lang === 'de') {
    return `📍 **Flugstatus (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **Standort:** ${termStr}, ${gateStr}

⚖️ **Ihre Fahrgastrechte (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **Empfohlene nächste Schritte:**
1. Bitte erkundigen Sie sich am Schalter der Fluggesellschaft am Flughafen.
2. Bewahren Sie alle Belege für Verpflegung auf.

*(Hinweis: AeroMate läuft im Offline-Modus.)*`;
  }

  if (lang === 'ja') {
    return `📍 **フライト状態 (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **場所:** ${termStr}, ${gateStr}

⚖️ **搭乗者権利規約 (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **推奨される次のステップ:**
1. 空港の航空会社カウンターで最新情報をご確認ください。
2. 領収書やバウチャーを大切に保管してください。

*(注意: AeroMate オフラインモードで動作中)*`;
  }

  // Default English response
  return `📍 **Flight Status (${flightNo}${routeStr}):** ${statusStr} ${delayStr}
🏢 **Location:** ${termStr}, ${gateStr}

⚖️ **Your Passenger Rights (${rights.jurisdiction}):**
${rightsFormatted}

✈️ **Recommended Next Steps:**
1. Verify latest flight details at your departure gate desk (${gateStr}).
2. Keep all meal and transport receipts if requesting airline vouchers or reimbursements.

*(Note: Operating in AeroMate offline mode. Add OPENAI_API_KEY to backend environment for live completion.)*`;
}

/**
 * Validates and sanitizes chat history array.
 */
function validateHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item => item && typeof item === 'object')
    .slice(-10) // Limit to last 10 messages for context window management
    .map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.content || item.text || '').trim(),
    }))
    .filter(item => item.content.length > 0);
}

/**
 * Main chat handler function for /api/assistant/chat
 * Compatible with backend/src/routes/assistant.js
 *
 * @param {Object} params - { message, flightContext, language, history }
 * @returns {Promise<Object>}
 */
async function processAssistantChat({ message, flightContext = {}, language = 'en', history = [] }) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('The "message" parameter is required and must be a non-empty string.');
  }

  const cleanMessage = message.trim();
  const targetLanguage = (language && language !== 'auto') ? language.toLowerCase() : detectLanguage(cleanMessage, history);
  const normalizedContext = normalizeFlightContext(flightContext);
  const sanitizedHistory = validateHistory(history);

  const openai = getOpenAIClient();

  // If no OpenAI client or API Key, return deterministic fallback
  if (!openai) {
    return {
      reply: generateOfflineFallbackResponse(cleanMessage, normalizedContext, targetLanguage),
      mode: 'offline_mock',
      flightContextApplied: !!(normalizedContext && normalizedContext.hasFlightDetails),
      timestamp: new Date().toISOString(),
    };
  }

  const systemPromptTemplate = loadSystemPrompt();
  const contextString = buildFlightContextString(normalizedContext);

  const fullSystemMessage = `${systemPromptTemplate}

${contextString}

Target Response Language: ${targetLanguage.toUpperCase()}
Instruction: Respond directly to the passenger in ${targetLanguage.toUpperCase()}. Follow the 3-part layout (Status, Rights, Action Steps). Keep flight numbers, airport codes, times, and gates unchanged.`;

  const messages = [
    { role: 'system', content: fullSystemMessage },
    ...sanitizedHistory,
    { role: 'user', content: cleanMessage },
  ];

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.3,
      max_tokens: 650,
    });

    const reply = completion.choices[0]?.message?.content || generateOfflineFallbackResponse(cleanMessage, normalizedContext, targetLanguage);

    return {
      reply,
      mode: 'live_openai',
      model: model,
      flightContextApplied: !!(normalizedContext && normalizedContext.hasFlightDetails),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ OpenAI API Error in processAssistantChat:', error.message);

    return {
      reply: generateOfflineFallbackResponse(cleanMessage, normalizedContext, targetLanguage),
      mode: 'fallback_error',
      error: error.message,
      flightContextApplied: !!(normalizedContext && normalizedContext.hasFlightDetails),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  processAssistantChat,
  normalizeFlightContext,
  determinePassengerRights,
  buildFlightContextString,
  generateOfflineFallbackResponse,
  detectLanguage,
  validateHistory,
};
