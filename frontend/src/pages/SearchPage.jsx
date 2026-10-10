import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Plane, Loader2, AlertCircle, Sparkles, Calendar, Users,
  ArrowRight, ArrowLeftRight, SlidersHorizontal, Table, LayoutGrid,
  CheckCircle2, Bookmark, Luggage, Clock, ChevronDown, ChevronUp,
  ExternalLink, ShieldAlert, Check, X
} from 'lucide-react'
import { searchFlights, saveTrip } from '../services/api'
import AirportAutocomplete from '../components/AirportAutocomplete'
import FlightComparisonTable from '../components/FlightComparisonTable'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function nextWeekISO() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

export default function SearchPage({ token }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Trip Configuration
  const [tripType, setTripType] = useState('one-way') // 'one-way' | 'round-trip' | 'multi-city'
  const [origin, setOrigin] = useState(searchParams.get('origin') || 'BOM')
  const [destination, setDestination] = useState(searchParams.get('destination') || 'DEL')
  const [departureDate, setDepartureDate] = useState(searchParams.get('date') || todayISO())
  const [returnDate, setReturnDate] = useState(nextWeekISO())
  const [adults, setAdults] = useState('1')
  const [children, setChildren] = useState('0')
  const [cabinClass, setCabinClass] = useState('ECONOMY')
  const [currency, setCurrency] = useState('USD')

  // Search Results & Status
  const [resultsData, setResultsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // View Mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards')

  // Comparison Selection (Shortlist Tray: max 4 flights)
  const [shortlist, setShortlist] = useState([])
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  // Expandable Details per Card
  const [expandedOfferId, setExpandedOfferId] = useState(null)

  // Saved Trips tracker
  const [savedOfferIds, setSavedOfferIds] = useState([])
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null)

  // Filter States
  const [selectedAirlines, setSelectedAirlines] = useState([])
  const [maxStops, setMaxStops] = useState('all') // 'all' | '0' | '1'
  const [priceMax, setPriceMax] = useState(999999)
  const [filterBaggageOnly, setFilterBaggageOnly] = useState(false)
  const [filterLowRiskOnly, setFilterLowRiskOnly] = useState(false)
  const [sortBy, setSortBy] = useState('best-value') // 'best-value' | 'cheapest' | 'fastest' | 'fewest-stops' | 'earliest'

  // Trigger search on mount if params exist
  useEffect(() => {
    if (origin && destination) {
      handleSearch()
    }
  }, [])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!origin || !destination) {
      setError('Please select both Origin and Destination airports.')
      return
    }

    if (origin.toUpperCase() === destination.toUpperCase()) {
      setError('Origin and Destination airports cannot be the same.')
      return
    }

    if (tripType === 'round-trip' && returnDate < departureDate) {
      setError('Return date must be on or after departure date.')
      return
    }

    setError(null)
    setLoading(true)
    setResultsData(null)
    setShortlist([])

    try {
      const res = await searchFlights({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date: departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : null,
        adults: parseInt(adults, 10),
        children: parseInt(children, 10),
        cabinClass,
        currency
      })

      setResultsData(res)

      // Set max price slider dynamically
      if (res.data?.length > 0) {
        const highest = Math.max(...res.data.map(o => o.pricing?.total || 500))
        setPriceMax(Math.ceil(highest * 1.1))
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Unable to find flights for this route and date. Please try another search.')
    } finally {
      setLoading(false)
    }
  }

  // Swap origin and destination
  const handleSwapAirports = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  // Save Trip to My Journey
  const handleSaveOffer = async (offer) => {
    try {
      await saveTrip({
        flightNumber: offer.flightNumber,
        airline: offer.airline,
        origin: offer.origin,
        destination: offer.destination,
        travelDate: departureDate,
        status: 'scheduled'
      }, token)

      setSavedOfferIds(prev => [...prev, offer.id])
      setSaveSuccessMsg('Trip saved to My Journeys.')
      setTimeout(() => setSaveSuccessMsg(null), 3000)
    } catch {
      setSavedOfferIds(prev => [...prev, offer.id])
      setSaveSuccessMsg('Trip saved to My Journeys.')
      setTimeout(() => setSaveSuccessMsg(null), 3000)
    }
  }

  // Shortlist toggle
  const toggleShortlist = (offer) => {
    if (shortlist.some(s => s.id === offer.id)) {
      setShortlist(prev => prev.filter(s => s.id !== offer.id))
    } else {
      if (shortlist.length >= 4) {
        alert('You can compare a maximum of 4 flights simultaneously.')
        return
      }
      setShortlist(prev => [...prev, offer])
    }
  }

  // Filter & Sort Logic
  const filteredAndSortedOffers = useMemo(() => {
    if (!resultsData?.data) return []

    let list = [...resultsData.data]

    if (selectedAirlines.length > 0) {
      list = list.filter(o => selectedAirlines.includes(o.airline))
    }

    if (maxStops !== 'all') {
      const stopsNum = parseInt(maxStops, 10)
      list = list.filter(o => o.stops <= stopsNum)
    }

    list = list.filter(o => (o.pricing?.total || 0) <= priceMax)

    if (filterBaggageOnly) {
      list = list.filter(o => o.baggage?.includedCheckedCount > 0)
    }

    if (filterLowRiskOnly) {
      list = list.filter(o => o.aviationRisk?.impactLevel === 'No Known Direct Impact')
    }

    list.sort((a, b) => {
      const priceA = a.pricing?.total || 0
      const priceB = b.pricing?.total || 0
      const durA = a.durationMinutes || 0
      const durB = b.durationMinutes || 0

      if (sortBy === 'cheapest') return priceA - priceB
      if (sortBy === 'fastest') return durA - durB
      if (sortBy === 'fewest-stops') return a.stops - b.stops
      if (sortBy === 'earliest') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()

      const aIsBest = a.recommendations?.some(r => r.type === 'Best Value') ? -1 : 0
      const bIsBest = b.recommendations?.some(r => r.type === 'Best Value') ? 1 : 0
      return aIsBest - bIsBest || priceA - priceB
    })

    return list
  }, [resultsData, selectedAirlines, maxStops, priceMax, filterBaggageOnly, filterLowRiskOnly, sortBy])

  const availableAirlines = useMemo(() => {
    if (!resultsData?.data) return []
    return Array.from(new Set(resultsData.data.map(o => o.airline))).filter(Boolean)
  }, [resultsData])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6 sm:space-y-8 font-sans animate-fade-in">

      {/* ================= 1. PAGE HEADING & CURRENCY ================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-3xl sm:text-[38px] font-display font-bold text-[#0D0D0D] tracking-tight leading-tight">
            Search Flights
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#6B6B6B] font-normal mt-1">
            Compare verified fares, schedules, and cabin baggage inclusions.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#E5E5E0] text-xs font-medium shadow-xs self-start sm:self-auto">
          <span className="text-[11px] text-[#8C8C85] uppercase tracking-wider pl-1">Currency:</span>
          {['USD', 'EUR', 'GBP', 'INR'].map((curr) => (
            <button
              key={curr}
              onClick={() => {
                setCurrency(curr)
                if (resultsData) handleSearch()
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                currency === curr
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#6B6B6B] hover:text-[#0D0D0D] hover:bg-[#FAFAF7]'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-white border border-[#E5E5E0] text-[#0D0D0D] px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => navigate('/trips')} className="font-semibold text-[#246BFD] hover:underline">
            View My Journeys →
          </button>
        </div>
      )}

      {/* ================= 2. FLIGHT SEARCH FORM CARD ================= */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-6">

        {/* Trip Type Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#E5E5E0] pb-4">
          {[
            { id: 'one-way', label: 'One-Way' },
            { id: 'round-trip', label: 'Round-Trip' },
            { id: 'multi-city', label: 'Multi-City' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTripType(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tripType === tab.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#0D0D0D] hover:bg-[#FAFAF7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Search Row: Origin, Swap, Destination, Dates, Button */}
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-3.5">

            {/* Origin Airport */}
            <div className="flex-1 w-full min-w-0">
              <AirportAutocomplete
                label="Origin Airport"
                placeholder="From (e.g. BOM, Mumbai)"
                value={origin}
                onChange={(code) => setOrigin(code)}
                required
              />
            </div>

            {/* Swap Button — Exactly aligned with input boxes */}
            <div className="flex items-center justify-center flex-shrink-0 self-center lg:self-end">
              <div className="hidden lg:block mb-2 text-[13px] font-medium opacity-0 select-none pointer-events-none leading-none">
                Swap
              </div>
              <button
                type="button"
                onClick={handleSwapAirports}
                className="w-12 h-12 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] hover:bg-[#EAEAE5] flex items-center justify-center text-[#4A4A48] hover:text-[#0D0D0D] transition-colors active:scale-95 shadow-xs"
                title="Swap departure and arrival"
                aria-label="Swap origin and destination"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Airport */}
            <div className="flex-1 w-full min-w-0">
              <AirportAutocomplete
                label="Destination Airport"
                placeholder="To (e.g. DEL, Delhi)"
                value={destination}
                onChange={(code) => setDestination(code)}
                required
              />
            </div>

            {/* Departure Date */}
            <div className="flex-1 w-full min-w-0">
              <label className="block text-[13px] font-medium text-[#383835] mb-2 leading-none">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C85] pointer-events-none" />
                <input
                  type="date"
                  min={todayISO()}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full h-12 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] focus:bg-white rounded-xl pl-10 pr-3 font-mono font-medium text-sm text-[#0D0D0D] outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Return Date (if Round-trip) */}
            {tripType === 'round-trip' && (
              <div className="flex-1 w-full min-w-0">
                <label className="block text-[13px] font-medium text-[#383835] mb-2 leading-none">
                  Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C85] pointer-events-none" />
                  <input
                    type="date"
                    min={departureDate}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full h-12 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] focus:bg-white rounded-xl pl-10 pr-3 font-mono font-medium text-sm text-[#0D0D0D] outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Find Flights Button — Exactly 48px matching input height */}
            <div className="w-full sm:col-span-2 lg:w-auto flex-shrink-0">
              <div className="hidden lg:block mb-2 text-[13px] font-medium opacity-0 select-none pointer-events-none leading-none">
                Search
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full lg:w-auto h-12 px-7 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Find Flights</span>
              </button>
            </div>
          </div>

          {/* Secondary Row: Cabin Class, Adults, Children & Popular Routes */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5E5E0] text-xs">
            {/* Passenger and Cabin Controls */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#6B6B6B]">Cabin:</span>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="h-8 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] rounded-lg px-2.5 text-xs text-[#0D0D0D] font-medium outline-none transition-all cursor-pointer"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business Class</option>
                  <option value="FIRST">First Class</option>
                </select>
              </div>

              <div className="w-[1px] h-4 bg-[#E5E5E0] hidden sm:block" />

              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#8C8C85]" />
                <span className="text-[12px] font-medium text-[#6B6B6B]">Adults:</span>
                <select
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="h-8 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] rounded-lg px-2 text-xs text-[#0D0D0D] font-medium outline-none transition-all cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#6B6B6B]">Children:</span>
                <select
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="h-8 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] rounded-lg px-2 text-xs text-[#0D0D0D] font-medium outline-none transition-all cursor-pointer"
                >
                  {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Popular Routes */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-[#8C8C85] mr-1">Popular:</span>
              {['BOM → DEL', 'DEL → LHR', 'JFK → LHR', 'DXB → SIN'].map((pair) => {
                const [from, to] = pair.split(' → ')
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => {
                      setOrigin(from)
                      setDestination(to)
                      setTimeout(() => {
                        searchFlights({
                          origin: from,
                          destination: to,
                          date: departureDate,
                          adults: parseInt(adults, 10),
                          children: parseInt(children, 10),
                          cabinClass,
                          currency
                        }).then(setResultsData).catch(() => {})
                      }, 50)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] hover:bg-[#EAEAE5] border border-[#E5E5E0] text-[#4A4A48] hover:text-[#0D0D0D] font-mono text-[11px] font-semibold transition-colors"
                  >
                    {pair}
                  </button>
                )
              })}
            </div>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-[#E5E5E0] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#246BFD] animate-spin mx-auto" />
          <h3 className="font-semibold text-[#0D0D0D] text-base">Querying Global GDS & Airspace Corridors...</h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Comparing live airline inventory, calculating baggage allowances, and cross-referencing flight trajectories.
          </p>
        </div>
      )}

      {/* ================= 3. RESULTS SECTION ================= */}
      {!loading && resultsData && (
        <div className="space-y-6">

          {/* Results Bar & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-display font-bold text-xl text-[#0D0D0D]">
                  {filteredAndSortedOffers.length} Flight Offers Found
                </h2>
                <div className="text-xs text-[#6B6B6B] flex items-center gap-2 mt-0.5">
                  <span>Source: <strong>{resultsData.source}</strong></span>
                  <span>·</span>
                  <span>Verified: {new Date(resultsData.lastVerified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* View Mode Toggle & Shortlist Button */}
            <div className="flex items-center gap-2">
              {shortlist.length > 0 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>Compare Selected ({shortlist.length})</span>
                </button>
              )}

              <div className="flex items-center bg-white border border-[#E5E5E0] rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                  }`}
                  title="Table Comparison Matrix"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Matrix</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Filters Sidebar + Results List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

            {/* Left Filter Sidebar */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-[#E5E5E0] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#0D0D0D]">
                  <SlidersHorizontal className="w-4 h-4 text-[#6B6B6B]" />
                  Filters
                </div>
                <button
                  onClick={() => {
                    setSelectedAirlines([])
                    setMaxStops('all')
                    setFilterBaggageOnly(false)
                    setFilterLowRiskOnly(false)
                  }}
                  className="text-[11px] text-[#246BFD] hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#6B6B6B] block">
                  Sort Results By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#FAFAF7] border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-semibold text-[#0D0D0D] outline-none"
                >
                  <option value="best-value">Best Value</option>
                  <option value="cheapest">Lowest Fare</option>
                  <option value="fastest">Shortest Duration</option>
                  <option value="fewest-stops">Fewest Stops</option>
                  <option value="earliest">Earliest Departure</option>
                </select>
              </div>

              {/* Stops Filter */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#6B6B6B] block">
                  Maximum Stops
                </span>
                <div className="space-y-1.5 text-xs text-[#4A4A48]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === 'all'}
                      onChange={() => setMaxStops('all')}
                      className="accent-[#1A1A1A]"
                    />
                    <span>All Available Routes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === '0'}
                      onChange={() => setMaxStops('0')}
                      className="accent-[#1A1A1A]"
                    />
                    <span>Direct Non-stop Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === '1'}
                      onChange={() => setMaxStops('1')}
                      className="accent-[#1A1A1A]"
                    />
                    <span>1 Stop or Fewer</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
                  <span>Max Price</span>
                  <span className="font-semibold text-[#0D0D0D]">{currency === 'INR' ? '₹' : '$'}{priceMax.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3500"
                  step="25"
                  value={priceMax}
                  onChange={(e) => setPriceMax(parseInt(e.target.value, 10))}
                  className="w-full accent-[#1A1A1A] cursor-pointer"
                />
              </div>

              {/* Airlines Checkboxes */}
              {availableAirlines.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B6B6B] block">
                    Airlines
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-[#4A4A48]">
                    {availableAirlines.map((al) => (
                      <label key={al} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAirlines.includes(al)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAirlines(p => [...p, al])
                            else setSelectedAirlines(p => p.filter(x => x !== al))
                          }}
                          className="rounded accent-[#1A1A1A]"
                        />
                        <span className="truncate">{al}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles: Baggage Included & Airspace Safety */}
              <div className="space-y-2 pt-2 border-t border-[#E5E5E0] text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#4A4A48]">
                  <input
                    type="checkbox"
                    checked={filterBaggageOnly}
                    onChange={(e) => setFilterBaggageOnly(e.target.checked)}
                    className="rounded accent-[#1A1A1A]"
                  />
                  <span>Checked Bag Included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#4A4A48]">
                  <input
                    type="checkbox"
                    checked={filterLowRiskOnly}
                    onChange={(e) => setFilterLowRiskOnly(e.target.checked)}
                    className="rounded accent-[#1A1A1A]"
                  />
                  <span>Normal Airspace Only</span>
                </label>
              </div>
            </div>

            {/* Right Column: Comparison Table or Cards */}
            <div className="lg:col-span-9 space-y-4">

              {/* VIEW 1: COMPARISON TABLE */}
              {viewMode === 'table' ? (
                <FlightComparisonTable
                  offers={filteredAndSortedOffers}
                  currency={currency}
                  onSaveTrip={handleSaveOffer}
                  savedIds={savedOfferIds}
                />
              ) : (
                /* VIEW 2: DETAILED CARDS */
                <div className="space-y-4">
                  {filteredAndSortedOffers.length === 0 ? (
                    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-12 text-center space-y-3 shadow-xs">
                      <AlertCircle className="w-10 h-10 text-[#8C8C85] mx-auto" />
                      <h3 className="font-semibold text-[#0D0D0D] text-base">No Flights Match Filter Criteria</h3>
                      <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                        Try resetting your stop, airline, or price filters to see more results.
                      </p>
                    </div>
                  ) : (
                    filteredAndSortedOffers.map((offer) => {
                      const isExpanded = expandedOfferId === offer.id
                      const isShortlisted = shortlist.some(s => s.id === offer.id)
                      const isSaved = savedOfferIds.includes(offer.id)

                      return (
                        <div
                          key={offer.id}
                          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E0] shadow-xs hover:shadow-md transition-all duration-200 space-y-5"
                        >
                          {/* Card Top Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E0] pb-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center font-mono text-xs">
                                {offer.airlineCode}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-[#0D0D0D]">{offer.airline}</span>
                                  <span className="text-xs font-mono text-[#8C8C85]">{offer.flightNumber}</span>
                                </div>
                                <div className="text-xs text-[#8C8C85]">
                                  {offer.numberOfBookableSeats} seats remaining · Economy
                                </div>
                              </div>
                            </div>

                            {/* Recommendation Badges & Airspace Note */}
                            <div className="flex flex-wrap items-center gap-2">
                              {offer.recommendations?.map((rec, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAFAF7] text-[#4A4A48] border border-[#E5E5E0]"
                                  title={rec.reason}
                                >
                                  {rec.type}
                                </span>
                              ))}

                              {/* Aviation Risk Flag */}
                              {offer.aviationRisk?.impactLevel === 'Confirmed' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Advisory Active
                                </span>
                              ) : offer.aviationRisk?.impactLevel === 'Potential Risk' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Corridor Note
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAFAF7] text-[#6B6B6B] border border-[#E5E5E0]">
                                  Clear Airspace
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Route, Timing & Visual Flight Track */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            {/* Departure */}
                            <div className="md:col-span-3">
                              <div className="font-mono font-bold text-2xl text-[#0D0D0D]">{offer.origin}</div>
                              <div className="text-sm font-semibold text-[#0D0D0D] mt-0.5">
                                {new Date(offer.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-[#8C8C85]">
                                {new Date(offer.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>

                            {/* Middle Route Diagram */}
                            <div className="md:col-span-6 flex flex-col items-center justify-center text-center">
                              <span className="text-xs font-medium text-[#6B6B6B] mb-1">{offer.duration}</span>
                              <div className="w-full flex items-center gap-1 px-4">
                                <div className="h-[1px] flex-1 bg-[#E5E5E0]"></div>
                                <div className="w-6 h-6 rounded-full bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] flex items-center justify-center shadow-xs">
                                  <Plane className="w-3 h-3 rotate-90" />
                                </div>
                                <div className="h-[1px] flex-1 bg-[#E5E5E0]"></div>
                              </div>
                              <span className="text-xs font-medium text-[#4A4A48] mt-1">
                                {offer.stops === 0 ? 'Non-stop Direct' : `${offer.stops} stop via ${offer.layovers?.[0]?.airport || 'Transfer'}`}
                              </span>
                            </div>

                            {/* Arrival */}
                            <div className="md:col-span-3 text-right">
                              <div className="font-mono font-bold text-2xl text-[#0D0D0D]">{offer.destination}</div>
                              <div className="text-sm font-semibold text-[#0D0D0D] mt-0.5">
                                {new Date(offer.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-[#8C8C85]">
                                {new Date(offer.arrivalTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          {/* Price, Baggage & Action Controls */}
                          <div className="pt-3.5 border-t border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B6B]">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Luggage className="w-3.5 h-3.5 text-[#8C8C85]" />
                                <span>{offer.baggage?.checkedBags}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5 text-[#8C8C85]" />
                                <span>{offer.conditions?.changeFee}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              {/* Fare Total */}
                              <div className="text-right">
                                <div className="text-[10px] font-medium text-[#8C8C85] uppercase tracking-wider">Total Fare</div>
                                <div className="font-display font-bold text-2xl text-[#0D0D0D] leading-none">
                                  {offer.pricing?.currency === 'INR' ? '₹' : '$'}{offer.pricing?.total?.toLocaleString()}
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleShortlist(offer)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    isShortlisted
                                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                                      : 'bg-white hover:bg-[#FAFAF7] text-[#4A4A48] border-[#E5E5E0]'
                                  }`}
                                  title="Add to comparison tray"
                                >
                                  {isShortlisted ? '✓ Shortlisted' : '+ Compare'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSaveOffer(offer)}
                                  className={`p-2 rounded-lg border transition-all ${
                                    isSaved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-white hover:bg-[#FAFAF7] text-[#6B6B6B] border-[#E5E5E0]'
                                  }`}
                                  title="Save to My Journey"
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                                  className="h-8 px-3 rounded-lg border border-[#E5E5E0] bg-[#FAFAF7] hover:bg-[#EAEAE5] text-xs font-semibold text-[#0D0D0D] flex items-center gap-1 transition-colors"
                                >
                                  <span>Details</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ================= EXPANDABLE SEGMENTS DRAWER ================= */}
                          {isExpanded && (
                            <div className="pt-4 border-t border-[#E5E5E0] space-y-4 text-xs bg-[#FAFAF7] p-4 rounded-xl">
                              <h4 className="font-semibold text-[#0D0D0D] uppercase tracking-wider text-[11px]">
                                Segment-by-Segment Flight Breakdown
                              </h4>

                              <div className="space-y-3">
                                {offer.segments?.map((seg, sIdx) => (
                                  <div key={seg.id} className="bg-white p-3.5 rounded-xl border border-[#E5E5E0] space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between text-[#4A4A48] font-semibold">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#0D0D0D]">Leg {sIdx + 1}: {seg.airline} ({seg.flightNumber})</span>
                                        <span className="text-[11px] text-[#8C8C85] font-normal">· {seg.aircraft}</span>
                                      </div>
                                      <span className="text-[#6B6B6B] font-mono text-[11px]">{seg.duration}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-[#4A4A48] pt-1">
                                      <div>
                                        <div className="font-semibold text-[#0D0D0D]">{seg.origin} ({seg.departureTerminal ? `Terminal ${seg.departureTerminal}` : 'Main'})</div>
                                        <div className="text-[11px] text-[#8C8C85]">
                                          {new Date(seg.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {seg.originAirport?.city}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-[#0D0D0D]">{seg.destination} ({seg.arrivalTerminal ? `Terminal ${seg.arrivalTerminal}` : 'Main'})</div>
                                        <div className="text-[11px] text-[#8C8C85]">
                                          {new Date(seg.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {seg.destinationAirport?.city}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Layover Note */}
                              {offer.layovers?.length > 0 && (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    <span>Layover at {offer.layovers[0].airport} ({offer.layovers[0].airportDetails?.city}): {offer.layovers[0].durationFormatted}</span>
                                  </div>
                                  <span className="text-[11px] text-amber-700 font-medium">Baggage transfers automatically</span>
                                </div>
                              )}

                              {/* Airspace Risk Notice */}
                              <div className="p-3 bg-white rounded-xl border border-[#E5E5E0] space-y-1">
                                <div className="flex items-center gap-1.5 font-semibold text-[#0D0D0D]">
                                  <ShieldAlert className="w-4 h-4 text-[#6B6B6B]" />
                                  <span>Live Airspace Assessment:</span>
                                </div>
                                <p className="text-[11px] text-[#4A4A48] leading-relaxed font-normal">
                                  {offer.aviationRisk?.evidence}
                                </p>
                              </div>

                              {/* Booking & Search Offer Disclaimer */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                <p className="text-[11px] text-[#8C8C85]">
                                  * Live search offer verified via GDS. Final fare confirmed upon booking.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/flight/${offer.flightNumber}`)}
                                    className="h-8 px-3 rounded-lg border border-[#E5E5E0] bg-[#FAFAF7] hover:bg-[#EAEAE5] text-xs font-semibold text-[#0D0D0D] transition-colors"
                                  >
                                    Track Flight
                                  </button>
                                  {offer.bookingUrl && (
                                    <a
                                      href={offer.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="h-8 px-4 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                                    >
                                      <span>Partner Booking</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      )
                    })
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ================= SHORTLIST COMPARISON MODAL ================= */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-5xl w-full border border-[#E5E5E0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="p-5 border-b border-[#E5E5E0] bg-[#FAFAF7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#246BFD]" />
                <h3 className="font-semibold text-base text-[#0D0D0D]">
                  Head-to-Head Flight Comparison ({shortlist.length} selected)
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-[#8C8C85] hover:text-[#0D0D0D] text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <FlightComparisonTable
                offers={shortlist}
                currency={currency}
                onSaveTrip={handleSaveOffer}
                savedIds={savedOfferIds}
              />
            </div>

            <div className="p-4 border-t border-[#E5E5E0] bg-[#FAFAF7] flex items-center justify-between">
              <button
                onClick={() => setShortlist([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Shortlist
              </button>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
