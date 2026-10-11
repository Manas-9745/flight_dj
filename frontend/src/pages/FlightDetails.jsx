import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft, Bot, Bookmark, CheckCircle2, Plane, Navigation, Sparkles, Flame, ShieldAlert, Compass } from 'lucide-react'
import { getFlightStatus, getFlightPosition, saveTrip, checkRouteImpact } from '../services/api'
import { saveLocalTrip } from '../services/tripsStorage'
import StatusBadge from '../components/StatusBadge'
import RadarMap from '../components/RadarMap'
import ChatWidget from '../components/ChatWidget'

export default function FlightDetails({ user, token }) {
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
    const orig = typeof status.origin === 'string' ? status.origin : status.departure?.iata || 'BOM'
    const dest = typeof status.destination === 'string' ? status.destination : status.arrival?.iata || 'DEL'
    const tripData = {
      flightNumber: status.flightNumber || flightNumber,
      airline: status.airline || 'AeroMate Carrier',
      origin: orig,
      destination: dest,
      travelDate: new Date().toISOString().split('T')[0],
      status: status.status || 'scheduled',
    }

    try {
      if (token) {
        await saveTrip(tripData, token)
      }
      saveLocalTrip(tripData, user?.id || 'guest')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      saveLocalTrip(tripData, user?.id || 'guest')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[65vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#246BFD] animate-spin" />
        <span className="text-[#6B6B6B] text-sm font-medium">Loading flight details…</span>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1)
            } else {
              navigate('/')
            }
          }}
          className="btn-ghost text-xs font-bold text-aeromate-muted hover:text-aeromate-text flex items-center gap-1.5 min-h-[44px] px-2 active:scale-95 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-secondary text-xs min-h-[40px] py-2 px-3.5 rounded-full flex items-center gap-1.5 active:scale-95 touch-manipulation"
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
            <span>{saved ? 'Saved' : 'Save Flight'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="btn-secondary text-xs min-h-[40px] py-2 px-4 rounded-full flex items-center gap-2 active:scale-95 touch-manipulation"
          >
            <Bot className="w-4 h-4" />
            <span>{showChat ? 'Hide Concierge' : 'Ask Concierge'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/navigation?flight=${fnUpper}&from=${originCode}&to=${destCode}`)}
            className="btn-primary text-xs min-h-[40px] py-2 px-4 rounded-full flex items-center gap-2 active:scale-95 touch-manipulation"
          >
            <Compass className="w-4 h-4 text-white" />
            <span>Airport Guide</span>
          </button>
        </div>
      </div>

      {/* Main Flight Overview Banner */}
      <div className="surface-card p-6 border border-[#E5E5E0] shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold text-lg flex items-center justify-center font-display">
              {fnUpper.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display font-semibold text-2xl sm:text-3xl text-[#0D0D0D] tracking-tight">
                  Flight {fnUpper}
                </h1>
                <StatusBadge status={status?.status} delayMinutes={status?.delayMinutes} />
              </div>
              <p className="text-sm text-[#52524E] mt-0.5">
                {status?.airline || 'Air India'} · {aircraftStr}
              </p>
            </div>
          </div>

          {status?.delayMinutes > 0 && (
            <div className="bg-[#FAFAF7] border border-[#E5E5E0] rounded-xl p-3 text-xs text-[#0D0D0D] flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-[#246BFD] flex-shrink-0" />
              <div>
                <span className="font-semibold">Schedule Advisory:</span>
                <p className="text-[11px] text-[#52524E]">Departure delayed by {status.delayMinutes} minutes.</p>
              </div>
            </div>
          )}
        </div>

        {/* Airport Route Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-2">
          {/* Departure */}
          <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-[#E5E5E0] space-y-1">
            <span className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Origin</span>
            <div className="font-mono font-bold text-3xl text-[#0D0D0D] tracking-wider">{originCode}</div>
            <p className="text-xs font-semibold text-[#0D0D0D]">Scheduled: {depTime}</p>
            <p className="text-xs text-[#52524E]">Terminal {depTerminal} · Gate {depGate}</p>
          </div>

          {/* Route Connection */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[11px] font-medium text-[#52524E] bg-[#FAFAF7] px-3 py-1 rounded-full border border-[#E5E5E0]">
              Non-Stop Route
            </span>
            <div className="w-full flex items-center gap-2 px-4">
              <div className="h-px flex-1 bg-[#E5E5E0]"></div>
              <Plane className="w-4 h-4 text-[#246BFD] rotate-90" />
              <div className="h-px flex-1 bg-[#E5E5E0]"></div>
            </div>
            <span className="text-xs text-[#6B6B6B]">Estimated duration: ~2h 15m</span>
          </div>

          {/* Arrival */}
          <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-[#E5E5E0] space-y-1 text-right">
            <span className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Destination</span>
            <div className="font-mono font-bold text-3xl text-[#0D0D0D] tracking-wider">{destCode}</div>
            <p className="text-xs font-semibold text-[#0D0D0D]">Est Arrival: {arrTime}</p>
            <p className="text-xs text-[#52524E]">Terminal {arrTerminal}</p>
          </div>
        </div>
      </div>

      {/* Grid: Radar Map + AI Concierge Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Radar Map */}
        <div className={`space-y-6 ${showChat ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-lg text-[#0D0D0D] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#246BFD]" />
              Aircraft Position
            </h2>
            <p className="text-xs text-[#52524E]">Current flight location and altitude.</p>
          </div>

          <RadarMap position={position} flightNumber={fnUpper} origin={originCode} destination={destCode} />

          {/* Journey Timeline */}
          <div className="surface-card p-6 border border-[#E5E5E0] space-y-4 shadow-subtle">
            <h3 className="font-display font-semibold text-base text-[#0D0D0D]">Journey Progress</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] font-medium">
                Check-in Done
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] font-medium">
                Boarding Complete
              </div>
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#1A1A1A] text-white font-medium">
                In Flight
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E5E5E0] text-[#6B6B6B]">
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
              <h2 className="font-display font-semibold text-lg text-[#0D0D0D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#246BFD]" />
                AI Assistant
              </h2>
            </div>
            <ChatWidget flightContext={status} className="h-[540px]" />
          </div>
        )}
      </div>
    </div>
  )
}
