import { MOCK_FLIGHTS, MOCK_STATS } from '../data/mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const flightService = {
  async getDashboardFlights() {
    await delay(500);
    return MOCK_FLIGHTS.slice(0, 3);
  },
  
  async getStats() {
    await delay(300);
    return MOCK_STATS;
  },

  async searchFlights(query) {
    await delay(800);
    const { origin, destination } = query;
    return MOCK_FLIGHTS.filter(flight => {
      let match = true;
      if (origin && !flight.departure.airport.toLowerCase().includes(origin.toLowerCase()) && !flight.departure.city.toLowerCase().includes(origin.toLowerCase())) {
        match = false;
      }
      if (destination && !flight.arrival.airport.toLowerCase().includes(destination.toLowerCase()) && !flight.arrival.city.toLowerCase().includes(destination.toLowerCase())) {
        match = false;
      }
      // Note: Date matching is skipped in this demo for simplicity unless exact date string is used.
      return match;
    });
  },

  async getFlightById(id) {
    await delay(500);
    const flight = MOCK_FLIGHTS.find(f => f.id === id);
    if (!flight) throw new Error("Flight not found");
    return flight;
  }
};
