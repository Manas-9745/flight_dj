import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft, MessageSquare, Bookmark, CheckCircle2 } from 'lucide-react'
import { getFlightStatus, getFlightPosition, saveTrip } from '../services/api'
import { FlightStatusCard } from '../components/FlightCard'
import RadarMap from '../components/RadarMap'
import ChatWidget from '../components/ChatWidget'

export default function FlightDetails({ token }) {
  const { flightNumber } = useParams()
  const navigate = useNavigate()

  const [status, setStatus]     = useState(null)
  const [position, setPosition] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [saved, setSaved]       = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const fn = flightNumber.toUpperCase()
    setLoading(true)
    setError(null)

    Promise.all([
      getFlightStatus(fn).catch(() => null),
      getFlightPosition(fn).catch(() => null),
    ]).then(([statusRes, posRes]) => {
      if (!statusRes?.success && !posRes) {
        setError(`No data found for flight ${fn}. Please verify the flight number.`)
      } else {
        setStatus(statusRes?.data || null)
        setPosition(posRes?.data || null)
      }
    }).finally(() => setLoading(false))
  }, [flightNumber])

  const handleSave = async () => {
    if (!status) return
    try {
      await saveTrip({
        flightNumber: status.flightNumber,
        airline: status.airline,
        origin: status.departure?.iata,
        destination: status.arrival?.iata,
        travelDate: new Date().toISOString().split('T')[0],
        status: status.status,
        metadata: { terminal: status.departure?.terminal, gate: status.departure?.gate }
      }, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
        <span className="text-slate-400">Fetching live flight data...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-display font-semibold text-white mb-2">Flight Not Found</h2>
      <p className="text-slate-400 mb-6">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Page title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Flight <span className="text-sky-400 font-mono">{flightNumber.toUpperCase()}</span>
          </h1>
          {status && <p className="text-slate-400 text-sm mt-0.5">{status.airline}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`btn-ghost text-sm flex items-center gap-1.5 ${saved ? 'text-emerald-400' : ''}`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Trip'}
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
              showChat
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                : 'btn-ghost border-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${showChat ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-6">
          {/* Flight Status Card */}
          {status && <FlightStatusCard flight={status} onSave={handleSave} />}

          {/* Radar Map */}
          {position !== null && (
            <div>
              <h2 className="section-title mb-3">Live Aircraft Position</h2>
              <RadarMap position={position} flightNumber={flightNumber.toUpperCase()} />
            </div>
          )}
        </div>

        {/* AI Chat (shown when requested) */}
        {showChat && (
          <div className="animate-slide-up">
            <h2 className="section-title mb-3">AI Travel Assistant</h2>
            <ChatWidget flightContext={status} />
          </div>
        )}
      </div>
    </div>
  )
}
