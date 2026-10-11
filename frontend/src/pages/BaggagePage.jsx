import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Luggage,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  PhoneCall,
  HelpCircle,
  ExternalLink,
  Plane,
  RefreshCw,
  Search,
  Upload,
  ArrowRight,
  MapPin,
  Check,
  AlertCircle,
  Info,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react'
import {
  getBaggageRecords,
  getBaggageRecord,
  registerBaggage,
  updateBaggageStatus,
  simulateBaggageStep,
  submitBaggageRecoveryReport,
  updateBaggageRecoveryStatus,
  deleteBaggageRecord,
  getBaggageGuidance,
  getBookings
} from '../services/api'

// 11 Baggage Journey Stages in strict order
const BAGGAGE_JOURNEY_STAGES = [
  { key: 'Registered', label: 'Registered', icon: FileText, desc: 'Bag details recorded in system' },
  { key: 'Checked In', label: 'Checked In', icon: Luggage, desc: 'Accepted at check-in & tag issued' },
  { key: 'Loaded onto Aircraft', label: 'Loaded onto Aircraft', icon: Plane, desc: 'Placed in cargo hold' },
  { key: 'In Transit', label: 'In Transit', icon: ArrowRight, desc: 'En route aboard active flight' },
  { key: 'Arrived at Destination', label: 'Arrived at Destination', icon: MapPin, desc: 'Aircraft ramp offloading' },
  { key: 'Ready for Collection', label: 'Ready for Collection', icon: CheckCircle2, desc: 'Delivered to baggage carousel' },
  { key: 'Delivered to Passenger', label: 'Delivered to Passenger', icon: ShieldCheck, desc: 'Reclaim completed by traveler' }
]

const IRREGULARITY_STATUSES = ['Delayed', 'Misrouted', 'Reported Missing', 'Located']

// Official airline baggage recovery links for verified assistance
const AIRLINE_BAGGAGE_LINKS = {
  AI: { name: 'Air India', url: 'https://www.airindia.com/in/en/travel-information/baggage-guidelines/delayed-damaged-baggage.html' },
  BA: { name: 'British Airways', url: 'https://www.britishairways.com/en-gb/information/baggage-essentials/lost-and-damaged-baggage' },
  EK: { name: 'Emirates', url: 'https://www.emirates.com/english/before-you-fly/baggage/delayed-damaged-baggage/' },
  DL: { name: 'Delta Air Lines', url: 'https://www.delta.com/us/en/baggage/delayed-lost-damaged-baggage' },
  UA: { name: 'United Airlines', url: 'https://www.united.com/ual/en/us/fly/travel/baggage/handling.html' },
  AA: { name: 'American Airlines', url: 'https://www.aa.com/i18n/travel-info/baggage/delayed-or-damaged-baggage.jsp' },
  LH: { name: 'Lufthansa', url: 'https://www.lufthansa.com/de/en/baggage-irregularities' },
  QR: { name: 'Qatar Airways', url: 'https://www.qatarairways.com/en/baggage/mishandled.html' },
  SQ: { name: 'Singapore Airlines', url: 'https://www.singaporeair.com/en_UK/sg/flying-with-us/baggage/delayed-damaged-baggage/' }
}

