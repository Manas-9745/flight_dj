import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  PhoneCall,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Delete,
  ArrowRight,
  Plane,
  Building,
  Clock,
  Compass,
  Sparkles,
  ShieldAlert,
  AlertOctagon,
  Search,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react'
import {
  getQuickHelpCommands,
  resolveQuickHelpCommand,
  logQuickHelpExecution,
  getTrips
} from '../services/api'
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../services/voiceService'

// Pre-defined commands
const DEFAULT_COMMANDS = [
  {
    code: '101',
    title: 'Flight delayed',
    actionText: 'Retrieve status & delay options',
    description: 'Check real-time delay minutes, revised departure/arrival schedules, and compensation rights.',
    category: 'Flight Operations',
    targetRoute: '/flight',
    requiresFlightNumber: true
  },
  {
    code: '102',
    title: 'Flight cancelled',
    actionText: 'Find alternatives & rebook',
    description: 'Open Disruption Manager to find alternative flights across carriers and initiate recovery.',
    category: 'Disruption Recovery',
    targetRoute: '/disruption',
    targetTab: 'alternatives',
    requiresFlightNumber: false
  },
  {
    code: '103',
    title: 'Missed connection',
    actionText: 'Analyze connection risk & itinerary',
    description: 'Calculate downstream impacts on tight transfers, luggage transfer, and onward journey flights.',
    category: 'Journey Continuity',
    targetRoute: '/disruption',
    targetTab: 'impact',
    requiresFlightNumber: false
  },
  {
    code: '104',
    title: 'Find a hotel',
    actionText: 'Nearby hotels during disruptions',
    description: 'Find hotels near the stranded airport or destination when flights are delayed or cancelled.',
    category: 'Accommodation',
    targetRoute: '/disruption',
    targetTab: 'hotels',
    requiresFlightNumber: false
  },
  {
    code: '105',
    title: 'Airport navigation',
    actionText: 'Turn-by-turn wayfinding guide',
    description: 'Step-by-step guidance through domestic or international terminal check-in, security, and gates.',
    category: 'Wayfinding',
    targetRoute: '/navigation',
    requiresFlightNumber: false
  },
  {
    code: '106',
    title: 'Travel alerts',
    actionText: 'Conflict zones & safety notices',
    description: 'Official airspace advisories, route hazard checks, and aviation safety bulletins.',
    category: 'Airspace Safety',
    targetRoute: '/alerts',
    requiresFlightNumber: false
  },
  {
    code: '107',
    title: 'Ask AI',
    actionText: 'Conversational travel concierge',
    description: 'Inquire about delay compensation regulations (DGCA/EU261), baggage rules, or airline rebooking.',
    category: 'AI Concierge',
    targetRoute: '/assistant',
    requiresFlightNumber: false
  },
  {
    code: '108',
    title: 'Check flight status',
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
  const [executing, setExecuting] = useState(false)
  const [unrecognizedSubmitted, setUnrecognizedSubmitted] = useState(null)

  // Call Simulation & IVR Voice Mode State
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [ivrPrompt, setIvrPrompt] = useState('')
  const timerRef = useRef(null)

  // Context Dialog Modal State (for flight number required)
  const [showContextModal, setShowContextModal] = useState(false)
  const [pendingCommand, setPendingCommand] = useState(null)
  const [contextForm, setContextForm] = useState({
    flightNumber: 'AI161',
    origin: 'LHR',
    destination: 'JFK',
    connectingAirport: 'DEL',
    question: ''
  })

  // Load commands from API with graceful local fallback
  useEffect(() => {
    getQuickHelpCommands()
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setCommands(res.data)
        }
      })
      .catch(() => {})

    // Preload user's saved trips for quick context selection
    getTrips(token)
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
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

  // Voice IVR Speech Prompts
  const IVR_MENU_SPEECH =
    'Welcome to AeroMate Customer Service. ' +
    'Please enter your three-digit assistance code on the dial pad. ' +
    'Dial 101 for Flight Delay status. ' +
    'Dial 102 for Cancelled Flights and Rebooking. ' +
    'Dial 103 for Missed Connections. ' +
    'Dial 104 for Nearby Hotels. ' +
    'Dial 105 for Airport Navigation. ' +
    'Dial 106 for Airspace Travel Alerts. ' +
    'Dial 107 to Speak with AI Concierge. ' +
    'Or Dial 108 for Live Flight Radar Telemetry.'

  const handleStartCall = () => {
    setIsCallActive(true)
    setCallDuration(0)
    setCode('')
    setUnrecognizedSubmitted(null)
    setIvrPrompt('Customer service line connected. Speaking automated menu options…')

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    // Speak menu options
    speakText(IVR_MENU_SPEECH, 'en', () => {
      setIvrPrompt('Enter a 3-digit code on the dial pad to execute…')
    })
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setCallDuration(0)
    setIvrPrompt('')
    stopSpeaking()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopSpeaking()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Keypad Handlers
  const handleKeyPress = (digit) => {
    setUnrecognizedSubmitted(null)
    if (code.length < 3) {
      const nextCode = code + digit
      setCode(nextCode)

      // Audio feedback for dialed number
      if (isCallActive) {
        speakText(digit, 'en')
      }

      // If completes 3 digits
      if (nextCode.length === 3) {
        const found = commands.find(c => c.code === nextCode)
        if (found) {
          if (isCallActive) {
            speakText(`You selected ${found.title}. Connecting you now.`, 'en', () => {
              handleRun(nextCode)
            })
          }
        } else {
          if (isCallActive) {
            speakText(`Code ${nextCode} is not recognized. Please try again.`, 'en')
          }
        }
      }
    }
  }

  const handleBackspace = () => {
    setUnrecognizedSubmitted(null)
    setCode(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setUnrecognizedSubmitted(null)
    setCode('')
  }

  // Trigger command execution
  const handleRun = async (targetCode = code) => {
    const dialed = String(targetCode || code).trim()
    if (!dialed) return

    const selected = commands.find(c => c.code === dialed)

    // Silent background audit logging
    logQuickHelpExecution({
      code: dialed,
      status: selected ? 'SUBMITTED' : 'UNRECOGNIZED_CODE',
      commandTitle: selected ? selected.title : 'Unrecognized Code',
      flightNumber: contextForm.flightNumber || 'AI161',
      origin: contextForm.origin || 'LHR',
      destination: contextForm.destination || 'JFK',
      message: selected ? `Code ${dialed}: ${selected.title}` : `Code ${dialed} not recognized.`
    }).catch(() => {})

    // If Unrecognized Code (e.g. 123, 888)
    if (!selected) {
      setUnrecognizedSubmitted(dialed)
      return
    }

    // If missing required flight number, prompt for flight number
    if (selected.requiresFlightNumber && !contextForm.flightNumber) {
      setPendingCommand(selected)
      setShowContextModal(true)
      return
    }

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
    } catch {
      // Graceful fallback to target route
      navigate(selected.targetRoute, { state: { tab: selected.targetTab, flightNumber: contextForm.flightNumber } })
    } finally {
      setExecuting(false)
    }
  }

  // One-click select and run
  const handleSelectOption = (cmd) => {
    setCode(cmd.code)
    setUnrecognizedSubmitted(null)
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

  const showUnrecognizedBlock = unrecognizedSubmitted || isCodeUnknown

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-24 pb-20 font-sans text-[#0D0D0D]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
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
            Enter a 3-digit assistance code or pick a command below to resolve travel issues instantly.
          </p>
        </div>

        {/* Central Dial Pad */}
        <div className="max-w-md mx-auto surface-card p-6 sm:p-8 border border-[#E5E5E0] shadow-subtle space-y-5">

          {/* Interactive Customer Support Call Mode Banner */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
            isCallActive
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
              : 'bg-[#FAFAF7] border-[#E5E5E0] text-[#0D0D0D]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isCallActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-[#1A1A1A] text-white'
              }`}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm">
                    {isCallActive ? 'Support Call Active' : 'Automated Phone Agent'}
                  </h3>
                  {isCallActive && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-mono font-bold animate-pulse">
                      {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  {isCallActive
                    ? 'Interactive voice prompts speaking options...'
                    : 'Dial 101, 102, 103... with voice narration'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={isCallActive ? handleEndCall : handleStartCall}
              className={`px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                isCallActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isCallActive ? (
                <>
                  <PhoneOff className="w-3.5 h-3.5" /> End Call
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5" /> Start Call
                </>
              )}
            </button>
          </div>

          {/* Active Call Voice Transcription / IVR Prompt Screen */}
          {isCallActive && ivrPrompt && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 animate-fade-in">
              <Volume2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="font-medium leading-relaxed">{ivrPrompt}</p>
            </div>
          )}

          {/* Numeric Readout Screen */}
          <div className="bg-[#FAFAF7] border border-[#E5E5E0] rounded-2xl p-5 text-center space-y-2 relative">
            <div className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider flex items-center justify-between px-1">
              <span>Assistance Code</span>
              <span className="font-mono text-[#0D0D0D]">{code.length}/3 Digits</span>
            </div>

            {/* 3-Digit Display */}
            <div className="h-16 flex items-center justify-center font-mono font-bold text-4xl sm:text-5xl text-[#0D0D0D] tracking-[0.25em]">
              {code ? (
                <span>{code}</span>
              ) : (
                <span className="text-[#CACAC5] tracking-[0.3em]">_ _ _</span>
              )}
            </div>

            {/* Interpretation */}
            <div className="min-h-[38px] flex items-center justify-center text-xs">
              {activeCommand ? (
                <div className="text-center">
                  <span className="font-semibold text-[#0D0D0D] block">
                    {activeCommand.code} — {activeCommand.title}
                  </span>
                  <span className="text-[#52524E] text-[11px]">
                    {activeCommand.actionText}
                  </span>
                </div>
              ) : showUnrecognizedBlock ? (
                <span className="text-xs font-semibold text-[#0D0D0D]">
                  Code not recognized
                </span>
              ) : code.length > 0 ? (
                <span className="text-[#6B6B6B] text-[11px]">
                  Enter remaining digits or select below
                </span>
              ) : (
                <span className="text-[#6B6B6B] text-[11px]">
                  Type a 3-digit code or choose an option
                </span>
              )}
            </div>
          </div>

          {/* Keypad Grid */}
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

          {/* Action Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleRun()}
              disabled={executing || !code}
              className="w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-subtle bg-[#1A1A1A] hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 text-white" />
                  <span>Run Command {code ? `(${code})` : ''}</span>
                </>
              )}
            </button>

            {/* Code Not Recognized Fallback Actions */}
            {showUnrecognizedBlock && (
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E0] text-center space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-[#0D0D0D]">
                    Code not recognized
                  </h3>
                  <p className="text-xs text-[#52524E]">
                    Choose an available option below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
                  {commands.map((cmd) => (
                    <button
                      key={cmd.code}
                      type="button"
                      onClick={() => handleSelectOption(cmd)}
                      className="px-3 py-2 rounded-xl bg-[#FAFAF7] hover:bg-[#F0F0EB] border border-[#E5E5E0] text-xs font-medium text-[#0D0D0D] transition-colors flex items-center justify-between"
                    >
                      <span>
                        <strong className="font-mono">{cmd.code}</strong> — {cmd.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#6B6B6B]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Flight Context Pill */}
            {contextForm.flightNumber && (
              <div className="text-center pt-1">
                <span className="text-[11px] text-[#6B6B6B] inline-flex items-center gap-1.5">
                  <Plane className="w-3 h-3 text-[#246BFD]" />
                  Active Flight: <strong>{contextForm.flightNumber}</strong> ({contextForm.origin}→{contextForm.destination})
                  <button
                    type="button"
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

        {/* Available Options Directory */}
        <div className="space-y-4 pt-4">
          <div className="border-b border-[#E5E5E0] pb-3 text-center sm:text-left">
            <h2 className="font-display font-semibold text-xl text-[#0D0D0D]">
              Available Options
            </h2>
            <p className="text-xs text-[#52524E]">
              Select an option to run the command directly.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commands.map((cmd) => {
              const isSelected = code === cmd.code

              return (
                <div
                  key={cmd.code}
                  onClick={() => handleSelectOption(cmd)}
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
                      <span className="text-[11px] text-[#6B6B6B] font-medium">
                        {cmd.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-base text-[#0D0D0D] group-hover:text-[#246BFD] transition-colors">
                        {cmd.title}
                      </h3>
                      <p className="text-xs text-[#52524E] mt-1 leading-relaxed">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs font-semibold text-[#1A1A1A]">
                    <span>{cmd.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#246BFD] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Flight Context Modal */}
      {showContextModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E5E0] shadow-xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#246BFD]" />
                <h3 className="font-display font-semibold text-base text-[#0D0D0D]">
                  Enter Flight Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContextModal(false)}
                className="text-[#6B6B6B] hover:text-[#0D0D0D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#52524E] block mb-1">
                  Flight Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI161, BA142"
                  value={contextForm.flightNumber}
                  onChange={e => setContextForm({ ...contextForm, flightNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-[#FAFAF7] border border-[#E5E5E0] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0D0D0D] outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#52524E] block mb-1">
                    Origin Airport
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="LHR"
                    value={contextForm.origin}
                    onChange={e => setContextForm({ ...contextForm, origin: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAFAF7] border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-semibold text-[#0D0D0D] outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#52524E] block mb-1">
                    Destination Airport
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="JFK"
                    value={contextForm.destination}
                    onChange={e => setContextForm({ ...contextForm, destination: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAFAF7] border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-semibold text-[#0D0D0D] outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E0]">
                <button
                  type="button"
                  onClick={() => setShowContextModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#52524E] hover:bg-[#FAFAF7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
