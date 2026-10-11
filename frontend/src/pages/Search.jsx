import React, { useState } from 'react';
import { flightService } from '../services/flightService';
import SearchForm from '../components/flights/SearchForm';
import FlightCard from '../components/flights/FlightCard';
import EmptyState from '../components/common/EmptyState';

const Search = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await flightService.searchFlights(query);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-aero-navy mb-6">Find Your Flight</h1>
      
      <SearchForm onSearch={handleSearch} isLoading={loading} />

      <div className="mt-8">
        {!hasSearched ? (
          <div className="text-center p-8 text-slate-500">
            Enter your origin and destination to find flights.
          </div>
        ) : loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aero-blue"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-700">
              Found {results.length} flight{results.length > 1 ? 's' : ''}
            </h3>
            <div className="grid gap-6">
              {results.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState 
            type="search"
            title="No flights found" 
            message="We couldn't find any flights matching your search criteria. Try different airports or check back later." 
          />
        )}
      </div>
    </div>
  );
};

export default Search;
