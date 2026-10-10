import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Trash2, Plane, Loader2, ArrowRight, Lock } from 'lucide-react'
import { getTrips, deleteTrip } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function TripsPage({ token }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getTrips(token)
      .then(res => setTrips(res.data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [token])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTrip(id, token)
      setTrips(prev => prev.filter(t => t.id !== id))
    } catch {}
    setDeletingId(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1 flex items-center gap-3">
          <Bookmark className="w-7 h-7 text-sky-400" /> My Saved Trips
        </h1>
        <p className="text-slate-400">{trips.length} saved journey{trips.length !== 1 ? 's' : ''}</p>
      </div>

      {trips.length === 0 ? (
        <div className="card text-center py-16">
          <Plane className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <h2 className="text-white font-display font-semibold text-lg mb-2">No saved trips yet</h2>
          <p className="text-slate-400 text-sm mb-6">Search for a flight and click "Save Trip" to track it here.</p>
          <button onClick={() => navigate('/search')} className="btn-primary">Search Flights</button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <div
              key={trip.id}
              className="glass-hover rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap animate-slide-up"
            >
              <div
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => navigate(`/flight/${trip.flight_number}`)}
              >
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sky-400 font-bold">{trip.flight_number}</span>
                    <span className="text-slate-500 text-sm">{trip.airline}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="text-slate-300 text-sm">
                    {trip.origin} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-500" /> {trip.destination}
                    <span className="ml-3 text-slate-500">{trip.travel_date}</span>
                  </div>
                  {trip.metadata?.gate && (
                    <div className="text-slate-500 text-xs mt-0.5">
                      Terminal {trip.metadata.terminal} · Gate {trip.metadata.gate}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(trip.id)}
                disabled={deletingId === trip.id}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Remove saved trip"
              >
                {deletingId === trip.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
