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
  ArrowLeft
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
    label: 'AI645 (BOM → DEL) • Domestic Hub',
    desc: 'Mumbai T2 to Delhi T3'
  },
  {
    id: 'ba142',
    flightNumber: 'BA142',
    airline: 'British Airways',
    origin: 'DEL',
    destination: 'LHR',
    label: 'BA142 (DEL → LHR) • International Long-Haul',
    desc: 'Delhi T3 to London Heathrow T5 with Passport Control'
  },
  {
    id: 'ek201',
    flightNumber: 'EK201',
    airline: 'Emirates',
    origin: 'DXB',
    destination: 'JFK',
    label: 'EK201 (DXB → JFK) • International Transatlantic',
    desc: 'Dubai T3 to New York JFK T4'
  },
  {
    id: '6e521',
    flightNumber: '6E521',
    airline: 'IndiGo',
    origin: 'BLR',
    destination: 'BOM',
    label: '6E521 (BLR → BOM) • Domestic Metro',
    desc: 'Bengaluru T1 to Mumbai T2'
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
  const [activeTab, setActiveTab] = useState('checklist') // 'checklist' | 'terminal'

  // Fetch or Refresh Guide Data
  const fetchGuide = async (lang = language, overridePreset = null) => {
    setLoading(true)
    setError(null)
    setIsOfflineView(false)

    const fn = overridePreset ? overridePreset.flightNumber : flightNumber
    const al = overridePreset ? overridePreset.airline : airline
    const orig = overridePreset ? overridePreset.origin : origin
    const dest = overridePreset ? overridePreset.destination : destination

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
        language: lang
      })

      if (res && res.data) {
        setGuideData(res.data)
        // Reset checklist completed steps if fresh flight loaded
        setCompletedStepIds(new Set())
      } else {
        throw new Error('Could not retrieve airport navigation details.')
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
  }, [language, hasOnlineBoardingPass, hasCheckedBags, needsAssistance])

  // Load Preset immediately
  const handleSelectPreset = (preset) => {
    setFlightNumber(preset.flightNumber)
    setAirline(preset.airline)
    setOrigin(preset.origin)
    setDestination(preset.destination)
    fetchGuide(language, preset)
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

  // Determine current active step (the first uncompleted step)
  const currentStep = useMemo(() => {
    if (!steps || steps.length === 0) return null
    const firstIncomplete = steps.find((s) => !completedStepIds.has(s.id))
    return firstIncomplete || steps[steps.length - 1]
  }, [steps, completedStepIds])

  // Mark current step complete and proceed to next
  const handleCompleteCurrentStep = () => {
    if (currentStep) {
      toggleStep(currentStep.id)
    }
  }

  // Save for Offline Access to localStorage
  const handleSaveOffline = () => {
    try {
      const offlinePayload = {
        guideData,
        completedStepIds: Array.from(completedStepIds),
        savedAt: new Date().toISOString(),
        flightNumber,
        origin,
        destination,
        language
      }
      localStorage.setItem(`aeromate_airport_nav_${flightNumber.toUpperCase()}`, JSON.stringify(offlinePayload))
      setSavedTimestamp(new Date().toLocaleTimeString())
      alert(language === 'hi'
        ? 'सफलतापूर्वक ऑफ़लाइन सेव किया गया! आप इसे बिना इंटरनेट के कभी भी देख सकते हैं।'
        : 'Saved successfully for offline access! Accessible in your local storage without network.')
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
  const isDomestic = useMemo(() => {
    if (guideData?.flight?.isDomestic !== undefined) return guideData.flight.isDomestic
    const indianAirports = ['BOM', 'DEL', 'BLR', 'MAA', 'HYD', 'CCU', 'GOI', 'COK', 'AMD', 'PNQ', 'SXR']
    return indianAirports.includes((origin || '').toUpperCase().trim()) && indianAirports.includes((destination || '').toUpperCase().trim())
  }, [guideData, origin, destination])

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24 pt-24 font-sans text-[#0D0D0D]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8">

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
                {isHi ? 'एयरपोर्ट गाइड' : 'Airport Guide'}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D0D0D] tracking-tight">
              {isHi ? 'एयरपोर्ट गाइड' : 'Airport Guide'}
            </h1>
            <p className="text-sm text-[#52524E] mt-1 max-w-xl">
              {isHi
                ? 'टर्मिनल से बोर्डिंग गेट तक आसान चरण-दर-चरण मार्गदर्शन।'
                : 'Step-by-step guidance from terminal arrival to your boarding gate.'}
            </p>
          </div>

          {/* Quick Actions: Language & Offline Save */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Language Switcher */}
            <div className="flex items-center p-0.5 rounded-full bg-white border border-[#E5E5E0] shadow-subtle">
              <button
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
              onClick={handleSaveOffline}
              title="Save itinerary & map for offline access"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAFAF7] transition-all shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="hidden sm:inline">{isHi ? 'ऑफ़लाइन सेव' : 'Save Offline'}</span>
            </button>

            {/* Load Offline */}
            <button
              onClick={handleLoadOffline}
              title="Load saved offline version"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E5E0] text-xs font-medium text-[#6B6B6B] hover:text-[#0D0D0D] transition-all shadow-subtle"
            >
              <WifiOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Offline Notice Banner if in Offline Mode */}
        {isOfflineView && (
          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-[#52524E] shrink-0" />
              <div>
                <span className="font-semibold">{isHi ? 'ऑफ़लाइन मोड सक्रिय:' : 'Offline Mode Active:'}</span>{' '}
                {isHi
                  ? `स्थानीय रूप से सहेजा गया डेटा (${savedTimestamp || 'सहेजा गया'}) देखा जा रहा है। लाइव गेट अपडेट के लिए FIDS स्क्रीन देखें।`
                  : `Viewing locally saved itinerary and terminal instructions (Saved at: ${savedTimestamp || 'Earlier'}). Please verify gate on physical airport FIDS monitors.`}
              </div>
            </div>
            <button
              onClick={() => fetchGuide(language)}
              className="px-3 py-1 rounded-full bg-white border border-[#E5E5E0] text-[#1A1A1A] font-semibold text-xs hover:bg-[#FAFAF7] transition-colors shrink-0"
            >
              {isHi ? 'पुनः प्रयास करें' : 'Reconnect'}
            </button>
          </div>
        )}

        {/* Section 1: Personalized Flight Setup Form & Presets */}
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-lg text-[#0D0D0D] flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#246BFD]" />
                {isHi ? '1. व्यक्तिगत उड़ान सेटअप' : '1. Personalized Flight Setup'}
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {isHi
                  ? 'अपनी उड़ान दर्ज करें या त्वरित परीक्षण के लिए तैयार की गई लोकप्रिय उड़ानों में से चुनें'
                  : 'Enter flight details or pick a verified route to retrieve terminal, gate, and domestic/international checklists.'}
              </p>
            </div>

            {/* Preset Selector Dropdown / Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <span className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wider shrink-0 mr-1">
                {isHi ? 'त्वरित उदाहरण:' : 'Presets:'}
              </span>
              {PRESET_FLIGHTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
                    flightNumber.toUpperCase() === p.flightNumber
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#52524E] border-[#E5E5E0] hover:bg-[#FAFAF7] hover:text-[#0D0D0D]'
                  }`}
                >
                  {p.flightNumber} ({p.origin}→{p.destination})
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2"
          >
            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'उड़ान संख्या (Flight No.)' : 'Flight Number'}
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. AI645, BA142"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-semibold focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'एयरलाइन (Airline)' : 'Airline'}
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="e.g. Air India, British Airways"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'प्रस्थान एयरपोर्ट (From)' : 'Origin Airport (IATA)'}
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="BOM"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52524E] mb-1">
                {isHi ? 'गंतव्य एयरपोर्ट (To)' : 'Destination Airport (IATA)'}
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="DEL"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-sm font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
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
                    <span>{isHi ? 'मार्गदर्शन लोड करें' : 'Update Guide'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Smart Assistant Preferences Toggles */}
          <div className="pt-3 border-t border-[#E5E5E0] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-[#52524E] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#8C8C85]" />
                {isHi ? 'यात्रा समायोजन:' : 'Tailor Your Workflow:'}
              </span>

              {/* Online Check-in Toggle */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasOnlineBoardingPass}
                  onChange={(e) => setHasOnlineBoardingPass(e.target.checked)}
                  className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                />
                <span className="text-[#333330]">
                  {isHi ? 'ऑनलाइन चेक-इन पूरा हो चुका है' : 'Online Check-in Done'}
                </span>
              </label>

              {/* Checked Baggage Toggle */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasCheckedBags}
                  onChange={(e) => setHasCheckedBags(e.target.checked)}
                  className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                />
                <span className="text-[#333330]">
                  {isHi ? 'चेक-इन लगेज जमा करना है' : 'Dropping Checked Bags'}
                </span>
              </label>

              {/* Special Mobility Assistance */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={needsAssistance}
                  onChange={(e) => setNeedsAssistance(e.target.checked)}
                  className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0 w-4 h-4"
                />
                <span className="text-[#333330]">
                  {isHi ? 'विशेष सहायता / व्हीलचेयर (PRM)' : 'Mobility / PRM Assistance'}
                </span>
              </label>
            </div>

            {/* Estimated Total Transit Time Badge */}
            {guideData?.metrics && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A] bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#E5E5E0]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {isHi ? 'अनुमानित कुल एयरपोर्ट समय:' : 'Estimated Transit:'}{' '}
                  <strong className="text-blue-700">~{guideData.metrics.estimatedTimeMins} mins</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchGuide(language)}
              className="px-3 py-1 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-900 hover:bg-red-100 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && !guideData && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E0] space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-[#0D0D0D]">Loading airport navigation guide...</p>
          </div>
        )}

        {/* Live Flight & Terminal Status Bar */}
        {guideData?.flight && (
          <div className="bg-[#1A1A1A] text-white rounded-2xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Route & Classification */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  ✈
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-lg text-white">
                      {guideData.flight.flightNumber}
                    </span>
                    <span className="text-white/60 text-xs">• {guideData.flight.airline}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isDomestic ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}>
                      {isDomestic ? (isHi ? 'घरेलू उड़ान (Domestic)' : 'Domestic Flight') : (isHi ? 'अंतरराष्ट्रीय उड़ान (International)' : 'International Flight')}
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

              {/* Operational Flight Telemetry Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {/* Terminal */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {isHi ? 'टर्मिनल' : 'Terminal'}
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {guideData.flight.terminal || 'TBA'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {isHi ? 'सत्यापित' : 'Confirmed'}
                  </div>
                </div>

                {/* Check-in Counter */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {isHi ? 'चेक-इन काउंटर' : 'Check-in Desks'}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate" title={guideData.flight.checkinCounter}>
                    {guideData.flight.checkinCounter || (isHi ? 'FIDS पर देखें' : 'Check FIDS')}
                  </div>
                  <div className="text-[10px] text-white/60 font-medium">
                    {guideData.flight.counterStatus === 'assigned' ? (isHi ? 'सक्रिय' : 'Assigned') : (isHi ? 'प्रतीक्षारत' : 'Standby')}
                  </div>
                </div>

                {/* Gate */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {isHi ? 'बोर्डिंग गेट' : 'Boarding Gate'}
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {guideData.flight.gate ? `Gate ${guideData.flight.gate}` : (isHi ? 'FIDS पर देखें' : 'Check FIDS')}
                  </div>
                  <div className="text-[10px] text-blue-400 font-medium">
                    {guideData.flight.gateStatus === 'confirmed' ? (isHi ? 'पुष्टीकृत' : 'Confirmed') : (isHi ? 'अनुमानित' : 'Estimated')}
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    {isHi ? 'उड़ान स्थिति' : 'Flight Status'}
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {guideData.flight.status || 'On Time'}
                  </div>
                  <div className="text-[10px] text-white/50">
                    Dep: {guideData.flight.scheduledDeparture || 'Scheduled'}
                  </div>
                </div>
              </div>
            </div>

            {/* Source & Timestamp footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-white/60 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isHi ? 'डेटा स्रोत:' : 'Source:'} {guideData.flight.dataSource || 'Airport FIDS & Airline Telemetry'}
                </span>
                <span className="mx-1">•</span>
                <span>
                  {isHi ? 'सत्यापित समय:' : 'Verified:'}{' '}
                  {new Date(guideData.flight.lastVerified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-white/40 italic">
                {isHi ? 'गेट परिवर्तन के लिए एयरपोर्ट FIDS स्क्रीन्स देखें' : 'Always verify unconfirmed gates on terminal FIDS monitors'}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Prominent Smart Next-Step Assistant Card */}
        {currentStep && (
          <div className="bg-white rounded-2xl border-2 border-[#1A1A1A] p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    {isHi ? 'अगला आवश्यक कदम' : 'Current Next Action'}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">
                    {isHi
                      ? `चरण ${currentStep.id} / ${totalSteps}`
                      : `Step ${currentStep.id} of ${totalSteps}`}
                  </span>
                  <span className="text-xs text-[#8C8C85]">• ~{currentStep.estimatedTimeMins} mins</span>
                </div>

                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0D0D0D]">
                  {currentStep.title}
                </h3>
                <p className="text-sm font-semibold text-[#52524E]">
                  {currentStep.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed pt-1">
                  {currentStep.action}
                </p>

                {/* Landmark clues & documents */}
                <div className="flex flex-wrap gap-4 pt-2 text-xs">
                  {currentStep.landmarks && (
                    <div className="flex items-center gap-1.5 text-[#52524E]">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        <strong>{isHi ? 'पहचान चिह्न:' : 'Look for:'}</strong> {currentStep.landmarks}
                      </span>
                    </div>
                  )}

                  {currentStep.documentsRequired && currentStep.documentsRequired.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[#52524E]">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{isHi ? 'दस्तावेज:' : 'Keep ready:'}</strong>{' '}
                        {currentStep.documentsRequired.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Mark Complete */}
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  onClick={handleCompleteCurrentStep}
                  className="px-6 py-3.5 rounded-xl bg-[#1A1A1A] text-white font-semibold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xs group"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>
                    {isHi ? 'यह चरण पूरा हुआ — आगे बढ़ें' : 'Mark Complete & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/70" />
                </button>

                <div className="text-[11px] text-center text-[#8C8C85]">
                  {progressPercent}% {isHi ? 'प्रक्रिया संपन्न' : 'completed'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs: Checklist vs Interactive Map */}
        {guideData && (
          <>
            <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-2">
              <button
                onClick={() => setActiveTab('checklist')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'checklist'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isHi ? 'एयरपोर्ट चेकलिस्ट' : 'Airport Checklist'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {completedCount}/{totalSteps}
                </span>
              </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'terminal'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isHi ? 'टर्मिनल एवं इनडोर नक्शा' : 'Terminal & Indoor Navigation'}</span>
          </button>
        </div>

        {/* Tab 1: Step-by-Step Interactive Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#52524E] mb-2">
                <span>
                  {isHi ? 'प्रक्रिया पूर्णता प्रगति:' : 'Passenger Wayfinding Progress:'}{' '}
                  <strong className="text-[#0D0D0D]">{completedCount} of {totalSteps} {isHi ? 'चरण' : 'steps completed'}</strong>
                </span>
                <span className="text-blue-600 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#E5E5E0] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* International Regulatory Disclaimer */}
              {!isDomestic && (
                <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 text-xs text-purple-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>{isHi ? 'अंतरराष्ट्रीय यात्रा सूचना:' : 'Notice:'}</strong>{' '}
                    {isHi
                      ? 'कृपया प्रस्थान से पहले पासपोर्ट वैधता (कम से कम 6 महीने) और वीजा नियमों की पुष्टि करें।'
                      : 'Please verify passport validity (6+ months) and required visas before departure.'}
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Items Accordion List */}
            <div className="space-y-3">
              {steps.map((step) => {
                const isCompleted = completedStepIds.has(step.id)
                const isCurrent = currentStep?.id === step.id

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isCurrent
                        ? 'border-[#1A1A1A] bg-white shadow-sm ring-1 ring-[#1A1A1A]'
                        : isCompleted
                        ? 'border-[#E5E5E0] bg-[#FAF9F5]'
                        : 'border-[#E5E5E0] bg-white'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleStep(step.id)}
                        className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                          isCompleted
                            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                            : 'border-[#D5D5D0] bg-white hover:border-[#1A1A1A]'
                        }`}
                        aria-label={`Toggle step ${step.id}`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#8C8C85]">
                              #{step.id}
                            </span>
                            <h4 className={`font-display font-bold text-base ${
                              isCompleted ? 'line-through text-[#8C8C85]' : 'text-[#0D0D0D]'
                            }`}>
                              {step.title}
                            </h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                                {isHi ? 'वर्तमान' : 'Current'}
                              </span>
                            )}
                            {step.isOptional && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E5E5E0] text-[#52524E]">
                                {isHi ? 'वैकल्पिक' : 'Optional'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>~{step.estimatedTimeMins} mins</span>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-[#52524E]">
                          {step.subtitle}
                        </p>

                        <p className="text-xs sm:text-sm text-[#52524E] leading-relaxed pt-1">
                          {step.action}
                        </p>

                        {/* Landmarks & Documents */}
                        <div className="pt-2 flex flex-wrap gap-4 text-xs text-[#6B6B6B]">
                          {step.landmarks && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>
                                <strong>{isHi ? 'पहचान:' : 'Landmark:'}</strong> {step.landmarks}
                              </span>
                            </div>
                          )}

                          {step.documentsRequired && step.documentsRequired.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                <strong>{isHi ? 'दस्तावेज:' : 'Required:'}</strong>{' '}
                                {step.documentsRequired.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Terminal and Indoor Navigation Map */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <TerminalMapViewer
              terminalDetails={guideData?.terminalDetails}
              flight={guideData?.flight}
              currentStep={currentStep}
              language={language}
            />
          </div>
        )}
          </>
        )}



      </div>
    </div>
  )
}
