import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const FlightCard = ({ flight }) => {
  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel p-5 hover:shadow-2xl transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-aero-navy text-lg">{flight.airline}</h4>
            <p className="text-sm text-slate-500 font-medium">{flight.flightNumber} &bull; {flight.aircraft}</p>
          </div>
          <StatusBadge status={flight.status} />
        </div>

        <div className="flex items-center justify-between my-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-aero-navy">{formatTime(flight.departure.scheduledTime)}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{flight.departure.airport}</p>
            <p className="text-xs text-slate-400">Terminal {flight.departure.terminal || '-'}</p>
          </div>
          
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="w-full flex items-center">
              <div className="h-px bg-slate-300 flex-1"></div>
              <div className="px-2 text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Clock className="h-3 w-3" /> {flight.duration}
              </div>
              <div className="h-px bg-slate-300 flex-1"></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Direct</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-aero-navy">{formatTime(flight.arrival.scheduledTime)}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{flight.arrival.airport}</p>
            <p className="text-xs text-slate-400">Terminal {flight.arrival.terminal || '-'}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          <span className="font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700">Demo Data</span>
        </p>
        <Link 
          to={`/flight/${flight.id}`}
          className="text-sm font-medium text-aero-indigo hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          View Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default FlightCard;
