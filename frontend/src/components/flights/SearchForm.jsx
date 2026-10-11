import React, { useState } from 'react';
import { ArrowRightLeft, Search } from 'lucide-react';

const SearchForm = ({ onSearch, isLoading }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination.');
      return;
    }

    if (origin.toLowerCase().trim() === destination.toLowerCase().trim()) {
      setError('Origin and destination cannot be the same.');
      return;
    }

    onSearch({ origin: origin.trim(), destination: destination.trim(), date });
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Origin</label>
          <input
            type="text"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aero-sky focus:border-aero-sky transition-colors"
            placeholder="e.g. JFK or New York"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="mt-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-aero-navy transition-colors focus:outline-none"
          title="Swap"
          disabled={isLoading}
        >
          <ArrowRightLeft className="h-5 w-5" />
        </button>

        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
          <input
            type="text"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aero-sky focus:border-aero-sky transition-colors"
            placeholder="e.g. LHR or London"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="w-full md:w-1/4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date (Optional)</label>
          <input
            type="date"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aero-sky focus:border-aero-sky transition-colors"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto mt-6 px-6 py-3 bg-aero-indigo hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>Search</span>
        </button>
      </form>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchForm;
