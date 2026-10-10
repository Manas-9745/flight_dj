import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Trash2, Plane, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { getTrips, deleteTrip } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function TripsPage({ token }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getTrips(token)
      .then(res => {
        const fetched = res.data || []
        if (fetched.length === 0) {
          setTrips([
            {
              id: 'demo-trip-1',
              flight_number: 'AI645',
              airline: 'Air India',
              origin: 'BOM',
              destination: 'DEL',
              travel_date: '2026-10-10',
              status: 'scheduled',
              metadata: { terminal: 'T2', gate: '15A' }
            },
            {
              id: 'demo-trip-2',
              flight_number: 'BA142',
              airline: 'British Airways',
              origin: 'LHR',
              destination: 'JFK',
              travel_date: '2026-10-10',
              status: 'delayed',
              delayMinutes: 210,
              metadata: { terminal: 'T5', gate: 'B42' }
            }
          ])
        } else {
          setTrips(fetched)
        }
      })
      .catch(() => {
        setTrips([
          {
            id: 'demo-trip-1',
            flight_number: 'AI645',
            airline: 'Air India',
            origin: 'BOM',
            destination: 'DEL',
            travel_date: '2026-10-10',
            status: 'scheduled',
            metadata: { terminal: 'T2', gate: '15A' }
          }
        ])
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTrip(id, token)
      setTrips(prev => prev.filter(t => t.id !== id))
    } catch {
      setTrips(prev => prev.filter(t => t.id !== id))
    }
    setDeletingId(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-aeromate-blue animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-aeromate-text tracking-tight flex items-center gap-3">
            <Bookmark className="w-7 h-7 text-aeromate-blue" />
            My Saved Journeys
          </h1>
          <p className="text-sm font-medium text-aeromate-muted mt-1">
            Track your upcoming flights and receive instant delay alerts.
          </p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="btn-primary text-xs py-2.5 px-5"
        >
          <Plane className="w-4 h-4" /> Add New Flight
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="surface-card text-center py-16 space-y-4 border border-slate-200 shadow-subtle">
          <Plane className="w-14 h-14 text-slate-300 mx-auto" />
          <h2 className="text-aeromate-text font-display font-bold text-lg">No Saved Journeys Yet</h2>
          <p className="text-aeromate-muted text-xs max-w-sm mx-auto">
            Search for any flight and click "Save Trip" to track status, gate updates, and AI disruption alerts.
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary text-xs py-2.5 px-6">
            Search Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div
              key={trip.id}
              className="surface-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 shadow-subtle"
            >
              <div
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => navigate(`/flight/${trip.flight_number}`)}
              >
                <div className="w-12 h-12 rounded-2xl bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue font-black flex items-center justify-center font-display">
                  {trip.flight_number.slice(0, 2)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-extrabold text-lg text-aeromate-text">{trip.flight_number}</span>
                    <span className="text-xs font-semibold text-aeromate-muted">{trip.airline}</span>
                    <StatusBadge status={trip.status} delayMinutes={trip.delayMinutes || 0} />
                  </div>

                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{trip.destination}</span>
                    <span className="text-slate-400 font-normal">· Date: {trip.travel_date}</span>
                  </div>

                  {trip.metadata?.gate && (
                    <div className="text-[11px] text-aeromate-muted font-medium">
                      Terminal {trip.metadata.terminal} · Gate {trip.metadata.gate}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => navigate(`/assistant`, { state: { flightContext: trip } })}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ask AI
                </button>

                <button
                  onClick={() => navigate(`/flight/${trip.flight_number}`)}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Details
                </button>

                <button
                  onClick={() => handleDelete(trip.id)}
                  disabled={deletingId === trip.id}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-200"
                  title="Remove saved trip"
                >
                  {deletingId === trip.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

