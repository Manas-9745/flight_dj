const axios = require('axios');
const cacheService = require('./cacheService');
const { getAirportByIata } = require('./airportsData');

class AviationstackService {
  constructor() {
    this.apiKey = process.env.AVIATIONSTACK_API_KEY;
    this.baseUrl = 'http://api.aviationstack.com/v1';
  }

  get isConfigured() {
    return Boolean(this.apiKey && !this.apiKey.includes('your-') && !this.apiKey.includes('placeholder'));
  }

  /**
   * Retrieves flight status with 120-second server-side caching
   */
  async getFlightStatus(flightNumber) {
    const cleanFlightNumber = flightNumber.toUpperCase().trim();
    const cacheKey = `flight:status:${cleanFlightNumber}`;

    return cacheService.getOrFetch(cacheKey, async () => {
      return this._fetchStatusFromProvider(cleanFlightNumber);
    }, 120 * 1000); // 120s cache
  }

  async _fetchStatusFromProvider(cleanFlightNumber) {
    if (!this.isConfigured) {
      console.log(`ℹ️ [Aviationstack] API key not provided. Returning curated status for ${cleanFlightNumber}.`);
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

    const depIata = item.departure?.iata;
    const arrIata = item.arrival?.iata;
    const depAirportObj = getAirportByIata(depIata);
    const arrAirportObj = getAirportByIata(arrIata);

    return {
      flightNumber: item.flight?.iata || item.flight?.icao,
      airline: item.airline?.name || 'Airlines',
      airlineIata: item.airline?.iata || '',
      status: totalDelay > 15 && status !== 'cancelled' ? 'delayed' : status,
      delayMinutes: totalDelay,
      departure: {
        iata: depIata,
        airport: item.departure?.airport || depAirportObj?.name,
        terminal: item.departure?.terminal || '1',
        gate: item.departure?.gate || 'B12',
        scheduled: item.departure?.scheduled,
        estimated: item.departure?.estimated || item.departure?.scheduled,
        actual: item.departure?.actual,
        lat: depAirportObj?.lat,
        lng: depAirportObj?.lng
      },
      arrival: {
        iata: arrIata,
        airport: item.arrival?.airport || arrAirportObj?.name,
        terminal: item.arrival?.terminal || '2',
        gate: item.arrival?.gate || 'A4',
        scheduled: item.arrival?.scheduled,
        estimated: item.arrival?.estimated || item.arrival?.scheduled,
        actual: item.arrival?.actual,
        lat: arrAirportObj?.lat,
        lng: arrAirportObj?.lng
      },
      aircraft: {
        registration: item.aircraft?.registration || 'N/A',
        iata: item.aircraft?.iata || 'A320'
      },
      liveAvailable: Boolean(item.live?.latitude && item.live?.longitude),
      latitude: item.live?.latitude,
      longitude: item.live?.longitude,
      lastUpdated: new Date().toISOString(),
      isMock: false
    };
  }

  getMockFlightStatus(flightNumber) {
    const now = new Date();
    const scheduledDep = new Date(now.getTime() + 1000 * 60 * 45).toISOString();
    const scheduledArr = new Date(now.getTime() + 1000 * 60 * 240).toISOString();

    if (flightNumber === 'BA142') {
      const estimatedDep = new Date(now.getTime() + 1000 * 60 * 255).toISOString();
      const depAirport = getAirportByIata('LHR');
      const arrAirport = getAirportByIata('JFK');
      return {
        flightNumber: 'BA142',
        airline: 'British Airways',
        airlineIata: 'BA',
        status: 'delayed',
        delayMinutes: 210,
        departure: {
          iata: 'LHR',
          airport: depAirport.name,
          terminal: 'T5',
          gate: 'B42',
          scheduled: scheduledDep,
          estimated: estimatedDep,
          lat: depAirport.lat,
          lng: depAirport.lng
        },
        arrival: {
          iata: 'JFK',
          airport: arrAirport.name,
          terminal: 'T7',
          gate: '12',
          scheduled: scheduledArr,
          estimated: new Date(new Date(scheduledArr).getTime() + 1000 * 60 * 210).toISOString(),
          lat: arrAirport.lat,
          lng: arrAirport.lng
        },
        aircraft: {
          registration: 'G-ZBKA',
          iata: 'Boeing 787-9'
        },
        liveAvailable: true,
        lastUpdated: new Date().toISOString(),
        isMock: true
      };
    }

    if (flightNumber === '6E204') {
      const depAirport = getAirportByIata('DEL');
      const arrAirport = getAirportByIata('BLR');
      return {
        flightNumber: '6E204',
        airline: 'IndiGo',
        airlineIata: '6E',
        status: 'cancelled',
        delayMinutes: 0,
        departure: {
          iata: 'DEL',
          airport: depAirport.name,
          terminal: 'T2',
          gate: '24',
          scheduled: scheduledDep,
          estimated: scheduledDep,
          lat: depAirport.lat,
          lng: depAirport.lng
        },
        arrival: {
          iata: 'BLR',
          airport: arrAirport.name,
          terminal: 'T1',
          gate: '3A',
          scheduled: scheduledArr,
          estimated: scheduledArr,
          lat: arrAirport.lat,
          lng: arrAirport.lng
        },
        aircraft: {
          registration: 'VT-IZO',
          iata: 'Airbus A320neo'
        },
        liveAvailable: false,
        lastUpdated: new Date().toISOString(),
        isMock: true
      };
    }

    // Default AI645
    const depAirport = getAirportByIata('BOM');
    const arrAirport = getAirportByIata('DEL');
    return {
      flightNumber: flightNumber || 'AI645',
      airline: 'Air India',
      airlineIata: 'AI',
      status: 'scheduled',
      delayMinutes: 0,
      departure: {
        iata: 'BOM',
        airport: depAirport.name,
        terminal: 'T2',
        gate: '15A',
        scheduled: scheduledDep,
        estimated: scheduledDep,
        lat: depAirport.lat,
        lng: depAirport.lng
      },
      arrival: {
        iata: 'DEL',
        airport: arrAirport.name,
        terminal: 'T3',
        gate: '28B',
        scheduled: scheduledArr,
        estimated: scheduledArr,
        lat: arrAirport.lat,
        lng: arrAirport.lng
      },
      aircraft: {
        registration: 'VT-EXO',
        iata: 'Airbus A321'
      },
      liveAvailable: true,
      lastUpdated: new Date().toISOString(),
      isMock: true
    };
  }
}

module.exports = new AviationstackService();
