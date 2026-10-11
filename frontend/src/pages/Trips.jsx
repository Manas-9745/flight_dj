import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { storageService } from '../services/storageService';
import FlightCard from '../components/flights/FlightCard';
import EmptyState from '../components/common/EmptyState';

const Trips = () => {
  const [savedTrips, setSavedTrips] = useState([]);

  useEffect(() => {
    // Load trips from local storage on mount
    setSavedTrips(storageService.getTrips());
  }, []);

  const handleRemove = (id) => {
    storageService.removeTrip(id);
    setSavedTrips(storageService.getTrips());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-aero-navy mb-2">Saved Trips</h1>
      <p className="text-slate-500 mb-8">Access and monitor your saved flights here.</p>

      {savedTrips.length > 0 ? (
        <div className="grid gap-6">
          {savedTrips.map((flight) => (
            <div key={flight.id} className="relative group">
              <FlightCard flight={flight} />
              <button 
                onClick={() => handleRemove(flight.id)}
                className="absolute top-4 right-4 bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-md text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          type="trips"
          title="No trips saved yet"
          message="Keep track of upcoming flights by saving them from the search results."
          actionButton={
            <Link to="/search" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-aero-indigo text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              <Compass className="h-5 w-5" />
              Find Flights
            </Link>
          }
        />
      )}
    </div>
  );
};

export default Trips;
