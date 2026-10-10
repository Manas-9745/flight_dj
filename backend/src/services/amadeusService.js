const axios = require('axios');

class AmadeusService {
  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    this.baseUrl = 'https://test.api.amadeus.com';
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  get isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post(`${this.baseUrl}/v1/security/oauth2/token`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      // Expire 60 seconds earlier for safety margin
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken;
    } catch (err) {
      console.error('❌ Failed to fetch Amadeus OAuth2 token:', err.response?.data || err.message);
      throw new Error('Amadeus authentication failed.');
    }
  }

  async searchFlights({ origin, destination, date, adults = 1 }) {
    if (!this.isConfigured) {
      console.log('ℹ️ [Amadeus] API credentials not provided. Returning curated mock flight offers.');
      return this.getMockFlightOffers(origin, destination, date);
    }

    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/v2/shopping/flight-offers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          originLocationCode: origin.toUpperCase(),
          destinationLocationCode: destination.toUpperCase(),
          departureDate: date,
          adults,
          max: 10,
          currencyCode: 'USD'
        }
      });

      return this.formatOffers(response.data);
    } catch (err) {
      console.warn('⚠️ [Amadeus] Live API request failed, falling back to mock offers:', err.response?.data || err.message);
      return this.getMockFlightOffers(origin, destination, date);
    }
  }

  formatOffers(amadeusData) {
    if (!amadeusData?.data || !Array.isArray(amadeusData.data)) {
      return [];
    }

    const carrierMap = amadeusData.dictionaries?.carriers || {};

    return amadeusData.data.map((offer, index) => {
      const itinerary = offer.itineraries?.[0];
      const segment = itinerary?.segments?.[0];
      const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1];
      const carrierCode = segment?.carrierCode || 'XX';

      return {
        id: offer.id || `offer-${index + 1}`,
        airline: carrierMap[carrierCode] || carrierCode,
        airlineCode: carrierCode,
        flightNumber: `${carrierCode}${segment?.number || '101'}`,
        origin: segment?.departure?.iataCode,
        destination: lastSegment?.arrival?.iataCode,
        departureTime: segment?.departure?.at,
        arrivalTime: lastSegment?.arrival?.at,
        duration: itinerary?.duration?.replace('PT', '').toLowerCase() || 'N/A',
        stops: itinerary?.segments?.length - 1,
        price: parseFloat(offer.price?.total || 0),
        currency: offer.price?.currency || 'USD',
        numberOfBookableSeats: offer.numberOfBookableSeats || 9
      };
    });
  }

  getMockFlightOffers(origin, destination, date) {
    const orig = (origin || 'JFK').toUpperCase();
    const dest = (destination || 'LHR').toUpperCase();
    const travelDate = date || new Date().toISOString().split('T')[0];

    return [
      {
        id: 'offer-mock-1',
        airline: 'SkyWings International',
        airlineCode: 'SW',
        flightNumber: 'SW402',
        origin: orig,
        destination: dest,
        departureTime: `${travelDate}T08:30:00Z`,
        arrivalTime: `${travelDate}T16:45:00Z`,
        duration: '8h 15m',
        stops: 0,
        price: 485.50,
        currency: 'USD',
        numberOfBookableSeats: 5,
        isMock: true
      },
      {
        id: 'offer-mock-2',
        airline: 'AeroGlobal Airways',
        airlineCode: 'AG',
        flightNumber: 'AG118',
        origin: orig,
        destination: dest,
        departureTime: `${travelDate}T13:00:00Z`,
        arrivalTime: `${travelDate}T21:10:00Z`,
        duration: '8h 10m',
        stops: 0,
        price: 520.00,
        currency: 'USD',
        numberOfBookableSeats: 3,
        isMock: true
      },
      {
        id: 'offer-mock-3',
        airline: 'TransOcean Air',
        airlineCode: 'TO',
        flightNumber: 'TO890',
        origin: orig,
        destination: dest,
        departureTime: `${travelDate}T19:45:00Z`,
        arrivalTime: `${travelDate}T07:30:00Z`,
        duration: '11h 45m',
        stops: 1,
        price: 395.00,
        currency: 'USD',
        numberOfBookableSeats: 8,
        isMock: true
      }
    ];
  }
}

module.exports = new AmadeusService();
