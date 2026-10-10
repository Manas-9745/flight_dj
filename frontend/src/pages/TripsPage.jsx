import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Trash2, Plane, Loader2, ArrowRight, Sparkles, ShieldAlert, Compass } from 'lucide-react'
import { getTrips, deleteTrip } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function TripsPage({ user, token }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !token) {
      setTrips([])
      setLoading(false)
      return
    }
    setLoading(true)
    getTrips(token)
      .then(res => {
        setTrips(res.data || [])
      })
      .catch(() => {
        setTrips([])
      })
      .finally(() => setLoading(false))
  }, [user?.id, token])

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

  if (!user || !token) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16 font-sans">
        <div className="bg-white border border-[#E5E5E0] rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] text-white mx-auto flex items-center justify-center shadow-md">
            <Bookmark className="w-8 h-8 text-[#246BFD]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0D0D0D] tracking-tight">
              Sign In to View Saved Journeys
            </h1>
            <p className="text-sm font-medium text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
              Sign in to your AeroMate account to save flights, monitor terminal gates, and sync alerts.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/login?redirect=/trips')}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Sign In to AeroMate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[#0D0D0D] tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-[#246BFD]" />
            Saved Journeys
          </h1>
          <p className="text-sm text-[#52524E] mt-1">
            Monitor saved itineraries, terminal gates, and real-time status.
          </p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="btn-primary text-xs py-2 px-4 rounded-full"
        >
          <Plane className="w-3.5 h-3.5" /> Add Flight
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="surface-card text-center py-16 space-y-4 border border-[#E5E5E0] shadow-subtle">
          <Plane className="w-12 h-12 text-[#A8A8A3] mx-auto" />
          <h2 className="text-[#0D0D0D] font-display font-semibold text-lg">No Saved Journeys Yet</h2>
          <p className="text-[#52524E] text-xs max-w-sm mx-auto">
            Search for any flight and save it to monitor real-time updates and disruption alerts.
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary text-xs py-2 px-5 rounded-full">
            Search Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div
              key={trip.id}
              className="surface-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#E5E5E0] shadow-subtle"
            >
              <div
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => navigate(`/flight/${trip.flight_number}`)}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center font-display text-sm">
                  {trip.flight_number.slice(0, 2)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-semibold text-base text-[#0D0D0D]">{trip.flight_number}</span>
                    <span className="text-xs text-[#6B6B6B]">{trip.airline}</span>
                    <StatusBadge status={trip.status} delayMinutes={trip.delayMinutes || 0} />
                  </div>

                  <div className="text-xs font-medium text-[#52524E] flex items-center gap-2">
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-3 h-3 text-[#A8A8A3]" />
                    <span>{trip.destination}</span>
                    <span className="text-[#6B6B6B] font-normal">· {trip.travel_date}</span>
                  </div>

                  {trip.metadata?.gate && (
                    <div className="text-[11px] text-[#6B6B6B]">
                      Terminal {trip.metadata.terminal} · Gate {trip.metadata.gate}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E0]">
                <button
                  onClick={() => navigate(`/assistant`, { state: { flightContext: trip } })}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-full"
                >
                  <Sparkles className="w-3 h-3 text-[#246BFD]" /> Ask AI
                </button>

                <button
                  onClick={() => navigate(`/alerts`, { state: { checkTrip: trip } })}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-full flex items-center gap-1 text-[#1A1A1A]"
                  title="Check live advisories"
                >
                  <ShieldAlert className="w-3 h-3 text-[#52524E]" /> Advisories
                </button>

                <button
                  onClick={() => navigate(`/navigation?flight=${trip.flight_number}&from=${trip.origin}&to=${trip.destination}&airline=${encodeURIComponent(trip.airline || '')}`)}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-full flex items-center gap-1 text-[#1A1A1A]"
                  title="Airport guide"
                >
                  <Compass className="w-3 h-3 text-[#52524E]" /> Guide
                </button>

                <button
                  onClick={() => navigate(`/flight/${trip.flight_number}`)}
                  className="btn-primary text-xs py-1.5 px-3.5 rounded-full"
                >
                  Details
                </button>

                <button
                  onClick={() => handleDelete(trip.id)}
                  disabled={deletingId === trip.id}
                  className="p-1.5 rounded-full text-[#6B6B6B] hover:text-[#0D0D0D] hover:bg-[#FAFAF7] transition-all"
                  title="Remove saved trip"
                >
                  {deletingId === trip.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A1A1A]" />
                    : <Trash2 className="w-3.5 h-3.5" />
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

