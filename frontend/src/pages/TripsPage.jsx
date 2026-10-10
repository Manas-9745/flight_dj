import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Trash2, Plane, Loader2, ArrowRight, Plus, ExternalLink, Calendar, MapPin } from 'lucide-react'
import { getTrips, deleteTrip } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function TripsPage({ token }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch user trips from API, fallback to localStorage if any saved offline
    getTrips(token)
      .then(res => {
        const serverTrips = res.data || []
        // also merge offline wallet trips if available
        try {
          const localPasses = JSON.parse(localStorage.getItem('aeromate_wallet_passes') || '[]')
          const merged = [...serverTrips]
          localPasses.forEach(lp => {
            if (!merged.some(m => (m.flight_number || m.flightNumber) === lp.flightNumber)) {
              merged.push({
                id: lp.id || `local-${lp.flightNumber}`,
                flight_number: lp.flightNumber,
                airline: lp.airline,
                origin: lp.origin,
                destination: lp.destination,
                travel_date: lp.departureTime ? new Date(lp.departureTime).toLocaleDateString() : 'Upcoming',
                status: lp.status || 'scheduled',
                metadata: { gate: lp.gate, terminal: lp.terminal, seat: lp.seat }
              })
            }
          })
          setTrips(merged)
        } catch {
          setTrips(serverTrips)
        }
      })
      .catch(() => {
        try {
          const localPasses = JSON.parse(localStorage.getItem('aeromate_wallet_passes') || '[]')
          const localTrips = localPasses.map(lp => ({
            id: lp.id || `local-${lp.flightNumber}`,
            flight_number: lp.flightNumber,
            airline: lp.airline,
            origin: lp.origin,
            destination: lp.destination,
            travel_date: lp.departureTime ? new Date(lp.departureTime).toLocaleDateString() : 'Upcoming',
            status: lp.status || 'scheduled',
            metadata: { gate: lp.gate, terminal: lp.terminal, seat: lp.seat }
          }))
          setTrips(localTrips)
        } catch {
          setTrips([])
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      if (typeof id === 'string' && id.startsWith('local-')) {
        // remove from local storage
        const localPasses = JSON.parse(localStorage.getItem('aeromate_wallet_passes') || '[]')
        const filtered = localPasses.filter(lp => lp.id !== id && `local-${lp.flightNumber}` !== id)
        localStorage.setItem('aeromate_wallet_passes', JSON.stringify(filtered))
      } else {
        await deleteTrip(id, token)
      }
      setTrips(prev => prev.filter(t => t.id !== id))
    } catch {}
    setDeletingId(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-700 flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-brand-500" /> My Saved Trips
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {trips.length} tracked flight journey{trips.length !== 1 ? 's' : ''} in your portfolio
          </p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Track New Flight
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-navy-700 font-display font-bold text-lg mb-1">No Saved Trips Yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Search for an active flight and save it to monitor real-time delays, gates, terminal changes, and baggage status.
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary inline-flex items-center gap-2">
            Search Flights <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const flightCode = trip.flight_number || trip.flightNumber || 'FLIGHT'
            return (
              <div
                key={trip.id}
                className="card-hover p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div
                  className="flex items-center gap-4 cursor-pointer flex-1 min-w-[260px]"
                  onClick={() => navigate(`/flight/${flightCode}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-base text-navy-700">{flightCode}</span>
                      <span className="text-slate-500 text-xs font-medium">{trip.airline || 'Commercial Airline'}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="text-slate-600 text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-navy-700">{trip.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-navy-700">{trip.destination}</span>
                      {trip.travel_date && (
                        <span className="ml-2 text-slate-400 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {trip.travel_date}
                        </span>
                      )}
                    </div>
                    {trip.metadata && (trip.metadata.terminal || trip.metadata.gate || trip.metadata.seat) && (
                      <div className="text-slate-400 text-xs mt-1 flex items-center gap-3">
                        {trip.metadata.terminal && <span>Terminal {trip.metadata.terminal}</span>}
                        {trip.metadata.gate && <span>Gate {trip.metadata.gate}</span>}
                        {trip.metadata.seat && <span>Seat {trip.metadata.seat}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/flight/${flightCode}`)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    View Status <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    disabled={deletingId === trip.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                    title="Remove saved trip"
                  >
                    {deletingId === trip.id
                      ? <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
