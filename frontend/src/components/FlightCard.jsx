import { useNavigate } from 'react-router-dom'
import { Plane, Clock, ArrowRight, MapPin, DollarSign, Bookmark } from 'lucide-react'
import StatusBadge from './StatusBadge'

function formatTime(iso) {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Flight Status Card (for flight details)
export function FlightStatusCard({ flight, onSave }) {
  if (!flight) return null

  return (
    <div className="card glow-sky animate-slide-up">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Plane className="w-4 h-4" />
            <span>{flight.airline}</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-sky-400 font-semibold">{flight.flightNumber}</span>
          </div>
          <StatusBadge status={flight.status} delayMinutes={flight.delayMinutes} />
        </div>
        {onSave && (
          <button onClick={onSave} className="btn-ghost text-sm flex items-center gap-1.5">
            <Bookmark className="w-4 h-4" /> Save Trip
          </button>
        )}
      </div>

      {/* Route Timeline */}
      <div className="flex items-center gap-4">
        {/* Departure */}
        <div className="flex-1 text-right">
          <div className="text-3xl font-display font-bold text-white">{formatTime(flight.departure?.estimated || flight.departure?.scheduled)}</div>
          <div className="text-sky-400 font-bold text-lg">{flight.departure?.iata}</div>
          <div className="text-slate-500 text-xs mt-0.5">{flight.departure?.airport?.slice(0, 28)}</div>
          <div className="text-slate-500 text-xs mt-1">
            Terminal {flight.departure?.terminal} · Gate {flight.departure?.gate}
          </div>
        </div>

        {/* Path */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="text-slate-500 text-xs">✈</div>
          <div className="w-24 h-px bg-gradient-to-r from-sky-500/20 via-sky-400/60 to-sky-500/20 relative">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 -top-1.5">
              <Plane className="w-3 h-3 text-sky-400 rotate-0" />
            </div>
          </div>
          {flight.delayMinutes > 0 && (
            <div className="text-amber-400 text-xs font-medium">+{flight.delayMinutes}m</div>
          )}
        </div>

        {/* Arrival */}
        <div className="flex-1">
          <div className="text-3xl font-display font-bold text-white">{formatTime(flight.arrival?.estimated || flight.arrival?.scheduled)}</div>
          <div className="text-sky-400 font-bold text-lg">{flight.arrival?.iata}</div>
          <div className="text-slate-500 text-xs mt-0.5">{flight.arrival?.airport?.slice(0, 28)}</div>
          <div className="text-slate-500 text-xs mt-1">
            Terminal {flight.arrival?.terminal} · Gate {flight.arrival?.gate}
          </div>
        </div>
      </div>

      {/* Scheduled vs Actual row */}
      {flight.delayMinutes > 0 && (
        <div className="mt-4 pt-4 border-t border-white/8 flex gap-6 text-xs">
          <div>
            <span className="text-slate-500">Scheduled dep:</span>{' '}
            <span className="text-slate-300 line-through">{formatTime(flight.departure?.scheduled)}</span>
          </div>
          <div>
            <span className="text-slate-500">Estimated dep:</span>{' '}
            <span className="text-amber-400 font-medium">{formatTime(flight.departure?.estimated)}</span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/8 text-xs text-slate-500">
        Last updated: {flight.lastUpdated ? new Date(flight.lastUpdated).toLocaleTimeString() : 'N/A'}
        {flight.isMock && <span className="ml-2 text-sky-500/60">[Demo Data]</span>}
      </div>
    </div>
  )
}

// Flight Offer Card (for search results)
export function FlightOfferCard({ offer }) {
  const navigate = useNavigate()

  return (
    <div
      className="glass-hover rounded-2xl p-5 cursor-pointer animate-slide-up"
      onClick={() => navigate(`/flight/${offer.flightNumber}`)}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="font-display font-semibold text-white text-sm">{offer.airline}</div>
            <div className="font-mono text-sky-400 text-xs">{offer.flightNumber}</div>
          </div>
        </div>

        {/* Route times */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <div className="text-right">
            <div className="text-xl font-bold text-white">{formatTime(offer.departureTime)}</div>
            <div className="text-sky-400 text-sm font-semibold">{offer.origin}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-slate-500 text-xs mb-1">{offer.duration}</div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-px bg-sky-500/40" />
              <Plane className="w-3 h-3 text-sky-400" />
              <div className="w-8 h-px bg-sky-500/40" />
            </div>
            <div className="text-slate-500 text-xs mt-1">
              {offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{formatTime(offer.arrivalTime)}</div>
            <div className="text-sky-400 text-sm font-semibold">{offer.destination}</div>
          </div>
        </div>

        {/* Price + Book */}
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-white">
            ${offer.price?.toFixed(0)}
          </div>
          <div className="text-slate-500 text-xs">{offer.currency} · {offer.numberOfBookableSeats} seats</div>
          <button className="btn-primary text-xs mt-2 px-3 py-1.5">View Details</button>
        </div>
      </div>
    </div>
  )
}