export default function BaggagePage({ user, token }) {
  const [activeTab, setActiveTab] = useState('tracked') // 'tracked' | 'register' | 'guidance'
  const [bags, setBags] = useState([])
  const [selectedBag, setSelectedBag] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // User confirmed bookings for verification helper
  const [userBookings, setUserBookings] = useState([])

  // Registration Form State
  const [regForm, setRegForm] = useState({
    passenger_name: user?.name || '',
    booking_reference: '',
    flight_number: '',
    origin: '',
    destination: '',
    tag_number: '',
    description: '',
    photo_url: ''
  })
  const [photoPreview, setPhotoPreview] = useState('')

  // Recovery Report Modal / Panel State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryForm, setRecoveryForm] = useState({
    issue_type: 'delayed', // 'delayed' | 'misrouted' | 'missing'
    pir_reference: '',
    recovery_notes: '',
    last_seen_location: ''
  })

  // Manual Status Update Dropdown State
  const [manualStatus, setManualStatus] = useState('')
  const [manualLocation, setManualLocation] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  // AI Baggage Guidance State (Preserved from original feature)
  const [guidanceFlight, setGuidanceFlight] = useState('AI161')
  const [guidanceAirline, setGuidanceAirline] = useState('Air India')
  const [guidanceStatus, setGuidanceStatus] = useState('delayed')
  const [guidanceLanguage, setGuidanceLanguage] = useState('en')
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidance, setGuidance] = useState(null)

  // Fetch Bags and Bookings
  const loadBaggageData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await getBaggageRecords(token)
      if (res?.success && Array.isArray(res.data)) {
        setBags(res.data)
        if (res.data.length > 0 && !selectedBag) {
          // Auto-load details of first bag
          loadBagDetails(res.data[0].id)
        }
      }
    } catch (err) {
      console.warn('Error loading baggage records:', err.message)
      setErrorMsg('Could not load tracked bags. Using offline demo storage.')
    } finally {
      setLoading(false)
    }

    if (token) {
      try {
        const bRes = await getBookings(token)
        if (bRes?.success && Array.isArray(bRes.data)) {
          setUserBookings(bRes.data)
        }
      } catch {
        // ignore
      }
    }
  }

  const loadBagDetails = async (id) => {
    setActionLoading(true)
    try {
      const res = await getBaggageRecord(id, token)
      if (res?.success && res.data) {
        setSelectedBag(res.data)
      }
    } catch (err) {
      console.warn('Error fetching bag details:', err)
      const found = bags.find(b => b.id === id)
      if (found) setSelectedBag(found)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    loadBaggageData()
  }, [token])

  // Handle Image Upload (Converts to Data URL for instant preview & storage)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      alert('Photo must be less than 4MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      setPhotoPreview(dataUrl)
      setRegForm(prev => ({ ...prev, photo_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  // Handle Form Registration
  const handleRegisterBag = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setActionLoading(true)

    try {
      const res = await registerBaggage(regForm, token)
      if (res?.success) {
        setSuccessMsg(`Bag #${regForm.tag_number.toUpperCase()} successfully registered for flight ${regForm.flight_number.toUpperCase()}.`)
        setRegForm({
          passenger_name: user?.name || '',
          booking_reference: '',
          flight_number: '',
          origin: '',
          destination: '',
          tag_number: '',
          description: '',
          photo_url: ''
        })
        setPhotoPreview('')
        setActiveTab('tracked')
        await loadBaggageData()
        if (res.data?.id) {
          await loadBagDetails(res.data.id)
        }
      } else {
        setErrorMsg(res?.error || 'Failed to register bag.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error registering baggage.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Simulate Next Step (Demo Mode)
  const handleSimulateNextStep = async (bagId) => {
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await simulateBaggageStep(bagId, token)
      if (res?.success && res.data) {
        setSelectedBag(res.data)
        setBags(prev => prev.map(b => (b.id === bagId ? res.data : b)))
        setSuccessMsg(`Simulated status updated to '${res.data.status}' at ${res.data.last_known_location}.`)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to advance simulation.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Manual Status Change
  const handleManualStatusUpdate = async (e) => {
    e.preventDefault()
    if (!selectedBag || !manualStatus) return
    setActionLoading(true)
    setErrorMsg('')

    try {
      const res = await updateBaggageStatus(selectedBag.id, {
        status: manualStatus,
        location: manualLocation || selectedBag.last_known_location,
        notes: manualNotes,
        update_source: 'user_manual',
        is_simulated: true
      }, token)

      if (res?.success && res.data) {
        setSelectedBag(res.data)
        setBags(prev => prev.map(b => (b.id === selectedBag.id ? res.data : b)))
        setSuccessMsg(`Baggage status updated to '${manualStatus}'.`)
        setManualStatus('')
        setManualLocation('')
        setManualNotes('')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Recovery Incident Report
  const handleSubmitRecoveryReport = async (e) => {
    e.preventDefault()
    if (!selectedBag) return
    setActionLoading(true)
    setErrorMsg('')

    try {
      const res = await submitBaggageRecoveryReport(selectedBag.id, recoveryForm, token)
      if (res?.success && res.data) {
        setSelectedBag(res.data)
        setBags(prev => prev.map(b => (b.id === selectedBag.id ? res.data : b)))
        setShowRecoveryModal(false)
        setSuccessMsg(`Recovery claim report recorded. Assistance protocol initiated.`)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to file recovery report.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle PIR Status Progress
  const handleUpdateRecoveryStatus = async (statusKey) => {
    if (!selectedBag) return
    setActionLoading(true)
    try {
      const res = await updateBaggageRecoveryStatus(selectedBag.id, {
        recovery_status: statusKey,
        pir_reference: selectedBag.pir_reference,
        notes: `Progressed to ${statusKey}`
      }, token)
      if (res?.success && res.data) {
        setSelectedBag(res.data)
        setBags(prev => prev.map(b => (b.id === selectedBag.id ? res.data : b)))
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update recovery progress.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Delete Bag
  const handleDeleteBag = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bag tracking record?')) return
    setActionLoading(true)
    try {
      await deleteBaggageRecord(id, token)
      const filtered = bags.filter(b => b.id !== id)
      setBags(filtered)
      if (selectedBag?.id === id) {
        setSelectedBag(filtered[0] || null)
      }
      setSuccessMsg('Baggage record removed.')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete baggage record.')
    } finally {
      setActionLoading(false)
    }
  }

  // AI Protocol Guidance Query (Original feature kept intact)
  const handleFetchGuidance = async (e) => {
    e?.preventDefault()
    setGuidanceLoading(true)
    try {
      const res = await getBaggageGuidance({
        flightNumber: guidanceFlight,
        airline: guidanceAirline,
        status: guidanceStatus,
        language: guidanceLanguage
      })
      setGuidance(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setGuidanceLoading(false)
    }
  }

  // Helper for Airline official link
  const getAirlineLink = (flightNum) => {
    if (!flightNum) return null
    const prefix = flightNum.substring(0, 2).toUpperCase()
    return AIRLINE_BAGGAGE_LINKS[prefix] || null
  }

  const airlineOfficialLink = selectedBag ? getAirlineLink(selectedBag.flight_number) : null

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-24 pb-20 font-sans text-[#0D0D0D]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E5E0] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-xs">
                <Luggage className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0D0D0D] tracking-tight">
                Baggage Tracking & Recovery
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                LIVE & DEMO MODE
              </span>
            </div>
            <p className="text-sm text-[#52524E] mt-1 max-w-2xl">
              Track checked baggage handling across your flights, verify journey milestones, inspect handling locations, and initiate automated missing luggage recovery assistance.
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E5E5E0] shadow-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('tracked')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'tracked'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-[#FAFAF7]'
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>Tracked Bags ({bags.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-[#FAFAF7]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Bag</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guidance')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'guidance'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-[#FAFAF7]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Carousel & Protocols</span>
            </button>
          </div>
        </div>

        {/* Global Notifications / Alerts Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button type="button" onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Demo Mode Disclaimer Notice (Requirement 5) */}
        <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] text-xs text-[#52524E] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#246BFD] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[#0D0D0D]">
              AeroMate Baggage Transparency & Demo Simulation Engine
            </p>
            <p>
              Direct live airline telemetry requires certified ground handling integrations. Unless verified by carrier feed, milestones marked with <span className="font-semibold text-amber-700 font-mono text-[11px]">[DEMO MODE]</span> illustrate standard handling procedures. You may manually report delays, record baggage tags, or log Property Irregularity Reports (PIR) below.
            </p>
          </div>
        </div>

        {/* TAB 1: TRACKED BAGS & VISUAL TIMELINE */}
        {activeTab === 'tracked' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 border border-[#E5E5E0] text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-[#1A1A1A] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#0D0D0D]">Loading baggage registry...</p>
              </div>
            ) : bags.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-[#E5E5E0] text-center space-y-4 max-w-lg mx-auto shadow-subtle">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Luggage className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-[#0D0D0D]">No Checked Bags Registered</h3>
                  <p className="text-xs text-[#52524E]">
                    Register your baggage tag to track its journey status from check-in to collection carousel, or report delayed luggage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="btn-primary py-2.5 px-5 text-xs rounded-full inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register First Bag</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 4 Cols: Bags List */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                      Your Registered Bags ({bags.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-xs font-semibold text-[#246BFD] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {bags.map((bag) => {
                      const isSelected = selectedBag?.id === bag.id
                      const isIrregular = IRREGULARITY_STATUSES.includes(bag.status)

                      return (
                        <div
                          key={bag.id}
                          onClick={() => loadBagDetails(bag.id)}
                          className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer border text-left flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-white border-[#1A1A1A] ring-1 ring-[#1A1A1A] shadow-md'
                              : 'bg-white hover:bg-[#FAFAF7] border-[#E5E5E0] shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-xs text-[#0D0D0D] bg-[#F5F5F0] px-2 py-0.5 rounded-md border border-[#E5E5E0]">
                                {bag.tag_number}
                              </span>
                              <h4 className="font-semibold text-sm text-[#0D0D0D] mt-1">
                                Flight {bag.flight_number}
                              </h4>
                              <p className="text-[11px] text-[#52524E]">
                                {bag.origin} → {bag.destination} • {bag.passenger_name}
                              </p>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIrregular
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : bag.status === 'Ready for Collection' || bag.status === 'Delivered to Passenger'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {bag.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-2 border-t border-[#F0F0EB]">
                            <span className="truncate max-w-[200px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#6B6B6B]" />
                              {bag.last_known_location || 'Unknown Location'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A3A39E]" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right 8 Cols: Detailed Visual Timeline & Controls */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedBag ? (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E0] shadow-card space-y-6">
                      
                      {/* Bag Header Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base bg-[#1A1A1A] text-white px-2.5 py-1 rounded-lg">
                              {selectedBag.tag_number}
                            </span>
                            {selectedBag.is_verified_booking ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Booking Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Unverified PNR
                              </span>
                            )}
                            {selectedBag.is_simulated && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                                DEMO MODE
                              </span>
                            )}
                          </div>

                          <h2 className="text-xl font-display font-bold text-[#0D0D0D]">
                            Flight {selectedBag.flight_number} ({selectedBag.origin} → {selectedBag.destination})
                          </h2>
                          <p className="text-xs text-[#52524E]">
                            Passenger: <strong>{selectedBag.passenger_name}</strong>
                            {selectedBag.booking_reference && ` • PNR: ${selectedBag.booking_reference}`}
                            {selectedBag.description && ` • ${selectedBag.description}`}
                          </p>
                        </div>

                        {/* Top Actions: Simulate Next Step & Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateNextStep(selectedBag.id)}
                            disabled={actionLoading}
                            className="btn-secondary py-2 px-3.5 text-xs rounded-xl flex items-center gap-1.5 font-semibold"
                            title="Simulate handling progression"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                            <span>Simulate Next Step</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBag(selectedBag.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Delete bag record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Current Status Highlights Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0]">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                            Current Status
                          </span>
                          <p className="text-sm font-bold text-[#0D0D0D] flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              IRREGULARITY_STATUSES.includes(selectedBag.status) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                            }`} />
                            {selectedBag.status}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                            Last Known Location
                          </span>
                          <p className="text-xs font-semibold text-[#0D0D0D] truncate">
                            {selectedBag.last_known_location || 'Pending carrier update'}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                            Last Updated
                          </span>
                          <p className="text-xs text-[#52524E]">
                            {new Date(selectedBag.last_updated_at || selectedBag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(selectedBag.last_updated_at || selectedBag.created_at).toLocaleDateString()})
                          </p>
                        </div>
                      </div>

                      {/* Optional Photo Attachment */}
                      {selectedBag.photo_url && (
                        <div className="p-4 rounded-2xl border border-[#E5E5E0] bg-white flex items-center gap-4">
                          <img
                            src={selectedBag.photo_url}
                            alt="Registered baggage"
                            className="w-16 h-16 rounded-xl object-cover border border-[#E5E5E0]"
                          />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#0D0D0D]">Baggage Photo on File</p>
                            <p className="text-[11px] text-[#52524E]">
                              Visual proof helps ground handlers identify bags on the ramp or carousel.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Visual Journey Timeline (Requirement 3) */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-sm text-[#0D0D0D]">
                            Baggage Handling Journey Timeline
                          </h3>
                          <span className="text-[11px] text-[#6B6B6B]">
                            {BAGGAGE_JOURNEY_STAGES.findIndex(s => s.key === selectedBag.status) >= 0
                              ? `Stage ${BAGGAGE_JOURNEY_STAGES.findIndex(s => s.key === selectedBag.status) + 1} of 7`
                              : 'Irregularity / Custom Handling'}
                          </span>
                        </div>

                        {/* Stage Stepper Horizontal / Responsive */}
                        <div className="relative pl-6 sm:pl-0 sm:pt-4">
                          <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-7 gap-2">
                            {BAGGAGE_JOURNEY_STAGES.map((stage, idx) => {
                              const curIndex = BAGGAGE_JOURNEY_STAGES.findIndex(s => s.key === selectedBag.status)
                              const isCompleted = curIndex > idx
                              const isCurrent = selectedBag.status === stage.key
                              const isUpcoming = curIndex !== -1 && curIndex < idx

                              return (
                                <div key={stage.key} className="relative flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 sm:gap-2">
                                  {/* Connector line on desktop */}
                                  {idx < BAGGAGE_JOURNEY_STAGES.length - 1 && (
                                    <div className={`hidden sm:block absolute top-4 left-1/2 w-full h-[2px] z-0 ${
                                      isCompleted ? 'bg-[#1A1A1A]' : 'bg-[#E5E5E0]'
                                    }`} />
                                  )}

                                  {/* Badge Icon */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-transform ${
                                    isCurrent
                                      ? 'bg-[#1A1A1A] text-white ring-4 ring-black/10 scale-110 shadow-sm'
                                      : isCompleted
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#F0F0EB] text-[#8C8C85] border border-[#E5E5E0]'
                                  }`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                  </div>

                                  <div>
                                    <h5 className={`text-xs font-semibold leading-tight ${
                                      isCurrent ? 'text-[#0D0D0D] font-bold' : isCompleted ? 'text-emerald-800' : 'text-[#8C8C85]'
                                    }`}>
                                      {stage.label}
                                    </h5>
                                    <p className="text-[10px] text-[#6B6B6B] mt-0.5 hidden sm:block leading-tight">
                                      {stage.desc}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* If in Irregular Status (Delayed, Missing, etc.) */}
                        {IRREGULARITY_STATUSES.includes(selectedBag.status) && (
                          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-fadeIn">
                            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              <span>Baggage Irregularity Alert: {selectedBag.status}</span>
                            </div>
                            <p className="text-xs text-rose-700">
                              Your checked bag has been flagged as {selectedBag.status.toLowerCase()}. We advise filing an official Property Irregularity Report (PIR) with the airline immediately before leaving the baggage reclaim hall.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Chronological Handling History Feed */}
                      <div className="space-y-3 pt-4 border-t border-[#E5E5E0]">
                        <h4 className="font-display font-semibold text-xs text-[#0D0D0D] uppercase tracking-wider">
                          Timestamped Handling Log ({selectedBag.history?.length || 0} events)
                        </h4>

                        <div className="space-y-2">
                          {(selectedBag.history || []).map((h, i) => (
                            <div key={h.id || i} className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-xs flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#0D0D0D]">{h.status}</span>
                                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-[#E5E5E0] text-[#52524E] font-mono">
                                    {h.update_source || 'system'}
                                  </span>
                                  {h.is_simulated && (
                                    <span className="text-[9px] text-[#8C8C85] italic font-mono">[simulated]</span>
                                  )}
                                </div>
                                <p className="text-[#52524E]">{h.notes}</p>
                                {h.location && (
                                  <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#246BFD]" /> {h.location}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-[#8C8C85] shrink-0 font-mono">
                                {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Baggage Recovery Assistance Section (Requirement 7) */}
                      <div className="p-5 rounded-2xl bg-white border border-[#E5E5E0] shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0EB] pb-3">
                          <div>
                            <h4 className="font-display font-bold text-sm text-[#0D0D0D] flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                              Baggage Recovery & Claim Desk
                            </h4>
                            <p className="text-xs text-[#52524E]">
                              Guidance, PIR claim references, and recovery checklist for delayed or missing baggage.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowRecoveryModal(true)}
                            className="btn-primary py-2 px-3 text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>File Issue / Missing Report</span>
                          </button>
                        </div>

                        {/* Existing PIR Reference if filed */}
                        {selectedBag.pir_reference ? (
                          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-blue-900">
                                Property Irregularity Report (PIR) Reference: <strong className="font-mono">{selectedBag.pir_reference}</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-900">
                                {selectedBag.recovery_status || 'Report Submitted'}
                              </span>
                            </div>
                            {selectedBag.recovery_notes && (
                              <p className="text-blue-800 text-[11px]">{selectedBag.recovery_notes}</p>
                            )}

                            {/* Recovery Progress Actions */}
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                              <span className="text-[11px] font-semibold text-blue-900">Update Recovery Stage:</span>
                              {['Airline Contacted', 'Baggage Located', 'Case Resolved'].map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateRecoveryStatus(st)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-900 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#52524E] space-y-2">
                            <p className="font-medium text-[#0D0D0D]">Recommended Recovery Checklist:</p>
                            <ul className="space-y-1 list-disc list-inside text-[11px]">
                              <li>Do not leave the baggage hall without lodging an irregularity report.</li>
                              <li>Locate the operating carrier's Baggage Services Desk near the carousel.</li>
                              <li>Present your baggage tag sticker: <strong className="font-mono text-[#0D0D0D]">{selectedBag.tag_number}</strong>.</li>
                              <li>Obtain a 10-character PIR reference number (e.g., LHRBA12345).</li>
                              <li>Retain all receipts for emergency essentials (clothing, toiletries) for compensation.</li>
                            </ul>
                          </div>
                        )}

                        {/* Airline Official Link (Requirement 5) */}
                        {airlineOfficialLink && (
                          <div className="pt-2 flex items-center justify-between text-xs">
                            <span className="text-[#52524E]">
                              Need direct assistance with <strong>{airlineOfficialLink.name}</strong>?
                            </span>
                            <a
                              href={airlineOfficialLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#246BFD] hover:underline flex items-center gap-1"
                            >
                              <span>Official {airlineOfficialLink.name} Baggage Page</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Manual Status Override Form (Requirement 3 & 5) */}
                      <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-xs text-[#0D0D0D]">Manual Status Update</h4>
                          <p className="text-[11px] text-[#52524E]">
                            Authorized manual check-in or demo simulation override. Changes are timestamped in history.
                          </p>
                        </div>

                        <form onSubmit={handleManualStatusUpdate} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <select
                              value={manualStatus}
                              onChange={e => setManualStatus(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-xs"
                              required
                            >
                              <option value="">Select Status...</option>
                              {BAGGAGE_JOURNEY_STAGES.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                              {IRREGULARITY_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={manualLocation}
                              onChange={e => setManualLocation(e.target.value)}
                              placeholder="Location (e.g., Carousel 4)"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-xs"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={manualNotes}
                              onChange={e => setManualNotes(e.target.value)}
                              placeholder="Optional note"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-xs"
                            />
                          </div>

                          <div>
                            <button
                              type="submit"
                              disabled={actionLoading || !manualStatus}
                              className="w-full py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-semibold text-xs disabled:opacity-40 transition-colors"
                            >
                              Update Status
                            </button>
                          </div>
                        </form>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-12 border border-[#E5E5E0] text-center text-sm text-[#6B6B6B]">
                      Select a bag from the left list to view its complete timeline.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER BAG FORM (Requirement 2 & 4) */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleRegisterBag} className="bg-white border border-[#E5E5E0] rounded-3xl p-6 sm:p-8 shadow-card space-y-5 animate-scale-up text-left">
              <div className="space-y-1 border-b border-[#E5E5E0] pb-4">
                <h3 className="font-display font-bold text-lg text-[#0D0D0D] flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-amber-500" />
                  Register Checked Baggage
                </h3>
                <p className="text-xs text-[#52524E]">
                  Register your baggage tag issued at airport check-in to track handling checkpoints and receive delay alerts.
                </p>
              </div>

              {/* Quick autofill from verified bookings */}
              {userBookings.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] space-y-1.5 text-xs">
                  <span className="font-semibold text-[#0D0D0D]">Auto-fill from verified bookings:</span>
                  <div className="flex flex-wrap gap-2">
                    {userBookings.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setRegForm(prev => ({
                            ...prev,
                            booking_reference: b.provider_booking_reference || '',
                            flight_number: b.itinerary?.flightNumber || prev.flight_number,
                            origin: b.itinerary?.origin || prev.origin,
                            destination: b.itinerary?.destination || prev.destination
                          }))
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E0] text-xs hover:border-[#1A1A1A] transition-colors"
                      >
                        PNR: <strong>{b.provider_booking_reference}</strong> ({b.itinerary?.flightNumber || 'Flight'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Passenger Full Name *</label>
                  <input
                    type="text"
                    value={regForm.passenger_name}
                    onChange={e => setRegForm({ ...regForm, passenger_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="e.g. Adhyatmika Ghodvinde"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Booking Reference (PNR)</label>
                  <input
                    type="text"
                    value={regForm.booking_reference}
                    onChange={e => setRegForm({ ...regForm, booking_reference: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
                    placeholder="e.g. WX9K2L"
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Flight Number *</label>
                  <input
                    type="text"
                    value={regForm.flight_number}
                    onChange={e => setRegForm({ ...regForm, flight_number: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
                    placeholder="e.g. AI161"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Baggage Tag Number *</label>
                  <input
                    type="text"
                    value={regForm.tag_number}
                    onChange={e => setRegForm({ ...regForm, tag_number: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
                    placeholder="e.g. 0098124982"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Departure Airport (IATA) *</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={regForm.origin}
                    onChange={e => setRegForm({ ...regForm, origin: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
                    placeholder="e.g. LHR"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Arrival Airport (IATA) *</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={regForm.destination}
                    onChange={e => setRegForm({ ...regForm, destination: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
                    placeholder="e.g. JFK"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#52524E] block mb-1 font-semibold text-xs">Bag Description & Features</label>
                <input
                  type="text"
                  value={regForm.description}
                  onChange={e => setRegForm({ ...regForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs"
                  placeholder="e.g. Samsonite black hard-shell suitcase with red ribbon on handle"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div className="space-y-2">
                <label className="text-[#52524E] block font-semibold text-xs">Optional Bag Photo</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Bag preview"
                        className="w-20 h-20 rounded-xl object-cover border border-[#E5E5E0]"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(''); setRegForm(p => ({ ...p, photo_url: '' })) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}

                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-[#A3A39E] hover:border-[#1A1A1A] bg-[#FAFAF7] hover:bg-white text-xs font-semibold text-[#52524E] flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-[#6B6B6B]" />
                    <span>Upload Bag Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E5E0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('tracked')}
                  className="btn-secondary py-2.5 px-5 text-xs rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary py-2.5 px-6 text-xs rounded-full flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Luggage className="w-4 h-4 text-amber-300" />}
                  <span>Save & Start Tracking</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: CAROUSEL & BAGGAGE PROTOCOLS (Preserved & Enhanced) */}
        {activeTab === 'guidance' && (
          <div className="space-y-6">
            <form onSubmit={handleFetchGuidance} className="bg-white border border-[#E5E5E0] rounded-3xl p-6 shadow-card space-y-4 text-left">
              <h3 className="font-display font-bold text-sm text-[#0D0D0D] flex items-center gap-2">
                <Luggage className="w-4 h-4 text-amber-500" /> Airport Carousel & Reclaim Protocol Finder
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Flight Number</label>
                  <input
                    type="text"
                    value={guidanceFlight}
                    onChange={e => setGuidanceFlight(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Airline</label>
                  <input
                    type="text"
                    value={guidanceAirline}
                    onChange={e => setGuidanceAirline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Flight Status</label>
                  <select
                    value={guidanceStatus}
                    onChange={e => setGuidanceStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                  >
                    <option value="scheduled">Scheduled / On Time</option>
                    <option value="active">In Flight</option>
                    <option value="landed">Landed / At Gate</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Language</label>
                  <select
                    value={guidanceLanguage}
                    onChange={e => setGuidanceLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guidanceLoading}
                  className="btn-primary text-xs flex items-center gap-2 py-2 px-4 rounded-full"
                >
                  {guidanceLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Fetch Airport Baggage Protocol</span>
                </button>
              </div>
            </form>

            {guidance && (
              <div className="bg-white border border-[#E5E5E0] rounded-3xl p-6 shadow-card space-y-4 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
                  <h4 className="font-display font-bold text-base text-[#0D0D0D]">
                    Official Baggage Protocol for {guidanceFlight}
                  </h4>
                  <span className="text-xs text-[#52524E] capitalize">Status: {guidanceStatus}</span>
                </div>

                <div className="prose prose-sm max-w-none text-xs text-[#52524E] leading-relaxed whitespace-pre-line">
                  {typeof guidance === 'string' ? guidance : guidance.content || guidance.guidance || JSON.stringify(guidance, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: REPORT DELAYED / MISSING BAGGAGE (Requirement 7) */}
        {showRecoveryModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5E5E0] shadow-2xl p-6 space-y-5 animate-scale-up text-left">
              <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="font-display font-bold text-base text-[#0D0D0D]">
                    File Baggage Irregularity Report
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="p-1 rounded-lg text-[#8C8C85] hover:text-[#0D0D0D]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitRecoveryReport} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Incident Type *</label>
                  <select
                    value={recoveryForm.issue_type}
                    onChange={e => setRecoveryForm({ ...recoveryForm, issue_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                    required
                  >
                    <option value="delayed">Delayed (Flight landed, bag missing from carousel)</option>
                    <option value="missing">Reported Missing / Lost (Carrier has no record of bag location)</option>
                    <option value="misrouted">Misrouted (Sent on incorrect connecting flight or airport)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Airline PIR / Claim Reference Number</label>
                  <input
                    type="text"
                    value={recoveryForm.pir_reference}
                    onChange={e => setRecoveryForm({ ...recoveryForm, pir_reference: e.target.value.toUpperCase() })}
                    placeholder="e.g. LHRBA19823 (Provided by airport desk)"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] font-mono uppercase"
                  />
                  <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                    Obtain this from the airport Baggage Services Desk to track your claim with the airline.
                  </span>
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Last Seen Handling Location</label>
                  <input
                    type="text"
                    value={recoveryForm.last_seen_location}
                    onChange={e => setRecoveryForm({ ...recoveryForm, last_seen_location: e.target.value })}
                    placeholder="e.g. Terminal 2 - Carousel 5"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                  />
                </div>

                <div>
                  <label className="text-[#52524E] block mb-1 font-semibold">Incident Details & Emergency Needs</label>
                  <textarea
                    rows={3}
                    value={recoveryForm.recovery_notes}
                    onChange={e => setRecoveryForm({ ...recoveryForm, recovery_notes: e.target.value })}
                    placeholder="Describe baggage description, essential medication inside, or urgent delivery address..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E5E0]">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="btn-secondary py-2 px-4 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary py-2 px-5 rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Submit Report & Record Incident
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
