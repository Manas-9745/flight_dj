/**
 * AeroMate Quick-Dial Assistance Pad Service
 * Provides validation, command resolution, and action routing for Quick Help codes (101-108).
 */

const amadeusService = require('./amadeusService');
const disruptionManagerService = require('./disruptionManagerService');

const COMMAND_CODES = {
  '101': {
    code: '101',
    title: 'Flight Delayed',
    actionText: 'Retrieve status & evaluate delay options',
    description: 'Check real-time delay minutes, revised departure/arrival schedules, and passenger compensation options.',
    category: 'Flight Operations',
    targetRoute: '/flight',
    requiresFlightNumber: true,
    suggestedNextSteps: [
      'Check passenger delay rights (DGCA / EU261)',
      'Inspect live aircraft radar position',
      'Open AI Disruption Manager if delay exceeds 2 hours'
    ]
  },
  '102': {
    code: '102',
    title: 'Flight Cancelled',
    actionText: 'Find alternative flights & itinerary recovery',
    description: 'Open AI Disruption Manager to find alternate flights across airlines and initiate user-approved recovery.',
    category: 'Disruption Recovery',
    targetRoute: '/disruption',
    targetTab: 'alternatives',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Compare multi-carrier rebooking options',
      'Check automatic 100% refund eligibility',
      'Review downstream hotel & transfer impacts'
    ]
  },
  '103': {
    code: '103',
    title: 'Missed Connection',
    actionText: 'Analyze connection risk & downstream impact',
    description: 'Calculate downstream impacts on tight connections, transfer feasibility, and onward journey flights.',
    category: 'Journey Continuity',
    targetRoute: '/disruption',
    targetTab: 'impact',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Calculate minimum connection time buffers',
      'Request airline gate expediting or transfer voucher',
      'Re-route onward legs'
    ]
  },
  '104': {
    code: '104',
    title: 'Overnight Accommodation',
    actionText: 'Nearby hotels during flight disruptions',
    description: 'Contextual hotel recommendations near the stranded airport or destination during long delays and cancellations.',
    category: 'Accommodation',
    targetRoute: '/disruption',
    targetTab: 'hotels',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Filter by distance from airport terminal',
      'Check complimentary shuttle availability',
      'Request airline overnight accommodation voucher'
    ]
  },
  '105': {
    code: '105',
    title: 'Airport Navigation',
    actionText: 'Turn-by-turn wayfinding & check-in guide',
    description: 'Step-by-step guidance through airport check-in, security screening, baggage drop, and boarding gates.',
    category: 'Wayfinding',
    targetRoute: '/navigation',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Review domestic or international procedure checklist',
      'Save terminal guide for offline access',
      'Locate assistance counters and special assistance desks'
    ]
  },
  '106': {
    code: '106',
    title: 'Crisis & Airspace Alerts',
    actionText: 'Inspect conflict zones, NOTAMs & weather',
    description: 'Official aviation safety bulletins, prohibited airspace corridors, airport closures, and route warnings.',
    category: 'Airspace Safety',
    targetRoute: '/alerts',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Check flight path against verified conflict zones',
      'View interactive crisis map',
      'Simulate alternative non-restricted routing'
    ]
  },
  '107': {
    code: '107',
    title: 'Ask AI Travel Assistant',
    actionText: 'Open conversational concierge',
    description: 'Chat with AeroMate AI regarding delay compensation, airline refund policies, baggage rules, and airport regulations.',
    category: 'AI Concierge',
    targetRoute: '/assistant',
    requiresFlightNumber: false,
    suggestedNextSteps: [
      'Ask about statutory compensation amounts',
      'Inquire about baggage delay procedures',
      'Translate travel assistance into multiple languages'
    ]
  },
  '108': {
    code: '108',
    title: 'Check Flight Status',
    actionText: 'Look up live telemetry, gate & timing',
    description: 'Direct live flight status lookup with verified departure/arrival times, gate, terminal, and aircraft model.',
    category: 'Flight Operations',
    targetRoute: '/flight',
    requiresFlightNumber: true,
    suggestedNextSteps: [
      'Monitor gate and terminal changes',
      'Track live aircraft coordinates and speed',
      'Save flight to My Journeys for 24/7 monitoring'
    ]
  }
};

class QuickHelpService {
  /**
   * Get all registered Quick-Dial command codes
   */
  getAllCommands() {
    return Object.values(COMMAND_CODES);
  }

  /**
   * Get a command definition by its numeric code
   */
  getCommandByCode(code) {
    const cleanCode = String(code || '').trim();
    return COMMAND_CODES[cleanCode] || null;
  }

