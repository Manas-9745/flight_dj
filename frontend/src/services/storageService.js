const TRIPS_STORAGE_KEY = 'aeromate_saved_trips';

export const storageService = {
  getTrips: () => {
    try {
      const trips = localStorage.getItem(TRIPS_STORAGE_KEY);
      return trips ? JSON.parse(trips) : [];
    } catch (error) {
      console.error("Failed to parse trips from localStorage", error);
      return [];
    }
  },

  saveTrip: (flight) => {
    try {
      const trips = storageService.getTrips();
      if (!trips.find(t => t.id === flight.id)) {
        trips.push(flight);
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
        return true;
      }
      return false; // Already exists
    } catch (error) {
      console.error("Failed to save trip", error);
      return false;
    }
  },

  removeTrip: (flightId) => {
    try {
      const trips = storageService.getTrips();
      const updatedTrips = trips.filter(t => t.id !== flightId);
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(updatedTrips));
      return true;
    } catch (error) {
      console.error("Failed to remove trip", error);
      return false;
    }
  },

  isTripSaved: (flightId) => {
    const trips = storageService.getTrips();
    return trips.some(t => t.id === flightId);
  }
};
