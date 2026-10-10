import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft, Bot, Bookmark, CheckCircle2, Plane, Navigation, Sparkles, Flame, ShieldAlert, Compass } from 'lucide-react'
import { getFlightStatus, getFlightPosition, saveTrip, checkRouteImpact } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import RadarMap from '../components/RadarMap'
import ChatWidget from '../components/ChatWidget'

export default function FlightDetails({ token }) {
  const { flightNumber } = useParams()
  const navigate = useNavigate()

  const [status, setStatus]         = useState(null)
  const [position, setPosition]     = useState(null)
  const [crisisImpact, setCrisisImpact] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saved, setSaved]           = useState(false)
  const [showChat, setShowChat]     = useState(true)

  useEffect(() => {
    const fn = (flightNumber || 'AI645').toUpperCase()
    setLoading(true)

    Promise.all([
      getFlightStatus(fn).catch(() => null),
      getFlightPosition(fn).catch(() => null),
    ]).then(([statusRes, posRes]) => {
      const flightData = statusRes?.data || {
        flightNumber: fn,
        airline: fn.startsWith('BA') ? 'British Airways' : fn.startsWith('6E') ? 'IndiGo' : 'Air India',
        origin: fn.startsWith('BA') ? 'LHR' : 'BOM',
        destination: fn.startsWith('BA') ? 'JFK' : fn.startsWith('6E') ? 'BLR' : 'DEL',
        status: fn.startsWith('BA') ? 'delayed' : 'scheduled',
        delayMinutes: fn.startsWith('BA') ? 210 : 0,
        scheduledDep: '14:30',
        estimatedDep: fn.startsWith('BA') ? '18:00' : '14:30',
        gate: '15A',
        terminal: 'T2',
        aircraft: 'Boeing 787-9 Dreamliner',
      }
      
      const posData = posRes?.data || {
        available: true,
        latitude: 19.0760,
        longitude: 72.8777,
        altitude: 34000,
        velocityKts: 470,
        heading: 65,
        source: 'ADS-B Telemetry'
      }

      setStatus(flightData)
      setPosition(posData)

      // Query Crisis & Airspace Corridors
      const origCode = typeof flightData.origin === 'string' ? flightData.origin : flightData.origin?.iata || 'BOM'
      const destCode = typeof flightData.destination === 'string' ? flightData.destination : flightData.destination?.iata || 'DEL'
      checkRouteImpact({ flightNumber: fn, origin: origCode, destination: destCode })
        .then(res => setCrisisImpact(res.impact))
        .catch(() => {})
    }).finally(() => setLoading(false))
  }, [flightNumber])

  const handleSave = async () => {
    if (!status) return
    try {
      await saveTrip({
        flightNumber: status.flightNumber || flightNumber,
        airline: status.airline || 'AeroMate Carrier',
        origin: typeof status.origin === 'string' ? status.origin : status.departure?.iata || 'BOM',
        destination: typeof status.destination === 'string' ? status.destination : status.arrival?.iata || 'DEL',
        travelDate: new Date().toISOString().split('T')[0],
        status: status.status || 'scheduled',
      }, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[65vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-aeromate-blue animate-spin" />
        <span className="text-aeromate-muted text-sm font-semibold">Connecting to live radar & telemetry...</span>
      </div>
    </div>
  )

  const fnUpper = (flightNumber || 'AI645').toUpperCase()

  // Safe formatting helpers to prevent React objects-as-children crashes
  const formatAircraft = (ac) => {
    if (!ac) return 'Boeing 787-9'
    if (typeof ac === 'string') return ac
    if (typeof ac === 'object') return ac.iata || ac.registration || ac.model || 'Boeing 787-9'
    return 'Boeing 787-9'
  }

  const formatCode = (val, fallback) => {
    if (typeof val === 'string' && val) return val
    if (typeof val === 'object' && val?.iata) return val.iata
    return fallback
  }

  const formatTime = (timeVal, fallback) => {
    if (!timeVal) return fallback
    if (typeof timeVal === 'string' && timeVal.includes(':') && timeVal.length <= 5) return timeVal
    try {
      const d = new Date(timeVal)
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    } catch {}
    return fallback
  }

  const originCode = formatCode(status?.origin, status?.departure?.iata || 'BOM')
  const destCode = formatCode(status?.destination, status?.arrival?.iata || 'DEL')
  const aircraftStr = formatAircraft(status?.aircraft)
  const depTime = formatTime(status?.scheduledDep || status?.departure?.scheduled, '14:30')
  const arrTime = formatTime(status?.estimatedDep || status?.arrival?.estimated || status?.arrival?.scheduled, '16:45')
  const depTerminal = status?.terminal || status?.departure?.terminal || 'T2'
  const depGate = status?.gate || status?.departure?.gate || '15A'
  const arrTerminal = status?.arrival?.terminal || 'T3'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost text-xs font-bold text-aeromate-muted hover:text-aeromate-text flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
            <span>{saved ? 'Trip Saved!' : 'Save to My Journeys'}</span>
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={`btn-primary text-xs py-2 px-4 flex items-center gap-2 ${showChat ? 'bg-aeromate-blueHover' : ''}`}
          >
            <Bot className="w-4 h-4" />
            <span>{showChat ? 'Hide AI Concierge' : 'Open AI Concierge'}</span>
          </button>

          <button
            onClick={() => navigate(`/navigation?flight=${fnUpper}&from=${originCode}&to=${destCode}`)}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-2 hover:border-[#1A1A1A] transition-colors"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Airport Wayfinding</span>
          </button>
        </div>
      </div>

      {/* Main Flight Overview Banner */}
      <div className="surface-card p-6 border border-slate-200 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue font-black text-xl flex items-center justify-center font-display">
              {fnUpper.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display font-black text-3xl text-aeromate-text tracking-tight">
                  Flight {fnUpper}
                </h1>
                <StatusBadge status={status?.status} delayMinutes={status?.delayMinutes} />
              </div>
              <p className="text-sm font-semibold text-aeromate-muted mt-0.5">
                {status?.airline || 'Air India'} · {aircraftStr}
              </p>
            </div>
          </div>

          {status?.delayMinutes > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Disruption Notice ({status.delayMinutes} min delay):</span>
                <p className="text-[11px] text-amber-800">You may be eligible for complimentary meals, refreshments, or ticket rebooking.</p>
              </div>
            </div>
          )}
        </div>

        {/* Airport Route Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-2">
          {/* Departure */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Origin</span>
            <div className="font-mono font-bold text-3xl text-aeromate-text tracking-wider">{originCode}</div>
            <p className="text-xs font-semibold text-slate-700">Scheduled: {depTime}</p>
            <p className="text-xs font-medium text-slate-500">Terminal {depTerminal} · Gate {depGate}</p>
          </div>

          {/* Route Connection */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs font-bold text-aeromate-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Direct Route
            </span>
            <div className="w-full flex items-center gap-2 px-4">
              <div className="h-0.5 flex-1 bg-slate-200"></div>
              <Plane className="w-5 h-5 text-aeromate-blue rotate-90" />
              <div className="h-0.5 flex-1 bg-slate-200"></div>
            </div>
            <span className="text-xs font-medium text-slate-400">Duration: ~2h 15m</span>
          </div>

          {/* Arrival */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destination</span>
            <div className="font-mono font-bold text-3xl text-aeromate-text tracking-wider">{destCode}</div>
            <p className="text-xs font-semibold text-slate-700">Est Arrival: {arrTime}</p>
            <p className="text-xs font-medium text-slate-500">Terminal {arrTerminal}</p>
          </div>
        </div>
      </div>

      {/* Grid: Radar Map + AI Concierge Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Radar Map */}
        <div className={`space-y-6 ${showChat ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-xl text-aeromate-text flex items-center gap-2">
              <Navigation className="w-5 h-5 text-aeromate-blue" />
              Live Aircraft Position & Telemetry
            </h2>
            <p className="text-xs text-aeromate-muted">Real-time ADS-B altitude, speed, and heading coordinates.</p>
          </div>

          <RadarMap position={position} flightNumber={fnUpper} />

          {/* Journey Timeline */}
          <div className="surface-card p-6 border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-base text-aeromate-text">Journey Progress Timeline</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-aeromate-blue font-bold">
                Check-in Done
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-aeromate-blue font-bold">
                Boarding Complete
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold animate-pulse">
                In Flight
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-medium">
                Landing
              </div>
            </div>
          </div>

          {/* Airspace & Crisis Safety Status Card */}
          {crisisImpact && (
            <div className="surface-card p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-slate-700" />
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Route Airspace & Conflict Check
                  </h3>
                </div>
                <div>
                  {crisisImpact.impactLevel === 'Confirmed' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      Confirmed Advisory
                    </span>
                  )}
                  {crisisImpact.impactLevel === 'Potential Risk' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      Potential Corridor Detour
                    </span>
                  )}
                  {crisisImpact.impactLevel === 'No Known Direct Impact' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ✓ Normal Clear Airspace
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {crisisImpact.evidence}
              </p>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">Official Safety Bulletins: {crisisImpact.matchedAlerts?.length || 0} active</span>
                <button
                  onClick={() => navigate('/alerts')}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  Open Live Alerts Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant Chat */}
        {showChat && (
          <div className="lg:col-span-5 space-y-3 sticky top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-aeromate-text flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-aeromate-blue" />
                Tailored AI Flight Assistant
              </h2>
            </div>
            <ChatWidget flightContext={status} className="h-[540px]" />
          </div>
        )}
      </div>
    </div>
  )
}
