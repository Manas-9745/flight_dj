import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, AlertCircle, ArrowLeft, MessageSquare, Bookmark,
  CheckCircle2, RefreshCw, Plane
} from 'lucide-react'
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

  const fetchData = () => {
    const fn = flightNumber.toUpperCase()
    setLoading(true)
    setError(null)

    Promise.all([
      getFlightStatus(fn).catch(() => null),
      getFlightPosition(fn).catch(() => null),
    ]).then(([statusRes, posRes]) => {
      if (!statusRes?.success && !posRes) {
        setError(`No live flight telemetry found for ${fn}. Please verify the airline flight number.`)
      } else {
        setStatus(statusRes?.data || null)
        setPosition(posRes?.data || null)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
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
        <Loader2 className="w-9 h-9 text-brand-500 animate-spin" />
        <span className="text-slate-500 text-sm font-medium">Acquiring live flight telemetry & radar...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center bg-white border border-surface-200 rounded-2xl shadow-card">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h2 className="text-xl font-display font-bold text-navy-700 mb-2">Flight Telemetry Unavailable</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Return to Previous Screen</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-navy-700 transition-colors text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search / Overview
      </button>

      {/* Page title bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-navy-700">
              Flight <span className="text-brand-600 font-mono">{flightNumber.toUpperCase()}</span>
            </h1>
            <span className="badge-live">LIVE TRACKING</span>
          </div>
          {status && <p className="text-slate-500 text-sm mt-0.5">{status.airline}</p>}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5 ${
              saved ? 'text-teal-600 border-teal-300 bg-teal-50' : ''
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <Bookmark className="w-4 h-4" />}
            {saved ? 'Saved to Journey' : 'Save Trip'}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              showChat
                ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                : 'btn-secondary text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {showChat ? 'Hide AI Copilot' : 'Ask AI Copilot'}
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
              <h2 className="text-sm font-display font-bold text-navy-700 mb-3">Live Aircraft Radar Telemetry</h2>
              <RadarMap
                position={position}
                flightNumber={flightNumber.toUpperCase()}
                onRefresh={fetchData}
              />
            </div>
          )}
        </div>

        {/* AI Chat Drawer */}
        {showChat && (
          <div className="animate-slide-up">
            <h2 className="text-sm font-display font-bold text-navy-700 mb-3">AI Journey Travel Assistant</h2>
            <ChatWidget flightContext={status} />
          </div>
        )}
      </div>
    </div>
  )
}
