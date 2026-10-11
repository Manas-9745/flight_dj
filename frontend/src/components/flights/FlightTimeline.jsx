import React from 'react';
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';

const FlightTimeline = ({ flight }) => {
  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (timeString) => {
    return new Date(timeString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative py-4 pl-4 md:pl-0">
      {/* Vertical line for mobile, horizontal for desktop (simplified to vertical for both for better readability) */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200"></div>

      <div className="space-y-12">
        {/* Departure */}
        <div className="relative flex items-start">
          <div className="absolute left-0 bg-aero-sky p-2 rounded-full ring-4 ring-white z-10">
            <PlaneTakeoff className="h-5 w-5 text-white" />
          </div>
          <div className="ml-16">
            <h4 className="text-lg font-bold text-aero-navy">Departure &bull; {flight.departure.airport}</h4>
            <p className="text-sm text-slate-500">{flight.departure.city}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Scheduled</p>
                <p className="font-semibold text-slate-900">{formatTime(flight.departure.scheduledTime)}</p>
                <p className="text-xs text-slate-500">{formatDate(flight.departure.scheduledTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Estimated</p>
                <p className="font-semibold text-slate-900">{formatTime(flight.departure.estimatedTime)}</p>
                <p className="text-xs text-slate-500">{formatDate(flight.departure.estimatedTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Terminal</p>
                <p className="font-semibold text-slate-900">{flight.departure.terminal || 'TBD'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Gate</p>
                <p className="font-semibold text-slate-900">{flight.departure.gate || 'TBD'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Arrival */}
        <div className="relative flex items-start">
          <div className="absolute left-0 bg-aero-blue p-2 rounded-full ring-4 ring-white z-10">
            <PlaneLanding className="h-5 w-5 text-white" />
          </div>
          <div className="ml-16">
            <h4 className="text-lg font-bold text-aero-navy">Arrival &bull; {flight.arrival.airport}</h4>
            <p className="text-sm text-slate-500">{flight.arrival.city}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Scheduled</p>
                <p className="font-semibold text-slate-900">{formatTime(flight.arrival.scheduledTime)}</p>
                <p className="text-xs text-slate-500">{formatDate(flight.arrival.scheduledTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Estimated</p>
                <p className="font-semibold text-slate-900">{formatTime(flight.arrival.estimatedTime)}</p>
                <p className="text-xs text-slate-500">{formatDate(flight.arrival.estimatedTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Terminal</p>
                <p className="font-semibold text-slate-900">{flight.arrival.terminal || 'TBD'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Gate</p>
                <p className="font-semibold text-slate-900">{flight.arrival.gate || 'TBD'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline;
