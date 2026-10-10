const path = require('path');
const OpenAI = require('openai');

let kaustubhService = null;
try {
  kaustubhService = require(path.join(__dirname, '../../../ai-assistant/assistantService.js'));
} catch (e) {
  // If not found in sibling dir, use internal logic
}

class AssistantService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.elevateKey = process.env.ELEVATE_TEAM_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  get isConfigured() {
    return (!!this.apiKey && !this.apiKey.includes('your-') && !this.apiKey.includes('placeholder')) || !!this.elevateKey;
  }

  async generateTravelGuidance({ message, flightContext, language = 'en', history = [] }) {
    if (!message) {
      throw new Error('User message is required.');
    }

    // 1. Try Elevate Team AI API if configured
    if (this.elevateKey) {
      try {
        return await this.callElevateAI({ message, flightContext, language, history });
      } catch (err) {
        console.warn(`⚠️ [Assistant] Elevate AI request failed (${err.message}). Trying secondary engine.`);
      }
    }

    // 2. Try OpenAI if configured
    if (this.apiKey && !this.apiKey.includes('your-') && !this.apiKey.includes('placeholder')) {
      try {
        return await this.callOpenAI({ message, flightContext, language, history });
      } catch (err) {
        console.warn(`⚠️ [Assistant] OpenAI request failed (${err.message}). Falling back to rule engine.`);
        return this.generateOfflineFallback({ message, flightContext, language });
      }
    }

    // Deterministic resilient fallback if neither is configured
    return this.generateOfflineFallback({ message, flightContext, language });
  }

  async callElevateAI({ message, flightContext, language = 'en', history = [] }) {
    const systemPrompt = `You are AeroMate AI, an empathetic, expert aviation journey companion.
Explain flight updates, provide clear disruption guidance (delays, cancellations, rebooking), and assist travelers.
Explain passenger rights (DGCA India, EU261 Europe, US DOT) where applicable.
Respond politely and clearly in the requested language: "${language}".`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (flightContext) {
      messages.push({
        role: 'system',
        content: `CURRENT FLIGHT CONTEXT:\n${JSON.stringify(flightContext, null, 2)}`
      });
    }

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach(h => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content || h.message || ''
        });
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://elevate1-0.vercel.app/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.elevateKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages,
        max_completion_tokens: 3000,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || `AI request failed with status ${response.status}`);
    }

    return {
      reply: data.choices?.[0]?.message?.content || '',
      language,
      modelUsed: 'gpt-5-mini',
      isAiGenerated: true
    };
  }


  async callOpenAI({ message, flightContext, language, history }) {
    const systemPrompt = `You are AeroMate, an empathetic, expert AI aviation journey companion.
Your goal is to explain flight updates, provide clear disruption guidance (delays, cancellations, gate changes), and assist travelers.

CORE GUIDELINES:
1. Always ground your answers in the provided flight context if present.
2. Clearly distinguish VERIFIED FLIGHT DATA (official airline schedules, gates) from GENERAL ADVICE (passenger rights, lounge access).
3. If the flight is delayed by > 3 hours:
   - For UK/EU flights: Explain EU261/UK261 rights (cash compensation up to €600, meals, drinks).
   - For India flights: Mention DGCA passenger charter (food/water after 2h, alternative flights/full refund if >6h).
   - For US flights: Mention recent DOT refund mandates and airline commitment dashboards.
4. If cancelled: Explain immediate rebooking steps at the customer desk or app, and right to full refund.
5. Provide response strictly in the requested language: "${language}".
6. Be concise, polite, structured with bullet points, and reassuring.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (flightContext) {
      messages.push({
        role: 'system',
        content: `CURRENT FLIGHT CONTEXT:\n${JSON.stringify(flightContext, null, 2)}`
      });
    }

    // Append prior conversational turns (limit last 6 for token control)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content || h.message || ''
      }));
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: message });

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 650
    });

    return {
      reply: completion.choices[0].message.content,
      language,
      modelUsed: 'gpt-4o-mini',
      isAiGenerated: true
    };
  }

  generateOfflineFallback({ message, flightContext, language }) {
    const lower = message.toLowerCase();
    const flightNum = flightContext?.flightNumber || 'your flight';
    const delay = flightContext?.delayMinutes || 0;
    const status = flightContext?.status || 'scheduled';

    // Multilingual response templates for demo
    if (language === 'hi' || lower.includes('hindi') || lower.includes('kya')) {
      if (delay > 60 || status === 'delayed') {
        return {
          reply: `✈️ **उड़ान अपडेट (${flightNum}):** आपकी उड़ान में लगभग ${delay} मिनट की देरी है।\n\n- **सलाह:** कृपया टर्मिनल पर एयरपोर्ट स्क्रीन पर नज़र रखें।\n- **अधिकार:** यदि देरी 2 घंटे से अधिक होती है, तो डीजीसीए नियमों के अनुसार एयरलाइन आपको जलपान (रिफ्रेशमेंट) प्रदान करने के लिए बाध्य है।`,
          language: 'hi',
          modelUsed: 'aeromate-rule-engine',
          isAiGenerated: false
        };
      }
      return {
        reply: `✈️ **उड़ान अपडेट (${flightNum}):** आपकी उड़ान वर्तमान में समय पर निर्धारित है। प्रस्थान समय से 2 घंटे पहले एयरपोर्ट पहुँचें।`,
        language: 'hi',
        modelUsed: 'aeromate-rule-engine',
        isAiGenerated: false
      };
    }

    if (language === 'es' || lower.includes('spanish')) {
      return {
        reply: `✈️ **Actualización de vuelo (${flightNum}):** Su vuelo tiene un estado de: **${status}** con una demora de **${delay} minutos**.\n\n- Si la demora supera las 3 horas, tiene derecho a vales de comida y posibles compensaciones bajo la normativa aérea aplicable.`,
        language: 'es',
        modelUsed: 'aeromate-rule-engine',
        isAiGenerated: false
      };
    }

    // Default English response
    if (status === 'delayed' || delay > 60 || lower.includes('delay') || lower.includes('late')) {
      return {
        reply: `✈️ **Flight Disruption Guidance for ${flightNum}:**\n\n` +
          `• **Current Status:** Delayed by **${delay} minutes**.\n` +
          `• **Estimated Departure:** ${flightContext?.departure?.estimated || 'Updated on airport boards'}.\n` +
          `• **Next Steps:**\n` +
          `  1. Do not leave the secure area if you have already cleared security, as gate announcements may happen quickly.\n` +
          `  2. Under passenger rights (EU261 / DGCA / DOT regulations), for delays exceeding 2-3 hours you are entitled to airline refreshment vouchers.\n` +
          `  3. Check the airline mobile app for instant rebooking options if you have connecting flights.`,
        language: 'en',
        modelUsed: 'aeromate-rule-engine',
        isAiGenerated: false
      };
    }

    if (status === 'cancelled' || lower.includes('cancel')) {
      return {
        reply: `🚨 **Flight Cancellation Advisory for ${flightNum}:**\n\n` +
          `• **Immediate Action:** Head directly to your airline's service desk or open their mobile app to select an alternative flight.\n` +
          `• **Compensation:** You are legally entitled to either a full refund or re-routing at the earliest opportunity at no extra charge.\n` +
          `• **Care & Assistance:** The airline must provide complimentary food, drink, and hotel accommodation if an overnight stay is needed.`,
        language: 'en',
        modelUsed: 'aeromate-rule-engine',
        isAiGenerated: false
      };
    }

    return {
      reply: `✈️ **Flight Assistant for ${flightNum}:**\n\n` +
        `• **Scheduled Status:** ${status.toUpperCase()}.\n` +
        `• **Departure:** Terminal ${flightContext?.departure?.terminal || '1'}, Gate ${flightContext?.departure?.gate || 'TBA'}.\n` +
        `• Feel free to ask me about baggage allowance, lounge access, or disruption claims!`,
      language: 'en',
      modelUsed: 'aeromate-rule-engine',
      isAiGenerated: false
    };
  }
}

module.exports = new AssistantService();
