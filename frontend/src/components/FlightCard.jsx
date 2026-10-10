import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Plane, ArrowRight, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react'

export default function FlightCard({ flight }) {
  const navigate = useNavigate()

  if (!flight) return null

  const {
    flightNumber = 'AI645',
    airline = 'Air India',
    origin = 'BOM',
    destination = 'DEL',
    status = 'scheduled',
    delayMinutes = 0,
    scheduledDep = '14:30',
    estimatedDep = '14:30',
    gate = '15A',
    terminal = 'T2',
    isDemo = false
  } = flight

  const handleAskAI = (e) => {
    e.stopPropagation()
    navigate('/assistant', { state: { flightContext: flight } })
  }

  return (
    <div className="surface-card-hover group relative overflow-hidden">
      {/* Top Banner & Airline */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-aeromate-blue font-bold flex items-center justify-center text-xs tracking-wider border border-slate-200">
            {flightNumber.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-aeromate-text">{flightNumber}</span>
              {isDemo && (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  Demo Fixture
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-aeromate-muted">{airline}</p>
          </div>
        </div>

        <StatusBadge status={status} delayMinutes={delayMinutes} />
      </div>

      {/* Main Route & Schedule Display */}
      <div className="grid grid-cols-3 items-center gap-4 py-2 my-2">
        {/* Departure */}
        <div>
          <span className="font-display font-extrabold text-2xl text-aeromate-text tracking-tight">{origin}</span>
          <p className="text-xs font-semibold text-aeromate-muted mt-0.5">Scheduled: {scheduledDep}</p>
          {delayMinutes > 0 && (
            <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Est: {estimatedDep}
            </p>
          )}
        </div>

        {/* Flight Path Graphic */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full flex items-center gap-1">
            <div className="h-0.5 flex-1 bg-slate-200"></div>
            <div className="w-7 h-7 rounded-full bg-aeromate-paleBlue border border-aeromate-blue/30 flex items-center justify-center text-aeromate-blue shadow-sm">
              <Plane className="w-3.5 h-3.5 rotate-90" />
            </div>
            <div className="h-0.5 flex-1 bg-slate-200"></div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Non-stop</span>
        </div>

        {/* Arrival */}
        <div className="text-right">
          <span className="font-display font-extrabold text-2xl text-aeromate-text tracking-tight">{destination}</span>
          <p className="text-xs font-semibold text-aeromate-muted mt-0.5">Terminal {terminal || 'TBD'}</p>
          <p className="text-xs font-medium text-slate-400">Gate {gate || 'TBD'}</p>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-aeromate-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Gate {gate || 'TBD'}
          </span>
          {delayMinutes >= 180 && (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded-lg border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" /> Rights Eligible
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAskAI}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Ask AI Assistant about this flight"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
          
          <Link
            to={`/flight/${flightNumber}`}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function FlightOfferCard({ offer }) {
  const navigate = useNavigate()
  if (!offer) return null

  const price = offer.price?.total || offer.price || '450'
  const currency = offer.price?.currency || 'USD'
  const seg = offer.itineraries?.[0]?.segments?.[0] || offer
  const carrier = seg.carrierCode || offer.airline || 'AI'
  const flightNum = seg.number ? `${carrier}${seg.number}` : offer.flightNumber || 'AI645'
  const depCode = seg.departure?.iataCode || offer.origin || 'BOM'
  const arrCode = seg.arrival?.iataCode || offer.destination || 'DEL'
  const depTime = seg.departure?.at ? new Date(seg.departure.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : offer.scheduledDep || '14:30'
  const arrTime = seg.arrival?.at ? new Date(seg.arrival.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : offer.estimatedDep || '16:45'

  return (
    <div className="surface-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue font-bold flex items-center justify-center text-sm">
          {carrier}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-aeromate-text">{flightNum}</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
              Economy
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-aeromate-muted mt-1">
            <span>{depCode} ({depTime})</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span>{arrCode} ({arrTime})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-right">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Fares</div>
          <div className="font-display font-extrabold text-xl text-aeromate-blue">
            {currency === 'INR' ? '₹' : '$'}{price}
          </div>
        </div>

        <button
          onClick={() => navigate(`/flight/${flightNum}`)}
          className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
        >
          Track Flight
        </button>
      </div>
    </div>
  )
}

