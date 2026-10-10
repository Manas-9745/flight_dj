import { useNavigate } from 'react-router-dom'
import { Plane, Clock, ArrowRight, Bookmark, AlertCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'

function formatTime(iso) {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Flight Status Card ────────────────────────────────────────────────────────

export function FlightStatusCard({ flight, onSave }) {
  if (!flight) return null

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Plane className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-navy-700">{flight.airline}</span>
            <span className="text-surface-200">·</span>
            <span className="font-mono text-brand-500 font-bold">{flight.flightNumber}</span>
          </div>
          <StatusBadge status={flight.status} delayMinutes={flight.delayMinutes} />
        </div>
        {onSave && (
          <button onClick={onSave} className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-3">
            <Bookmark className="w-4 h-4" /> Save Trip
          </button>
        )}
      </div>

      {/* Route Timeline */}
      <div className="flex items-center gap-4 py-2">
        {/* Departure */}
        <div className="flex-1 text-right">
          <div className="text-3xl font-display font-bold text-navy-700">
            {formatTime(flight.departure?.estimated || flight.departure?.scheduled)}
          </div>
          <div className="text-brand-500 font-bold text-xl mt-0.5">{flight.departure?.iata}</div>
          <div className="text-slate-500 text-xs mt-1">{flight.departure?.airport?.slice(0, 28)}</div>
          <div className="text-slate-400 text-xs mt-0.5">
            Terminal {flight.departure?.terminal} · Gate {flight.departure?.gate}
          </div>
        </div>

        {/* Flight path */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 px-2">
          <div className="w-28 relative flex items-center">
            <div className="flex-1 h-px bg-surface-200" />
            <Plane className="w-5 h-5 text-brand-400 mx-1" />
            <div className="flex-1 h-px bg-surface-200" />
          </div>
          {flight.delayMinutes > 0 && (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <AlertCircle className="w-3 h-3" />
              +{flight.delayMinutes}m
            </div>
          )}
        </div>

        {/* Arrival */}
        <div className="flex-1">
          <div className="text-3xl font-display font-bold text-navy-700">
            {formatTime(flight.arrival?.estimated || flight.arrival?.scheduled)}
          </div>
          <div className="text-brand-500 font-bold text-xl mt-0.5">{flight.arrival?.iata}</div>
          <div className="text-slate-500 text-xs mt-1">{flight.arrival?.airport?.slice(0, 28)}</div>
          <div className="text-slate-400 text-xs mt-0.5">
            Terminal {flight.arrival?.terminal} · Gate {flight.arrival?.gate}
          </div>
        </div>
      </div>

      {/* Delay detail */}
      {flight.delayMinutes > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-200">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span>
              <span className="text-slate-400">Scheduled: </span>
              <span className="text-slate-500 line-through">{formatTime(flight.departure?.scheduled)}</span>
            </span>
            <span>
              <span className="text-slate-400">Estimated: </span>
              <span className="text-amber-600 font-semibold">{formatTime(flight.departure?.estimated)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-surface-200 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {flight.lastUpdated ? new Date(flight.lastUpdated).toLocaleTimeString() : 'N/A'}
        </span>
        {flight.isMock && (
          <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
            Demo Data
          </span>
        )}
      </div>
    </div>
  )
}

// ── Flight Offer Card (Search Results) ────────────────────────────────────────

export function FlightOfferCard({ offer, highlighted }) {
  const navigate = useNavigate()

  return (
    <div
      className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:border-brand-200 animate-slide-up ${
        highlighted ? 'border-brand-300 ring-2 ring-brand-100' : 'border-surface-200 shadow-card'
      }`}
      onClick={() => navigate(`/flight/${offer.flightNumber}`)}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Airline info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <Plane className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <div className="font-semibold text-navy-700 text-sm">{offer.airline}</div>
            <div className="font-mono text-brand-500 text-xs font-semibold">{offer.flightNumber}</div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-5 flex-1 justify-center">
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-navy-700">{formatTime(offer.departureTime)}</div>
            <div className="text-brand-500 text-sm font-bold">{offer.origin}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-slate-400 text-xs">{offer.duration}</div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-px bg-surface-200" />
              <Plane className="w-3 h-3 text-brand-400" />
              <div className="w-10 h-px bg-surface-200" />
            </div>
            <div className="text-slate-400 text-xs">
              {offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-navy-700">{formatTime(offer.arrivalTime)}</div>
            <div className="text-brand-500 text-sm font-bold">{offer.destination}</div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          {highlighted && (
            <div className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mb-1 uppercase tracking-wide">
              Lowest Fare
            </div>
          )}
          <div className="text-2xl font-display font-bold text-navy-700">
            {offer.currency === 'USD' ? '$' : ''}{offer.price?.toFixed(0)}
          </div>
          <div className="text-slate-400 text-xs">{offer.currency} · {offer.numberOfBookableSeats} seats</div>
          <button className="btn-primary text-xs mt-2 px-3 py-1.5">View Details</button>
        </div>
      </div>

      {offer.isMock && (
        <div className="mt-3 pt-3 border-t border-surface-200">
          <span className="text-[10px] text-purple-500 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            Demo Price — Connect Amadeus API for live fares
          </span>
        </div>
      )}
    </div>
  )
}
