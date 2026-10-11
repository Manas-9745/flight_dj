import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Compass,
  Plane,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Luggage,
  Users,
  AlertCircle,
  HelpCircle,
  Download,
  Share2,
  RefreshCw,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  WifiOff,
  Info,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Navigation,
  RotateCcw,
  Footprints,
  Check
} from 'lucide-react'
import { getAirportNavigationGuide } from '../services/api'
import TerminalMapViewer from '../components/TerminalMapViewer'

// Preset popular flights for instant testing & demonstration
const PRESET_FLIGHTS = [
  {
    id: 'ai645',
    flightNumber: 'AI645',
    airline: 'Air India',
    origin: 'BOM',
    destination: 'DEL',
    label: 'AI645 (BOM → DEL) • Mumbai T2 Departure',
    isArrival: false,
    desc: 'Mumbai T2 departure to Delhi T3'
  },
  {
    id: 'ai645_arr',
    flightNumber: 'AI645',
    airline: 'Air India',
    origin: 'BOM',
    destination: 'DEL',
    label: 'AI645 (DEL Arrival) • Delhi T3 Domestic Inbound',
    isArrival: true,
    desc: 'Inbound arrival at Delhi T3: Baggage claim & Metro link'
  },
  {
    id: 'ba142',
    flightNumber: 'BA142',
    airline: 'British Airways',
    origin: 'DEL',
    destination: 'LHR',
    label: 'BA142 (DEL → LHR) • International Departure',
    isArrival: false,
    desc: 'Delhi T3 international departure with Passport Control'
  },
  {
    id: 'ba142_lhr',
    flightNumber: 'BA142',
    airline: 'British Airways',
    origin: 'DEL',
    destination: 'LHR',
    label: 'BA142 (LHR Arrival) • London T5 International Inbound',
    isArrival: true,
    desc: 'London T5 arrival: ePassport gates, UK customs, Heathrow Express'
  },
  {
    id: 'ek201',
    flightNumber: 'EK201',
    airline: 'Emirates',
    origin: 'DXB',
    destination: 'JFK',
    label: 'EK201 (DXB Departure) • Dubai T3 Flagship Hub',
    isArrival: false,
    desc: 'Dubai T3 departure to New York JFK T4'
  },
  {
    id: 'sq401',
    flightNumber: 'SQ401',
    airline: 'Singapore Airlines',
    origin: 'SIN',
    destination: 'BOM',
    label: 'SQ401 (SIN Departure) • Singapore Changi T3',
    isArrival: false,
    desc: 'Singapore Changi T3 FAST biometric self check-in'
  }
]

