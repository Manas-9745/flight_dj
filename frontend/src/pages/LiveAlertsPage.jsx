import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ShieldAlert, AlertTriangle, Flame, Ban, CloudRain, PlaneTakeoff, Info,
  Search, RefreshCw, ExternalLink, Sparkles, Filter, CheckCircle2,
  HelpCircle, ArrowRight, Clock, MapPin, Globe, ChevronRight, Layers, Sliders
} from 'lucide-react'
import { getAlerts, getAlertsStatus, checkRouteImpact, getAlertAiSummary, getTrips } from '../services/api'
import CrisisMap from '../components/CrisisMap'

export default function LiveAlertsPage({ token }) {
  const location = useLocation()
  const navigate = useNavigate()

  // State
  const [alerts, setAlerts] = useState([])
  const [providerStatus, setProviderStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')

  // Selected Alert for Details / AI Breakdown Modal
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Setup / Sources Modal State
  const [showSetupModal, setShowSetupModal] = useState(false)

  // Route Impact Checker State
  const [savedTrips, setSavedTrips] = useState([])
  const [impactForm, setImpactForm] = useState({
    flightNumber: '',
    origin: '',
    destination: '',
    connectingAirports: ''
  })
  const [impactResult, setImpactResult] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)

  // Active View Tab: 'feed' | 'map' | 'simulator'
  const [activeTab, setActiveTab] = useState('feed')

  // Load Alerts & Provider Status
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [alertsRes, statusRes] = await Promise.all([
        getAlerts({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
          region: selectedRegion !== 'all' ? selectedRegion : undefined,
          search: searchTerm || undefined
        }),
        getAlertsStatus().catch(() => null)
      ])

      setAlerts(alertsRes.alerts || [])
      setProviderStatus(statusRes || alertsRes.providerStatus || null)
      setLastUpdated(alertsRes.lastUpdated || new Date().toISOString())

      // Auto-select if came from notification link
      if (location.state?.selectedAlertId) {
        const target = alertsRes.alerts?.find(a => a.id === location.state.selectedAlertId)
        if (target) handleOpenAiSummary(target)
      } else if (location.state?.checkTrip) {
        const tr = location.state.checkTrip
        handleSelectTrip(tr)
        setActiveTab('simulator')
      }
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedSeverity, selectedRegion])

  // Fetch Saved Trips for Quick Route Testing
  useEffect(() => {
    getTrips(token).then(res => {
      if (res?.trips && Array.isArray(res.trips)) {
        setSavedTrips(res.trips)
      }
    }).catch(() => {})
  }, [token])

  // Search filter triggered on submit or enter
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadData()
  }

  // Trigger AI event breakdown
  const handleOpenAiSummary = async (alert) => {
    setSelectedAlert(alert)
    setAiLoading(true)
    setAiSummary(null)
    try {
      const res = await getAlertAiSummary(alert.id)
      setAiSummary(res.aiSummary)
    } catch (err) {
      console.error('Failed to get AI summary:', err)
    } finally {
      setAiLoading(false)
    }
  }

  // Route Impact Check
  const handleCheckImpact = async (e) => {
    if (e) e.preventDefault()
    if (!impactForm.origin && !impactForm.destination && !impactForm.flightNumber) return

    setImpactLoading(true)
    setImpactResult(null)
    try {
      const conn = impactForm.connectingAirports
        ? impactForm.connectingAirports.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : []

      const res = await checkRouteImpact({
        flightNumber: impactForm.flightNumber,
        origin: impactForm.origin.toUpperCase(),
        destination: impactForm.destination.toUpperCase(),
        connectingAirports: conn
      })
      setImpactResult(res.impact)
    } catch (err) {
      console.error('Route impact check error:', err)
    } finally {
      setImpactLoading(false)
    }
  }

  const handleSelectTrip = (trip) => {
    const orig = typeof trip.origin === 'string' ? trip.origin : trip.origin?.iata || ''
    const dest = typeof trip.destination === 'string' ? trip.destination : trip.destination?.iata || ''
    setImpactForm({
      flightNumber: trip.flight_number || trip.flightNumber || '',
      origin: orig,
      destination: dest,
      connectingAirports: ''
    })
    checkRouteImpact({
      flightNumber: trip.flight_number || trip.flightNumber || '',
      origin: orig,
      destination: dest
    }).then(res => setImpactResult(res.impact)).catch(() => {})
  }

  // Severity pill style helper
  const renderSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">CRITICAL</span>
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">WARNING</span>
      case 'ADVISORY':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">ADVISORY</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">INFO</span>
    }
  }

  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'conflict': return <Flame className="w-4 h-4 text-rose-600" />
      case 'airspace': return <Ban className="w-4 h-4 text-amber-600" />
      case 'weather': return <CloudRain className="w-4 h-4 text-blue-600" />
      case 'strike': return <AlertTriangle className="w-4 h-4 text-purple-600" />
      case 'accident': return <PlaneTakeoff className="w-4 h-4 text-gray-600" />
      default: return <ShieldAlert className="w-4 h-4 text-slate-600" />
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">

      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E5E5E0] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5E0] text-[#52524E] text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Aviation Safety & Airspace Advisories
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-[#0D0D0D] tracking-tight">
            Airspace & Safety Advisories
          </h1>
          <p className="text-sm text-[#52524E] mt-1 max-w-xl">
            Real-time monitoring of airspace restrictions, NOTAMs, weather advisories, and route impacts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-secondary text-xs py-2 px-4 rounded-full"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Data Freshness & Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4 text-[#0D0D0D]" />
          </div>
          <div>
            <div className="text-lg font-semibold font-display text-[#0D0D0D]">{criticalCount}</div>
            <div className="text-xs text-[#6B6B6B]">Prohibitions</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4 text-[#0D0D0D]" />
          </div>
          <div>
            <div className="text-lg font-semibold font-display text-[#0D0D0D]">{warningCount}</div>
            <div className="text-xs text-[#6B6B6B]">Advisories</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-center font-bold">
            <Globe className="w-4 h-4 text-[#0D0D0D]" />
          </div>
          <div>
            <div className="text-lg font-semibold font-display text-[#0D0D0D]">{alerts.length}</div>
            <div className="text-xs text-[#6B6B6B]">Active Bulletins</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#0D0D0D] truncate">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
            </div>
            <div className="text-xs text-[#6B6B6B]">Cache Active</div>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-3">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'feed'
              ? 'bg-[#1A1A1A] text-white shadow-subtle'
              : 'bg-white text-[#52524E] border border-[#E5E5E0] hover:bg-[#FAFAF7]'
          }`}
        >
          Advisories Feed ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-[#1A1A1A] text-white shadow-subtle'
              : 'bg-white text-[#52524E] border border-[#E5E5E0] hover:bg-[#FAFAF7]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Airspace Map
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'bg-[#1A1A1A] text-white shadow-subtle'
              : 'bg-white text-[#52524E] border border-[#E5E5E0] hover:bg-[#FAFAF7]'
          }`}
        >
          <PlaneTakeoff className="w-3.5 h-3.5" />
          Route Impact Checker
        </button>
      </div>

      {/* ================= TAB 1: ALERTS FEED ================= */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="surface-card p-5 border border-slate-200 shadow-subtle space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by country, FIR code, airport (e.g. TLV, Ukraine, Red Sea, French strike)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <button type="submit" className="btn-primary text-xs py-3 px-6 whitespace-nowrap w-full sm:w-auto">
                Filter Advisories
              </button>
            </form>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="conflict">Armed Conflict</option>
                  <option value="airspace">Airspace Restrictions</option>
                  <option value="weather">Weather & Volcanic Ash</option>
                  <option value="strike">Strikes / ATC Industrial Action</option>
                  <option value="accident">Aviation Safety Investigations</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Severity:</span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="WARNING">Warning</option>
                  <option value="ADVISORY">Advisory</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Region:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none"
                >
                  <option value="all">All Regions</option>
                  <option value="Middle East">Middle East</option>
                  <option value="Eastern Europe">Eastern Europe</option>
                  <option value="Western Europe">Western Europe</option>
                  <option value="North Atlantic">North Atlantic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerts Feed List */}
          {loading ? (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-500">Fetching live civil aviation alerts & NOTAM bulletins...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="surface-card p-12 text-center space-y-3 border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-lg">No Active Advisories Matching Filters</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active airspace closures or critical bulletins were found for the selected criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="surface-card p-6 border border-slate-200 shadow-card hover:shadow-lg transition-all duration-200 space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {renderCategoryIcon(alert.category)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {renderSeverityBadge(alert.severity)}
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {alert.affectedRegion}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            {alert.verificationStatus === 'verified_official' ? '✓ Verified Official Authority' : 'Reputable Media Report'}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                          {alert.headline}
                        </h3>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-1 flex-shrink-0 text-right">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Published: {new Date(alert.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Verified: {new Date(alert.lastVerifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Affected Attributes */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {alert.summary}
                    </p>

                    {/* Affected Details Pill Row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {alert.affectedCountries?.length > 0 && (
                        <div>
                          <span className="text-slate-400 font-semibold mr-1">Affected Nations:</span>
                          <span className="font-bold text-slate-800">{alert.affectedCountries.join(', ')}</span>
                        </div>
                      )}
                      {alert.affectedAirports?.length > 0 && (
                        <div>
                          <span className="text-slate-400 font-semibold mr-1">Airports:</span>
                          <span className="font-bold text-blue-700 font-mono">{alert.affectedAirports.join(', ')}</span>
                        </div>
                      )}
                      {alert.affectedAirspace?.length > 0 && (
                        <div>
                          <span className="text-slate-400 font-semibold mr-1">Airspace FIRs:</span>
                          <span className="font-bold text-purple-700 font-mono">{alert.affectedAirspace.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Advice */}
                    {alert.operationalAdvice && (
                      <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Operational Guidance: </span>
                          <span>{alert.operationalAdvice}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Source: <strong>{alert.source.name}</strong></span>
                      {alert.source.url && (
                        <a
                          href={alert.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold ml-1"
                        >
                          Official Document <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAiSummary(alert)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                        <span>AI Traveler Breakdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: INTERACTIVE MAP ================= */}
      {activeTab === 'map' && (
        <CrisisMap alerts={alerts} onSelectAlert={handleOpenAiSummary} />
      )}

      {/* ================= TAB 3: ROUTE IMPACT CHECKER ================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Query Flight or Saved Trips */}
          <div className="lg:col-span-5 surface-card p-6 border border-slate-200 shadow-card space-y-6">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900">
                Flight & Airspace Impact Checker
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter any flight route or select from your saved journeys to assess airspace conflict zones and potential re-routing.
              </p>
            </div>

            {/* Quick Pick from Saved Trips */}
            {savedTrips.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Select Saved Trip
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedTrips.map((trip, idx) => {
                    const orig = typeof trip.origin === 'string' ? trip.origin : trip.origin?.iata || 'BOM'
                    const dest = typeof trip.destination === 'string' ? trip.destination : trip.destination?.iata || 'DEL'
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectTrip(trip)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-all flex items-center gap-1"
                      >
                        <span>{trip.flight_number || trip.flightNumber}</span>
                        <span className="text-slate-400 font-normal font-mono">({orig}→{dest})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Manual Route Form */}
            <form onSubmit={handleCheckImpact} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Flight Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BA142, AI645, EK505"
                  value={impactForm.flightNumber}
                  onChange={(e) => setImpactForm(p => ({ ...p, flightNumber: e.target.value.toUpperCase() }))}
                  className="input-field uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Origin IATA *
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. DEL"
                    value={impactForm.origin}
                    onChange={(e) => setImpactForm(p => ({ ...p, origin: e.target.value.toUpperCase() }))}
                    className="input-field uppercase font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Destination IATA *
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. LHR"
                    value={impactForm.destination}
                    onChange={(e) => setImpactForm(p => ({ ...p, destination: e.target.value.toUpperCase() }))}
                    className="input-field uppercase font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Connecting Stops (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DXB, DOH"
                  value={impactForm.connectingAirports}
                  onChange={(e) => setImpactForm(p => ({ ...p, connectingAirports: e.target.value.toUpperCase() }))}
                  className="input-field uppercase font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={impactLoading}
                className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                {impactLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Corridors...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Run Route Safety Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Impact Results Display */}
          <div className="lg:col-span-7 space-y-4">
            {!impactResult ? (
              <div className="surface-card p-12 text-center space-y-3 border border-slate-200">
                <Globe className="w-12 h-12 text-blue-500/60 mx-auto" />
                <h3 className="font-bold text-slate-800 text-lg">AeroMate Airspace Assessment Engine</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Enter your route or select a saved trip to verify direct airport impacts, regional conflict zones, and expected overflight detours.
                </p>
              </div>
            ) : (
              <div className="surface-card p-6 border border-slate-200 shadow-card space-y-5 animate-fade-in">
                {/* Result Header & Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment for</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-900">
                      {impactResult.flightNumber || 'Flight Route'}: {impactResult.route}
                    </h3>
                  </div>

                  {/* Impact Classification Badge */}
                  <div>
                    {impactResult.impactLevel === 'Confirmed' && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-sm">
                        <Flame className="w-4 h-4 text-rose-600" />
                        CONFIRMED IMPACT
                      </span>
                    )}
                    {impactResult.impactLevel === 'Potential Risk' && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        POTENTIAL CORRIDOR RISK
                      </span>
                    )}
                    {impactResult.impactLevel === 'No Known Direct Impact' && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        NO KNOWN DIRECT IMPACT
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Evidence & Findings
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {impactResult.evidence}
                  </div>
                </div>

                {/* Actionable Recommendations */}
                {impactResult.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Recommended Passenger Actions
                    </h4>
                    <div className="space-y-2">
                      {impactResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intersecting Alerts */}
                {impactResult.matchedAlerts?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Intersecting Official Advisories ({impactResult.matchedAlerts.length})
                    </h4>
                    <div className="space-y-2">
                      {impactResult.matchedAlerts.map(ma => (
                        <div key={ma.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            {renderCategoryIcon(ma.category)}
                            <span className="font-bold text-slate-800 truncate">{ma.headline}</span>
                          </div>
                          <button
                            onClick={() => handleOpenAiSummary(ma)}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 whitespace-nowrap ml-2"
                          >
                            Breakdown <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: AI EVENT SUMMARY ================= */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Safety & Travel Summary
                  </span>
                  {renderSeverityBadge(selectedAlert.severity)}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                  {selectedAlert.headline}
                </h3>
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              {aiLoading ? (
                <div className="text-center py-12 space-y-3">
                  <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-500">Generating grounded travel analysis...</p>
                </div>
              ) : aiSummary ? (
                <div className="space-y-5">
                  {/* Why it Matters */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                      Why This Matters to Aviation & Passengers
                    </h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                      {aiSummary.whyItMatters}
                    </p>
                  </div>

                  {/* Confirmed vs Unconfirmed */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                      Confirmed vs. Unconfirmed Reporting
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {aiSummary.confirmedVsUnconfirmed}
                    </p>
                  </div>

                  {/* Traveler Actionable Next Steps */}
                  {aiSummary.passengerActions?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                        What You Should Do Next
                      </h4>
                      <div className="space-y-2">
                        {aiSummary.passengerActions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Underlying Sources Cited */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <span>Sources Cited: <strong>{selectedAlert.source.name}</strong></span>
                    {selectedAlert.source.url && (
                      <a
                        href={selectedAlert.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Visit Official Bulletin <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Summary currently unavailable.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
