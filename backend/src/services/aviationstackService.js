const axios = require('axios');

class AviationstackService {
  constructor() {
    this.apiKey = process.env.AVIATIONSTACK_API_KEY;
    this.baseUrl = 'http://api.aviationstack.com/v1';
  }

  get isConfigured() {
    return !!this.apiKey;
  }

  async getFlightStatus(flightNumber) {
    const cleanFlightNumber = flightNumber.toUpperCase().trim();

    if (!this.isConfigured) {
      console.log(`ℹ️ [Aviationstack] API key not provided. Returning curated mock status for ${cleanFlightNumber}.`);
      return this.getMockFlightStatus(cleanFlightNumber);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/flights`, {
        params: {
          access_key: this.apiKey,
          flight_iata: cleanFlightNumber,
          limit: 1
        },
        timeout: 7000
      });

      const flightData = response.data?.data?.[0];

      if (!flightData) {
        console.warn(`⚠️ [Aviationstack] No live records found for ${cleanFlightNumber}, using fallback.`);
        return this.getMockFlightStatus(cleanFlightNumber);
      }

      return this.formatFlightData(flightData);
    } catch (err) {
      console.warn(`⚠️ [Aviationstack] Live query failed for ${cleanFlightNumber}:`, err.message);
      return this.getMockFlightStatus(cleanFlightNumber);
    }
  }

  formatFlightData(item) {
    const depDelay = item.departure?.delay || 0;
    const arrDelay = item.arrival?.delay || 0;
    const totalDelay = Math.max(depDelay, arrDelay);

    let status = item.flight_status || 'scheduled';
    if (status === 'landed') status = 'active';

    return {
      flightNumber: item.flight?.iata || item.flight?.icao,
      airline: item.airline?.name || 'Airlines',
      airlineIata: item.airline?.iata || '',
      status: totalDelay > 15 && status !== 'cancelled' ? 'delayed' : status,
      delayMinutes: totalDelay,
      departure: {
        iata: item.departure?.iata,
        airport: item.departure?.airport,
        terminal: item.departure?.terminal || '1',
        gate: item.departure?.gate || 'B12',
        scheduled: item.departure?.scheduled,
        estimated: item.departure?.estimated || item.departure?.scheduled,
        actual: item.departure?.actual
      },
      arrival: {
        iata: item.arrival?.iata,
        airport: item.arrival?.airport,
        terminal: item.arrival?.terminal || '2',
        gate: item.arrival?.gate || 'A4',
        scheduled: item.arrival?.scheduled,
        estimated: item.arrival?.estimated || item.arrival?.scheduled,
        actual: item.arrival?.actual
      },
      aircraft: {
        registration: item.aircraft?.registration || 'N/A',
        iata: item.aircraft?.iata || 'A320'
      },
      liveAvailable: !!(item.live?.latitude && item.live?.longitude),
      lastUpdated: new Date().toISOString(),
      isMock: false
    };
  }

  getMockFlightStatus(flightNumber) {
    const now = new Date();
    const scheduledDep = new Date(now.getTime() + 1000 * 60 * 45).toISOString();
    const scheduledArr = new Date(now.getTime() + 1000 * 60 * 240).toISOString();

    // Preset scenarios for hackathon demo
    if (flightNumber === 'BA142') {
      const estimatedDep = new Date(now.getTime() + 1000 * 60 * 255).toISOString();
      return {
        flightNumber: 'BA142',
        airline: 'British Airways',
        airlineIata: 'BA',
        status: 'delayed',
        delayMinutes: 210,
        departure: {
          iata: 'LHR',
          airport: 'London Heathrow Airport',
          terminal: '5',
          gate: 'B36',
          scheduled: scheduledDep,
          estimated: estimatedDep,
          actual: null
        },
        arrival: {
          iata: 'JFK',
          airport: 'John F. Kennedy International Airport',
          terminal: '7',
          gate: '12',
          scheduled: scheduledArr,
          estimated: new Date(now.getTime() + 1000 * 60 * 450).toISOString(),
          actual: null
        },
        aircraft: { registration: 'G-XWBA', iata: 'A350-1000' },
        liveAvailable: true,
        lastUpdated: new Date().toISOString(),
        isMock: true
      };
    }

    if (flightNumber === 'AI645') {
      return {
        flightNumber: 'AI645',
        airline: 'Air India',
        airlineIata: 'AI',
        status: 'scheduled',
        delayMinutes: 0,
        departure: {
          iata: 'BOM',
          airport: 'Chhatrapati Shivaji Maharaj International',
          terminal: '2',
          gate: '48',
          scheduled: scheduledDep,
          estimated: scheduledDep,
          actual: null
        },
        arrival: {
          iata: 'DEL',
          airport: 'Indira Gandhi International Airport',
          terminal: '3',
          gate: '14A',
          scheduled: new Date(now.getTime() + 1000 * 60 * 165).toISOString(),
          estimated: new Date(now.getTime() + 1000 * 60 * 165).toISOString(),
          actual: null
        },
        aircraft: { registration: 'VT-EXF', iata: 'A320neo' },
        liveAvailable: true,
        lastUpdated: new Date().toISOString(),
        isMock: true
      };
    }

    // Default dynamic mock for any flight number
    return {
      flightNumber,
      airline: 'Global Skyways',
      airlineIata: flightNumber.slice(0, 2),
      status: 'scheduled',
      delayMinutes: 0,
      departure: {
        iata: 'SFO',
        airport: 'San Francisco International Airport',
        terminal: '2',
        gate: 'D5',
        scheduled: scheduledDep,
        estimated: scheduledDep,
        actual: null
      },
      arrival: {
        iata: 'ORD',
        airport: 'Chicago O\'Hare International Airport',
        terminal: '1',
        gate: 'C10',
        scheduled: scheduledArr,
        estimated: scheduledArr,
        actual: null
      },
      aircraft: { registration: 'N789GS', iata: 'B738' },
      liveAvailable: true,
      lastUpdated: new Date().toISOString(),
      isMock: true
    };
  }
}

module.exports = new AviationstackService();