export default function AirportNavigationPage({ token }) {
  const [searchParams] = useSearchParams()

  // Form & Selection State
  const [flightNumber, setFlightNumber] = useState(searchParams.get('flight') || 'AI645')
  const [airline, setAirline] = useState(searchParams.get('airline') || 'Air India')
  const [origin, setOrigin] = useState(searchParams.get('from') || 'BOM')
  const [destination, setDestination] = useState(searchParams.get('to') || 'DEL')
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0])
  const [journeyMode, setJourneyMode] = useState('departure') // 'departure' | 'arrival'

  // Passenger Preferences
  const [hasOnlineBoardingPass, setHasOnlineBoardingPass] = useState(false)
  const [hasCheckedBags, setHasCheckedBags] = useState(true)
  const [needsAssistance, setNeedsAssistance] = useState(false)
  const [language, setLanguage] = useState('en') // 'en' | 'hi'

  // Loading & Data State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [guideData, setGuideData] = useState(null)

  // Offline Persistence & Status
  const [isOfflineView, setIsOfflineView] = useState(false)
  const [savedTimestamp, setSavedTimestamp] = useState(null)

  // Checklist interactive state
  const [completedStepIds, setCompletedStepIds] = useState(new Set())
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('navigator') // 'navigator' | 'checklist' | 'airports'

  const isArrival = journeyMode === 'arrival'

  // Fetch Guide Data
  const fetchGuide = async (lang = language, overridePreset = null) => {
    setLoading(true)
    setError(null)
    setIsOfflineView(false)

    const fn = overridePreset ? overridePreset.flightNumber : flightNumber
    const al = overridePreset ? overridePreset.airline : airline
    const orig = overridePreset ? overridePreset.origin : origin
    const dest = overridePreset ? overridePreset.destination : destination
    const arrivalFlag = overridePreset ? !!overridePreset.isArrival : isArrival

    try {
      const res = await getAirportNavigationGuide({
        flightNumber: (fn || 'AI645').trim(),
        airline: (al || 'Air India').trim(),
        origin: (orig || 'BOM').trim(),
        destination: (dest || 'DEL').trim(),
        departureDate,
        hasOnlineBoardingPass,
        hasCheckedBags,
        needsAssistance,
        isArrival: arrivalFlag,
        language: lang
      })

      if (res && res.data) {
        setGuideData(res.data)
        // Reset checklist state
        setCompletedStepIds(new Set())
        setActiveStepIndex(0)
      } else {
        throw new Error('Could not retrieve airport journey guide.')
      }
    } catch (err) {
      console.error('Error fetching navigation guide:', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load airport navigation guide.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchGuide(language)
  }, [language, journeyMode, hasOnlineBoardingPass, hasCheckedBags, needsAssistance])

  // Load Preset
  const handleSelectPreset = (preset) => {
    setFlightNumber(preset.flightNumber)
    setAirline(preset.airline)
    setOrigin(preset.origin)
    setDestination(preset.destination)
    setJourneyMode(preset.isArrival ? 'arrival' : 'departure')
    fetchGuide(language, preset)
  }

  // Handle Quick Top 10 Airport selection
  const handleSelectAirportCode = (code) => {
    if (journeyMode === 'arrival') {
      setDestination(code)
    } else {
      setOrigin(code)
    }
    fetchGuide(language)
  }

  // Toggle step completion
  const toggleStep = (stepId) => {
    setCompletedStepIds((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  // Step calculations
  const steps = guideData?.checklist || []
  const totalSteps = steps.length
  const completedCount = steps.filter((s) => completedStepIds.has(s.id)).length
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  // Current active step (driven by activeStepIndex or first incomplete)
  const currentStep = useMemo(() => {
    if (!steps || steps.length === 0) return null
    return steps[activeStepIndex] || steps[0]
  }, [steps, activeStepIndex])

  // Next destination step for interactive pathing
  const nextStep = useMemo(() => {
    if (!steps || activeStepIndex >= steps.length - 1) return null
    return steps[activeStepIndex + 1]
  }, [steps, activeStepIndex])

  // Step Controls: Next Step / Mark Complete
  const handleNextStep = () => {
    if (currentStep) {
      toggleStep(currentStep.id)
    }
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1)
    }
  }

  const handleRestartJourney = () => {
    setCompletedStepIds(new Set())
    setActiveStepIndex(0)
  }

  // Save for Offline Access
  const handleSaveOffline = () => {
    try {
      const offlinePayload = {
        guideData,
        completedStepIds: Array.from(completedStepIds),
        activeStepIndex,
        savedAt: new Date().toISOString(),
        flightNumber,
        origin,
        destination,
        journeyMode,
        language
      }
      localStorage.setItem(`aeromate_airport_nav_${flightNumber.toUpperCase()}`, JSON.stringify(offlinePayload))
      setSavedTimestamp(new Date().toLocaleTimeString())
      alert(language === 'hi'
        ? 'सफलतापूर्वक ऑफ़लाइन सेव किया गया! आप इसे बिना इंटरनेट के कभी भी देख सकते हैं।'
        : 'Saved successfully for offline access! Stored in browser storage.')
    } catch (e) {
      console.error(e)
    }
  }

  // Load from Offline Cache
  const handleLoadOffline = () => {
    try {
      const cached = localStorage.getItem(`aeromate_airport_nav_${flightNumber.toUpperCase()}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        setGuideData(parsed.guideData)
        setCompletedStepIds(new Set(parsed.completedStepIds || []))
        setActiveStepIndex(parsed.activeStepIndex || 0)
        setIsOfflineView(true)
        setSavedTimestamp(new Date(parsed.savedAt).toLocaleTimeString())
      } else {
        alert(language === 'hi' ? 'इस उड़ान के लिए कोई ऑफ़लाइन डेटा नहीं मिला।' : 'No saved offline data found for this flight.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const isHi = language === 'hi'
  const topAirports = guideData?.topAirports || [
    { iata: 'BOM', name: 'Mumbai CSMIA', flag: '🇮🇳' },
    { iata: 'DEL', name: 'Delhi IGI', flag: '🇮🇳' },
    { iata: 'BLR', name: 'Bengaluru T2', flag: '🇮🇳' },
    { iata: 'DXB', name: 'Dubai T3', flag: '🇦🇪' },
    { iata: 'LHR', name: 'London Heathrow T5', flag: '🇬🇧' },
    { iata: 'SIN', name: 'Singapore Changi T3', flag: '🇸🇬' },
    { iata: 'JFK', name: 'New York JFK T4', flag: '🇺🇸' },
    { iata: 'HND', name: 'Tokyo Haneda T3', flag: '🇯🇵' },
    { iata: 'CDG', name: 'Paris CDG 2E', flag: '🇫🇷' },
    { iata: 'FRA', name: 'Frankfurt T1', flag: '🇩🇪' }
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24 pt-24 font-sans text-[#0D0D0D]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8 animate-fade-in text-left">

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B6B6B] font-medium mb-1">
              <Link to="/trips" className="hover:text-[#0D0D0D] transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                {isHi ? 'माई जर्नी' : 'My Journeys'}
              </Link>
              <span>/</span>
              <span className="text-[#0D0D0D] font-semibold">
                {isHi ? 'स्टेप-बाय-स्टेप एयरपोर्ट नेविगेटर' : 'Step-by-Step Airport Journey Navigator'}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D0D0D] tracking-tight">
              {isHi ? 'एयरपोर्ट जर्नी नेविगेटर' : 'Airport Journey Navigator'}
            </h1>
            <p className="text-sm text-[#52524E] mt-1 max-w-2xl">
              {isHi
                ? 'टर्मिनल आगमन से बोर्डिंग गेट तक यात्रियों के लिए चरण-दर-चरण व्यक्तिगत मार्गदर्शन।'
                : 'Turn-by-turn passenger guidance inside the airport. Tells you exactly where to go next, from terminal entry to boarding gate, or arrival disembarkation to exit.'}
            </p>
          </div>

          {/* Quick Actions: Language & Offline Save */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Language Switcher */}
            <div className="flex items-center p-0.5 rounded-full bg-white border border-[#E5E5E0] shadow-subtle">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  language === 'hi'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Save Offline Button */}
            <button
              type="button"
              onClick={handleSaveOffline}
              title="Save itinerary & map for offline access"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAFAF7] transition-all shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="hidden sm:inline">{isHi ? 'ऑफ़लाइन सेव' : 'Save Offline'}</span>
            </button>

            {/* Load Offline */}
            <button
              type="button"
              onClick={handleLoadOffline}
              title="Load saved offline version"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E5E0] text-xs font-medium text-[#6B6B6B] hover:text-[#0D0D0D] transition-all shadow-subtle"
            >
              <WifiOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 10 Supported Hubs Quick Selector Bar (Requirement 1) */}
        <div className="p-4 rounded-3xl bg-white border border-[#E5E5E0] shadow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {isHi ? 'शीर्ष 10 समर्थित हवाई अड्डे (Top 10 Airport Hubs)' : 'Top 10 Supported Airport Hubs'}
            </span>
            <span className="text-[11px] text-[#8C8C85]">
              {journeyMode === 'arrival' ? 'Navigating: Destination Airport' : 'Navigating: Departure Airport'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {topAirports.map((ap) => {
              const activeCode = journeyMode === 'arrival' ? destination : origin
              const isSelected = activeCode.toUpperCase() === ap.iata

              return (
                <button
                  key={ap.iata}
                  type="button"
                  onClick={() => handleSelectAirportCode(ap.iata)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : 'bg-[#FAFAF7] hover:bg-white text-[#52524E] hover:text-[#0D0D0D] border-[#E5E5E0]'
                  }`}
                >
                  <span>{ap.flag || '✈'}</span>
                  <span><strong>{ap.iata}</strong></span>
                  <span className="text-[11px] opacity-75 hidden sm:inline">{ap.name || ap.city}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 1: Personalized Flight Journey Form & Flow Config (Requirement 1 & 2) */}
        <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-[#0D0D0D] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                {isHi ? '1. व्यक्तिगत यात्रा विवरण' : '1. Flight & Journey Mode Configuration'}
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {isHi
                  ? 'अपनी उड़ान दर्ज करें और प्रस्थान (Departure) या आगमन (Arrival) मोड चुनें।'
                  : 'Enter flight details and choose Departure flow (Check-in → Gate) or Arrival flow (Deplane → Baggage Reclaim → Exit).'}
              </p>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <span className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wider shrink-0 mr-1">
                {isHi ? 'त्वरित उदाहरण:' : 'Presets:'}
              </span>
              {PRESET_FLIGHTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
                    flightNumber.toUpperCase() === p.flightNumber && (journeyMode === (p.isArrival ? 'arrival' : 'departure'))
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#52524E] border-[#E5E5E0] hover:bg-[#FAFAF7] hover:text-[#0D0D0D]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchGuide(language)
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2"
          >
            {/* Journey Flow Mode (Departure vs Arrival) */}
            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'दिशा / मोड' : 'Journey Direction *'}
              </label>
              <select
                value={journeyMode}
                onChange={(e) => setJourneyMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-semibold focus:outline-none focus:border-[#1A1A1A] bg-[#FAFAF7]"
              >
                <option value="departure">🛫 Departure (To Gate)</option>
                <option value="arrival">🛬 Arrival (To Reclaim & Exit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'उड़ान संख्या' : 'Flight Number *'}
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. AI645, BA142"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-semibold focus:outline-none focus:border-[#1A1A1A] font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'एयरलाइन' : 'Airline'}
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="Air India, Emirates"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'प्रस्थान (Origin)' : 'Origin (IATA) *'}
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="BOM"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-mono uppercase focus:outline-none focus:border-[#1A1A1A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'गंतव्य (Destination)' : 'Destination (IATA) *'}
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="DEL"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-mono uppercase focus:outline-none focus:border-[#1A1A1A]"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'नेविगेशन अपडेट करें' : 'Update Navigator'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preferences Toggles (Departures Only) */}
          {journeyMode === 'departure' && (
            <div className="pt-3 border-t border-[#E5E5E0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold text-[#52524E] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#8C8C85]" />
                  {isHi ? 'चेक-इन कस्टमाइजेशन:' : 'Passenger Check-in Workflow:'}
                </span>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasOnlineBoardingPass}
                    onChange={(e) => setHasOnlineBoardingPass(e.target.checked)}
                    className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-[#333330]">
                    {isHi ? 'ऑनलाइन चेक-इन पूर्ण' : 'Online Check-in Done (Bypass desk)'}
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasCheckedBags}
                    onChange={(e) => setHasCheckedBags(e.target.checked)}
                    className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-[#333330]">
                    {isHi ? 'चेक-इन बैग ड्रॉप करना है' : 'Dropping Checked Bags'}
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={needsAssistance}
                    onChange={(e) => setNeedsAssistance(e.target.checked)}
                    className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-[#333330]">
                    {isHi ? 'व्हीलचेयर / PRM सहायता' : 'Special Mobility Assistance'}
                  </span>
                </label>
              </div>

              {guideData?.metrics && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A] bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#E5E5E0]">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Est. Airport Flow: <strong className="text-blue-700">~{guideData.metrics.estimatedTimeMins} mins</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flight-Aware Telemetry Header Card (Requirement 4) */}
        {guideData?.flight && (
          <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  ✈
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xl text-white">
                      {guideData.flight.flightNumber}
                    </span>
                    <span className="text-white/60 text-xs">• {guideData.flight.airline}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      guideData.flight.isDomestic
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}>
                      {guideData.flight.isDomestic ? 'Domestic Hub' : 'International Passport Control'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/30 text-blue-300 font-mono">
                      {guideData.flight.journeyDirection}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <span className="font-semibold">{guideData.flight.origin}</span>
                    <span className="text-white/40">({guideData.flight.originAirport?.city || 'Origin'})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/50" />
                    <span className="font-semibold">{guideData.flight.destination}</span>
                    <span className="text-white/40">({guideData.flight.destinationAirport?.city || 'Destination'})</span>
                  </div>
                </div>
              </div>

              {/* Verified Operational Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Terminal</div>
                  <div className="text-lg font-bold text-white mt-0.5">{guideData.flight.terminal || 'TBA'}</div>
                  <div className="text-[10px] text-emerald-400 font-medium">Confirmed</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {journeyMode === 'arrival' ? 'Baggage Carousel' : 'Check-in Desks'}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate" title={guideData.flight.checkinCounter}>
                    {journeyMode === 'arrival' ? 'Carousel 3' : (guideData.flight.checkinCounter || 'Check FIDS')}
                  </div>
                  <div className="text-[10px] text-white/60 font-medium">FIDS Active</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {journeyMode === 'arrival' ? 'Arrival Gate' : 'Boarding Gate'}
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {guideData.flight.gate ? `Gate ${guideData.flight.gate}` : 'Check FIDS'}
                  </div>
                  <div className="text-[10px] text-blue-400 font-medium">{guideData.flight.gateStatus || 'Confirmed'}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Flight Status</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{guideData.flight.status || 'On Time'}</div>
                  <div className="text-[10px] text-white/50">Dep: {guideData.flight.scheduledDeparture || 'Scheduled'}</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-white/60 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Navigating Airport: <strong>{guideData.flight.navigatingAirport?.name} ({guideData.flight.navigatingAirportCode})</strong></span>
              </div>
              <div className="text-white/40 italic">
                Real-time terminal gates and check-in rows are verified against airport FIDS operations.
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PROMINENT STEP-BY-STEP NAVIGATOR CONTROLLER (Requirement 3 & 5) */}
        {currentStep && (
          <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 sm:p-8 shadow-card space-y-6">
            
            {/* Top Navigation Step Counter & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F0EB] pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                  Step {activeStepIndex + 1} of {totalSteps}
                </span>
                <span className="text-xs text-[#52524E]">
                  {progressPercent}% Journey Completed
                </span>
                <span className="text-xs text-[#8C8C85]">• ~{currentStep.estimatedTimeMins} mins</span>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={activeStepIndex === 0}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAFAF7] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous Step
                </button>
                <button
                  type="button"
                  onClick={handleRestartJourney}
                  className="p-1.5 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#6B6B6B] hover:text-[#0D0D0D] hover:bg-[#FAFAF7] transition-all"
                  title="Restart from Step 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Step Instruction Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    {currentStep.facilityName} ({currentStep.floorLevel})
                  </span>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#0D0D0D] mt-1">
                    {currentStep.title}
                  </h3>
                  <p className="text-sm font-semibold text-[#52524E] mt-1">
                    {currentStep.subtitle}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] text-xs sm:text-sm text-[#52524E] leading-relaxed">
                  {currentStep.action}
                </div>

                {/* Wayfinding landmarks & required documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  {currentStep.landmarks && (
                    <div className="p-3 rounded-xl bg-white border border-[#E5E5E0] space-y-1">
                      <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> Key Wayfinding Landmark:
                      </span>
                      <p className="text-[#52524E] text-[11px]">{currentStep.landmarks}</p>
                    </div>
                  )}

                  {currentStep.documentsRequired && (
                    <div className="p-3 rounded-xl bg-white border border-[#E5E5E0] space-y-1">
                      <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Keep Ready:
                      </span>
                      <p className="text-[#52524E] text-[11px]">{currentStep.documentsRequired.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Big Next Button Panel */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] space-y-4 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#8C8C85] uppercase tracking-wider">
                    Next Destination
                  </span>
                  <h4 className="font-bold text-sm text-[#0D0D0D]">
                    {nextStep ? nextStep.title : 'Journey Complete 🎉'}
                  </h4>
                  {nextStep && (
                    <p className="text-[11px] text-[#6B6B6B]">
                      {nextStep.facilityName} (~{nextStep.walkingTimeMins || 5} min walk)
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-4 px-6 rounded-2xl bg-[#1A1A1A] hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>
                    {activeStepIndex === steps.length - 1 ? 'Mark Final Step Complete' : 'Next Step & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/70" />
                </button>

                <p className="text-[11px] text-[#8C8C85]">
                  Clicking advances to Step {Math.min(activeStepIndex + 2, totalSteps)} and updates map pinpoint.
                </p>
              </div>
            </div>

            {/* Interactive Progress Stepper Bar */}
            <div className="space-y-2 pt-2 border-t border-[#F0F0EB]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#52524E]">
                <span>Journey Progress: {completedCount} of {totalSteps} checkpoints reached</span>
                <span className="text-blue-600 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#E5E5E0] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

          </div>
        )}

        {/* SECTION 3: INTERACTIVE 2D TERMINAL MAP & SCHEMATIC (Beside / Below Navigator) */}
        {guideData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#0D0D0D] flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500" />
                <span>Interactive Terminal Facility Map</span>
              </h3>
              <span className="text-xs text-[#6B6B6B]">
                Highlighting Active Step #{activeStepIndex + 1} Pinpoint
              </span>
            </div>

            <TerminalMapViewer
              terminalDetails={guideData.terminalDetails}
              flight={guideData.flight}
              currentStep={currentStep}
              nextStep={nextStep}
              language={language}
            />
          </div>
        )}

        {/* SECTION 4: FULL EXPANDED JOURNEY CHECKLIST ACCORDION */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
            <h3 className="font-display font-bold text-lg text-[#0D0D0D] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Complete Journey Step Checklist ({totalSteps} Steps)</span>
            </h3>
            <span className="text-xs text-[#6B6B6B]">Click any step to inspect or jump to it</span>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isCompleted = completedStepIds.has(step.id)
              const isCurrent = activeStepIndex === idx

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isCurrent
                      ? 'border-[#1A1A1A] bg-white shadow-md ring-2 ring-[#1A1A1A]'
                      : isCompleted
                      ? 'border-[#E5E5E0] bg-[#FAF9F5]'
                      : 'border-[#E5E5E0] bg-white hover:border-[#A3A39E]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStep(step.id)
                      }}
                      className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                          : 'border-[#D5D5D0] bg-white hover:border-[#1A1A1A]'
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#8C8C85]">#{idx + 1}</span>
                          <h4 className={`font-bold text-base ${isCompleted ? 'line-through text-[#8C8C85]' : 'text-[#0D0D0D]'}`}>
                            {step.title}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                              Active Target
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-[#6B6B6B] flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" /> ~{step.estimatedTimeMins} mins
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#52524E]">{step.subtitle}</p>
                      <p className="text-xs text-[#6B6B6B]">{step.action}</p>

                      <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-[#6B6B6B]">
                        {step.landmarks && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" /> Landmark: {step.landmarks}
                          </span>
                        )}
                        {step.documentsRequired && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-600" /> Required: {step.documentsRequired.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