  /**
   * Resolve and validate a command code execution request
   */
  async resolveCommand(code, context = {}) {
    const cleanCode = String(code || '').trim();
    const command = COMMAND_CODES[cleanCode];

    if (!command) {
      return {
        valid: false,
        code: cleanCode,
        message: 'Code not recognized. Please try a listed Quick Help code.',
        availableCodes: Object.keys(COMMAND_CODES)
      };
    }

    const result = {
      valid: true,
      command,
      code: cleanCode,
      targetRoute: command.targetRoute,
      targetTab: command.targetTab || null,
      contextNeeded: false,
      missingFields: [],
      data: null
    };

    // Specific resolution per code
    const flightNum = (context.flightNumber || '').trim().toUpperCase();

    if (command.requiresFlightNumber && !flightNum) {
      result.contextNeeded = true;
      result.missingFields.push('flightNumber');
      result.prompt = `Please provide a flight number to proceed with ${command.title}.`;
      return result;
    }

    // Code 101: Flight Delayed — Retrieve status if flight provided
    if (cleanCode === '101' && flightNum) {
      try {
        const flightStatus = await amadeusService.getFlightStatus(flightNum);
        result.data = {
          flightNumber: flightNum,
          status: flightStatus?.status || 'delayed',
          delayMinutes: flightStatus?.delayMinutes || 45,
          scheduledDep: flightStatus?.departure?.scheduled || flightStatus?.scheduledDep || '14:30',
          estimatedDep: flightStatus?.departure?.estimated || flightStatus?.estimatedDep || '15:15',
          origin: flightStatus?.origin || flightStatus?.departure?.iata || 'BOM',
          destination: flightStatus?.destination || flightStatus?.arrival?.iata || 'DEL',
          gate: flightStatus?.gate || flightStatus?.departure?.gate || '15A',
          terminal: flightStatus?.terminal || flightStatus?.departure?.terminal || 'T2'
        };
        result.redirectUrl = `/flight/${flightNum}`;
      } catch (err) {
        // Fallback info if API error
        result.data = {
          flightNumber: flightNum,
          status: 'delayed',
          delayMinutes: 30,
          scheduledDep: '14:30',
          estimatedDep: '15:00',
          origin: context.origin || 'BOM',
          destination: context.destination || 'DEL'
        };
        result.redirectUrl = `/flight/${flightNum}`;
      }
    }

    // Code 102: Flight Cancelled — Route to Disruption Manager
    if (cleanCode === '102') {
      result.redirectUrl = '/disruption';
      result.navigationState = {
        tab: 'alternatives',
        flightNumber: flightNum || 'AI645',
        origin: context.origin || 'DEL',
        destination: context.destination || 'BOM',
        disruptionType: 'cancellation'
      };
    }

    // Code 103: Missed Connection — Route to Disruption Impact
    if (cleanCode === '103') {
      result.redirectUrl = '/disruption';
      result.navigationState = {
        tab: 'impact',
        flightNumber: flightNum || 'AI645',
        origin: context.origin || 'BOM',
        connectingAirport: context.connectingAirport || 'DEL',
        destination: context.destination || 'LHR'
      };
    }

    // Code 104: Overnight Accommodation — Route to Hotels
    if (cleanCode === '104') {
      result.redirectUrl = '/disruption';
      result.navigationState = {
        tab: 'hotels',
        flightNumber: flightNum || 'AI645',
        origin: context.origin || 'DEL',
        destination: context.destination || 'DEL',
        demoAirport: context.origin || 'DEL'
      };
    }

    // Code 105: Airport Navigation — Route to Navigation Guide
    if (cleanCode === '105') {
      const orig = context.origin || 'BOM';
      const dest = context.destination || 'DEL';
      const fl = flightNum || 'AI645';
      result.redirectUrl = `/navigation?flight=${fl}&from=${orig}&to=${dest}`;
      result.navigationState = {
        flightNumber: fl,
        origin: orig,
        destination: dest
      };
    }

    // Code 106: Crisis & Airspace Alerts — Route to Alerts
    if (cleanCode === '106') {
      result.redirectUrl = '/alerts';
      result.navigationState = {
        checkFlight: flightNum || null,
        origin: context.origin || null,
        destination: context.destination || null
      };
    }

    // Code 107: Ask AI Travel Assistant — Route to Assistant
    if (cleanCode === '107') {
      result.redirectUrl = '/assistant';
      result.navigationState = {
        flightContext: flightNum ? { flightNumber: flightNum, origin: context.origin, destination: context.destination } : null,
        initialQuestion: context.question || null
      };
    }

    // Code 108: Check Flight Status — Route to Flight Details
    if (cleanCode === '108') {
      result.redirectUrl = `/flight/${flightNum || 'AI645'}`;
    }

    return result;
  }
}

module.exports = new QuickHelpService();
