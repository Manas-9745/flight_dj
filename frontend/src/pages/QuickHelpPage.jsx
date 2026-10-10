import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  PhoneCall,
  Delete,
  ArrowRight,
  ShieldCheck,
  Plane,
  Building,
  Clock,
  Compass,
  Sparkles,
  ShieldAlert,
  AlertOctagon,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Info
} from 'lucide-react'
import { getQuickHelpCommands, resolveQuickHelpCommand, getTrips, getFlightStatus } from '../services/api'

// Pre-defined static commands as resilient fallback
const DEFAULT_COMMANDS = [
  {
    code: '101',
    title: 'Flight Delayed',
    actionText: 'Retrieve status & delay options',
    description: 'Check real-time delay minutes, revised departure/arrival schedules, and compensation rights.',
    category: 'Flight Operations',
    targetRoute: '/flight',
    requiresFlightNumber: true
  },
  {
    code: '102',
    title: 'Flight Cancelled',
    actionText: 'Find alternatives & rebook',
    description: 'Open AI Disruption Manager to analyze alternatives across carriers and initiate recovery.',
    category: 'Disruption Recovery',
    targetRoute: '/disruption',
    targetTab: 'alternatives',
    requiresFlightNumber: false
  },
  {
    code: '103',
    title: 'Missed Connection',
    actionText: 'Analyze connection risk & itinerary',
    description: 'Calculate downstream impacts on tight transfers, luggage transfer, and onward journey flights.',
    category: 'Journey Continuity',
    targetRoute: '/disruption',
    targetTab: 'impact',
    requiresFlightNumber: false
  },
  {
    code: '104',
    title: 'Overnight Accommodation',
    actionText: 'Nearby hotels during disruptions',
    description: 'Contextual hotel recommendations near the stranded airport or destination. Clearly labeled demo data.',
    category: 'Accommodation',
    targetRoute: '/disruption',
    targetTab: 'hotels',
    requiresFlightNumber: false
  },
  {
    code: '105',
    title: 'Airport Navigation',
    actionText: 'Turn-by-turn wayfinding guide',
    description: 'Step-by-step guidance through domestic or international terminal check-in, security, and gates.',
    category: 'Wayfinding',
    targetRoute: '/navigation',
    requiresFlightNumber: false
  },
  {
    code: '106',
    title: 'Crisis & Airspace Alerts',
    actionText: 'Conflict zones & safety notices',
    description: 'Official airspace advisories, route hazard checks, and verified aviation safety bulletins.',
    category: 'Airspace Safety',
    targetRoute: '/alerts',
    requiresFlightNumber: false
  },
  {
    code: '107',
    title: 'Ask AI Travel Assistant',
    actionText: 'Conversational travel concierge',
    description: 'Inquire about delay compensation regulations (DGCA/EU261), baggage rules, or airline rebooking.',
    category: 'AI Concierge',
    targetRoute: '/assistant',
    requiresFlightNumber: false
  },
  {
    code: '108',
    title: 'Check Flight Status',
    actionText: 'Look up live telemetry & gate',
    description: 'Live flight radar position, scheduled vs. estimated timings, and terminal/gate updates.',
    category: 'Flight Operations',
    targetRoute: '/flight',
    requiresFlightNumber: true
  }
]

