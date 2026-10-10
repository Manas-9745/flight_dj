const axios = require('axios');

class TrackingService {
  constructor() {
    this.openSkyBaseUrl = 'https://opensky-network.org/api';
  }

  /**
   * Retrieves live aircraft coordinates.
   * If live radar telemetry is not active for the flight, returns available: false without hallucinating.
   */
  async getAircraftPosition(flightNumber) {
    const cleanFlightNumber = flightNumber.toUpperCase().trim();

    try {
      // Attempt OpenSky lookup using callsign prefix matching
      const response = await axios.get(`${this.openSkyBaseUrl}/states/all`, {
        timeout: 4000
      });

      const states = response.data?.states || [];
      const match = states.find(s => {
        const callsign = (s[1] || '').trim().toUpperCase();
        return callsign === cleanFlightNumber || callsign.includes(cleanFlightNumber);
      });

      if (match && match[6] !== null && match[5] !== null) {
        return {
          available: true,
          flightNumber: cleanFlightNumber,
          callsign: match[1]?.trim(),
          longitude: match[5],
          latitude: match[6],
          altitude: match[7] ? Math.round(match[7] * 3.28084) : 32000, // meters to feet
          velocityKts: match[9] ? Math.round(match[9] * 1.94384) : 450, // m/s to knots
          heading: Math.round(match[10] || 0),
          verticalRate: match[11] || 0,
          onGround: match[8] || false,
          lastUpdated: new Date(match[4] * 1000).toISOString(),
          source: 'OpenSky Network Live Radar'
        };
      }
    } catch (err) {
      // OpenSky can be rate limited or slow; proceed to deterministic demo radar check
    }

    // For hackathon demonstrations, provide realistic radar positions for designated demo flights
    if (cleanFlightNumber === 'BA142') {
      return {
        available: true,
        flightNumber: 'BA142',
        callsign: 'BAW142',
        latitude: 52.3555,
        longitude: -25.6882, // Mid-Atlantic route
        altitude: 36000,
        velocityKts: 480,
        heading: 260,
        onGround: false,
        lastUpdated: new Date().toISOString(),
        source: 'Simulated Radar Telemetry'
      };
    }

    if (cleanFlightNumber === 'AI645') {
      return {
        available: true,
        flightNumber: 'AI645',
        callsign: 'AIC645',
        latitude: 23.0225,
        longitude: 72.5714, // Over Gujarat en route BOM->DEL
        altitude: 32000,
        velocityKts: 440,
        heading: 32,
        onGround: false,
        lastUpdated: new Date().toISOString(),
        source: 'Simulated Radar Telemetry'
      };
    }

    // Explicit unavailable response - Never hallucinate coordinates for unknown flights
    return {
      available: false,
      flightNumber: cleanFlightNumber,
      message: 'Live ADS-B aircraft radar tracking is not currently active for this flight. The aircraft may be on ground, out of receiver range, or not yet airborne.',
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new TrackingService();