const KEYPAD_KEYS = [
  { num: '1', sub: 'ACTION' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
  { num: 'C', sub: 'CLEAR', isSpecial: true },
  { num: '0', sub: '+' },
  { num: 'DEL', sub: 'BACK', isSpecial: true }
]

export default function QuickHelpPage({ token }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Keypad State
  const [code, setCode] = useState(location.state?.code || '')
  const [commands, setCommands] = useState(DEFAULT_COMMANDS)
  const [loadingCommands, setLoadingCommands] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Context Dialog Modal State (for missing flight info)
  const [showContextModal, setShowContextModal] = useState(false)
  const [pendingCommand, setPendingCommand] = useState(null)
  const [contextForm, setContextForm] = useState({
    flightNumber: 'AI645',
    origin: 'BOM',
    destination: 'DEL',
    connectingAirport: 'DEL',
    question: ''
  })

  // Saved user trips for 1-click auto-fill
  const [savedTrips, setSavedTrips] = useState([])

  // Load commands from API with graceful local fallback
  useEffect(() => {
    setLoadingCommands(true)
    getQuickHelpCommands()
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setCommands(res.data)
        }
      })
      .catch(() => {
        // Fallback already pre-set to DEFAULT_COMMANDS
      })
      .finally(() => setLoadingCommands(false))

    // Preload user's saved trips for quick context selection
    getTrips(token)
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setSavedTrips(res.data)
          if (res.data[0]?.flight_number) {
            setContextForm(prev => ({
              ...prev,
              flightNumber: res.data[0].flight_number,
              origin: res.data[0].origin || 'BOM',
              destination: res.data[0].destination || 'DEL'
            }))
          }
        }
      })
      .catch(() => {})
  }, [token])

  // Active matched command
  const activeCommand = commands.find(c => c.code === code)
  const isCodeUnknown = code.length === 3 && !activeCommand

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture when typing in inputs/modals
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (code) handleRun(code)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, activeCommand])

  // Keypad Handlers
  const handleKeyPress = (digit) => {
    setErrorMessage(null)
    if (code.length < 3) {
      setCode(prev => prev + digit)
    }
  }

  const handleBackspace = () => {
    setErrorMessage(null)
    setCode(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setErrorMessage(null)
    setCode('')
  }

  // Trigger command execution
  const handleRun = async (targetCode = code) => {
    const selected = commands.find(c => c.code === targetCode)
    setErrorMessage(null)

    if (!selected) {
      setErrorMessage('Code not recognized. Please try a listed Quick Help code.')
      return
    }

    // Check if context is needed (e.g. flight number for 101 or 108)
    if (selected.requiresFlightNumber && !contextForm.flightNumber) {
      setPendingCommand(selected)
      setShowContextModal(true)
      return
    }

    // Execute through backend validation or direct routing
    setExecuting(true)
    try {
      const resolution = await resolveQuickHelpCommand({
        code: selected.code,
        flightNumber: contextForm.flightNumber,
        origin: contextForm.origin,
        destination: contextForm.destination,
        connectingAirport: contextForm.connectingAirport,
        question: contextForm.question
      }).catch(() => null)

      const navUrl = resolution?.data?.redirectUrl || selected.targetRoute
      const navState = resolution?.data?.navigationState || {
        tab: selected.targetTab,
        flightNumber: contextForm.flightNumber,
        origin: contextForm.origin,
        destination: contextForm.destination
      }

      if (navUrl.startsWith('/flight') && contextForm.flightNumber) {
        navigate(`/flight/${contextForm.flightNumber.toUpperCase()}`, { state: navState })
      } else if (navUrl.startsWith('/navigation')) {
        navigate(`/navigation?flight=${contextForm.flightNumber}&from=${contextForm.origin}&to=${contextForm.destination}`, { state: navState })
      } else {
        navigate(navUrl, { state: navState })
      }
    } catch (err) {
      console.error('Failed to run Quick Help action:', err)
      // Resilient client fallback
      if (selected.code === '101' || selected.code === '108') {
        navigate(`/flight/${contextForm.flightNumber || 'AI645'}`)
      } else if (selected.code === '104') {
        navigate('/disruption', { state: { tab: 'hotels', demoAirport: contextForm.origin || 'DEL' } })
      } else if (selected.code === '102') {
        navigate('/disruption', { state: { tab: 'alternatives' } })
      } else if (selected.code === '103') {
        navigate('/disruption', { state: { tab: 'impact' } })
      } else {
        navigate(selected.targetRoute, { state: { tab: selected.targetTab } })
      }
    } finally {
      setExecuting(false)
    }
  }

  // One-click execution from command directory
  const handleSelectCommandCard = (cmd) => {
    setCode(cmd.code)
    setErrorMessage(null)
    if (cmd.requiresFlightNumber && !contextForm.flightNumber) {
      setPendingCommand(cmd)
      setShowContextModal(true)
    } else {
      handleRun(cmd.code)
    }
  }

  // Handle modal submit
  const handleModalSubmit = (e) => {
    e.preventDefault()
    setShowContextModal(false)
    if (pendingCommand) {
      handleRun(pendingCommand.code)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-24 pb-20 font-sans text-[#0D0D0D]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5E0] text-[#52524E] text-xs font-semibold uppercase tracking-wider mb-1 shadow-subtle">
            <PhoneCall className="w-3.5 h-3.5 text-[#246BFD]" />
            <span>Assistance Dial Pad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-[#0D0D0D] tracking-tight">
            Quick Help
          </h1>
          <p className="text-base font-medium text-[#246BFD]">
            One code. Immediate action.
          </p>
          <p className="text-sm text-[#52524E]">
            Enter a 3-digit assistance code or pick a command below to bypass multiple navigation steps and resolve disruptions instantly.
          </p>
        </div>

        {/* Central Dial Pad & Readout Console */}
        <div className="max-w-md mx-auto surface-card p-6 sm:p-8 border border-[#E5E5E0] shadow-subtle space-y-6">

          {/* Numeric Readout Screen */}
          <div className="bg-[#FAFAF7] border border-[#E5E5E0] rounded-2xl p-5 text-center space-y-2 relative">
            <div className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider flex items-center justify-between px-1">
              <span>Code Display</span>
              <span className="font-mono text-[#0D0D0D]">{code.length}/3 Digits</span>
            </div>

            {/* Large 3-Digit Display */}
            <div className="h-16 flex items-center justify-center font-mono font-bold text-4xl sm:text-5xl text-[#0D0D0D] tracking-[0.25em]">
              {code ? (
                <span>{code}</span>
              ) : (
                <span className="text-[#CACAC5] tracking-[0.3em]">_ _ _</span>
              )}
            </div>

            {/* Live Command Interpretation or Error Box */}
            <div className="min-h-[44px] flex items-center justify-center text-xs">
              {activeCommand ? (
                <div className="text-center">
                  <span className="font-semibold text-[#0D0D0D] block">
                    {activeCommand.title}
                  </span>
                  <span className="text-[#52524E] text-[11px]">
                    {activeCommand.actionText}
                  </span>
                </div>
              ) : isCodeUnknown || errorMessage ? (
                <div className="text-center px-2 text-[#0D0D0D] font-medium bg-white py-1 px-3 rounded-full border border-[#E5E5E0] shadow-xs">
                  {errorMessage || 'Code not recognized. Please try a listed Quick Help code.'}
                </div>
              ) : code.length > 0 ? (
                <span className="text-[#6B6B6B] text-[11px]">
                  Enter remaining digits or select below
                </span>
              ) : (
                <span className="text-[#6B6B6B] text-[11px]">
                  Type a code on your keyboard or use keypad
                </span>
              )}
            </div>
          </div>

          {/* Keypad 3x4 Grid */}
          <div className="grid grid-cols-3 gap-3">
            {KEYPAD_KEYS.map((k) => {
              const isClear = k.num === 'C'
              const isDelete = k.num === 'DEL'

              return (
                <button
                  key={k.num}
                  type="button"
                  onClick={() => {
                    if (isClear) handleClear()
                    else if (isDelete) handleBackspace()
                    else handleKeyPress(k.num)
                  }}
                  className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 select-none active:scale-[0.97] border ${
                    k.isSpecial
                      ? 'bg-[#FAFAF7] hover:bg-white text-[#52524E] hover:text-[#0D0D0D] border-[#E5E5E0]'
                      : 'bg-white hover:bg-[#FAFAF7] text-[#0D0D0D] border-[#E5E5E0] hover:border-[#1A1A1A]/30 shadow-subtle'
                  }`}
                  aria-label={`Key ${k.num}`}
                >
                  <span className="text-xl font-bold font-mono leading-none">
                    {isDelete ? <Delete className="w-5 h-5 text-[#52524E]" /> : k.num}
                  </span>
                  <span className="text-[9px] font-semibold text-[#8C8C85] tracking-widest mt-1">
                    {k.sub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Action Row: Run Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleRun()}
              disabled={executing || !code}
              className="w-full py-3.5 px-6 rounded-full bg-[#1A1A1A] hover:bg-black text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Code {code}...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 text-white" />
                  <span>Run Command {code ? `(${code})` : ''}</span>
                </>
              )}
            </button>

            {/* Quick Context Active Pill */}
            {contextForm.flightNumber && (
              <div className="text-center">
                <span className="text-[11px] text-[#6B6B6B] inline-flex items-center gap-1.5">
                  <Plane className="w-3 h-3 text-[#246BFD]" />
                  Active Context: <strong>{contextForm.flightNumber}</strong> ({contextForm.origin}→{contextForm.destination})
                  <button
                    onClick={() => setShowContextModal(true)}
                    className="text-[#246BFD] underline ml-1 hover:text-[#1A1A1A]"
                  >
                    Change
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Command Directory & Suggested Codes */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E0] pb-3">
            <div>
              <h2 className="font-display font-semibold text-xl text-[#0D0D0D]">
                Assistance Code Directory
              </h2>
              <p className="text-xs text-[#52524E]">
                Click any command code to populate the dial pad and navigate immediately.
              </p>
            </div>
            <div className="text-xs text-[#6B6B6B]">
              <strong>8 Verified Codes</strong> Active
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commands.map((cmd) => {
              const isSelected = code === cmd.code

              return (
                <div
                  key={cmd.code}
                  onClick={() => handleSelectCommandCard(cmd)}
                  className={`surface-card p-5 cursor-pointer transition-all duration-200 relative flex flex-col justify-between text-left group ${
                    isSelected
                      ? 'border-[#1A1A1A] ring-1 ring-[#1A1A1A] bg-[#FAFAF7]'
                      : 'hover:border-[#1A1A1A]/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg text-[#0D0D0D] bg-white px-2.5 py-1 rounded-lg border border-[#E5E5E0] shadow-xs group-hover:border-[#1A1A1A]">
                        {cmd.code}
                      </span>
                      <span className="text-[10px] font-semibold text-[#52524E] bg-[#FAFAF7] px-2 py-0.5 rounded-full border border-[#E5E5E0]">
                        {cmd.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-semibold text-base text-[#0D0D0D] group-hover:text-[#246BFD] transition-colors">
                        {cmd.title}
                      </h3>
                      <p className="text-xs text-[#52524E] mt-1 line-clamp-2 leading-relaxed">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-[#6B6B6B]">
                      {cmd.actionText}
                    </span>
                    <span className="font-semibold text-[#1A1A1A] group-hover:text-[#246BFD] flex items-center gap-1">
                      Run <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal: Flight Context Provider Dialog */}
        {showContextModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="surface-card max-w-md w-full p-6 border border-[#E5E5E0] shadow-xl space-y-5 animate-scale-up">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0D0D0D]">
                    Flight Information Required
                  </h3>
                  <p className="text-xs text-[#52524E] mt-0.5">
                    {pendingCommand?.title || 'This command'} requires flight route details to locate the correct radar status and disruption telemetry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContextModal(false)}
                  className="p-1 rounded-full text-[#6B6B6B] hover:text-[#0D0D0D]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select from Saved Trips */}
              {savedTrips.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                    Pick From Your Saved Trips:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {savedTrips.slice(0, 3).map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => {
                          setContextForm(prev => ({
                            ...prev,
                            flightNumber: tr.flight_number,
                            origin: tr.origin || 'BOM',
                            destination: tr.destination || 'DEL'
                          }))
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          contextForm.flightNumber === tr.flight_number
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-[#FAFAF7] text-[#52524E] border-[#E5E5E0] hover:bg-white'
                        }`}
                      >
                        {tr.flight_number} ({tr.origin}→{tr.destination})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleModalSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#52524E] mb-1">
                    Flight Number (e.g. AI645, BA142, 6E521)
                  </label>
                  <input
                    type="text"
                    required
                    value={contextForm.flightNumber}
                    onChange={(e) => setContextForm({ ...contextForm, flightNumber: e.target.value.toUpperCase() })}
                    placeholder="AI645"
                    className="input-field uppercase font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#52524E] mb-1">
                      Origin Hub (IATA)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={contextForm.origin}
                      onChange={(e) => setContextForm({ ...contextForm, origin: e.target.value.toUpperCase() })}
                      placeholder="BOM"
                      className="input-field uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#52524E] mb-1">
                      Destination (IATA)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={contextForm.destination}
                      onChange={(e) => setContextForm({ ...contextForm, destination: e.target.value.toUpperCase() })}
                      placeholder="DEL"
                      className="input-field uppercase font-mono"
                    />
                  </div>
                </div>

                {pendingCommand?.code === '103' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#52524E] mb-1">
                      Connecting Airport (IATA)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={contextForm.connectingAirport}
                      onChange={(e) => setContextForm({ ...contextForm, connectingAirport: e.target.value.toUpperCase() })}
                      placeholder="DEL"
                      className="input-field uppercase font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowContextModal(false)}
                    className="btn-secondary text-xs py-2 px-4 rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-5 rounded-full"
                  >
                    Continue to Action
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
