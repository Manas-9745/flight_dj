import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Plane, Loader2, AlertCircle, Sparkles, Calendar, Users,
  ArrowRight, ArrowLeftRight, SlidersHorizontal, Table, LayoutGrid,
  CheckCircle2, Bookmark, Flame, Luggage, Clock, ChevronDown, ChevronUp,
  ExternalLink, ShieldAlert, Check, RefreshCw, X
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
  const [searchParams, setSearchParams] = useSearchParams()
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
      setSaveSuccessMsg('Trip saved.')
      setTimeout(() => setSaveSuccessMsg(null), 3000)
    } catch {
      // Graceful local saved state
      setSavedOfferIds(prev => [...prev, offer.id])
      setSaveSuccessMsg('Trip saved.')
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

    // Filter by Airline
    if (selectedAirlines.length > 0) {
      list = list.filter(o => selectedAirlines.includes(o.airline))
    }

    // Filter by Stops
    if (maxStops !== 'all') {
      const stopsNum = parseInt(maxStops, 10)
      list = list.filter(o => o.stops <= stopsNum)
    }

    // Filter by Price
    list = list.filter(o => (o.pricing?.total || 0) <= priceMax)

    // Filter by Baggage
    if (filterBaggageOnly) {
      list = list.filter(o => o.baggage?.includedCheckedCount > 0)
    }

    // Filter by Low Risk Only
    if (filterLowRiskOnly) {
      list = list.filter(o => o.aviationRisk?.impactLevel === 'No Known Direct Impact')
    }

    // Sorting
    list.sort((a, b) => {
      const priceA = a.pricing?.total || 0
      const priceB = b.pricing?.total || 0
      const durA = a.durationMinutes || 0
      const durB = b.durationMinutes || 0

      if (sortBy === 'cheapest') return priceA - priceB
      if (sortBy === 'fastest') return durA - durB
      if (sortBy === 'fewest-stops') return a.stops - b.stops
      if (sortBy === 'earliest') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()

      // Default: Best value (prioritize recommendations with Best Value / Fastest / Cheapest)
      const aIsBest = a.recommendations?.some(r => r.type === 'Best Value') ? -1 : 0
      const bIsBest = b.recommendations?.some(r => r.type === 'Best Value') ? 1 : 0
      return aIsBest - bIsBest || priceA - priceB
    })

    return list
  }, [resultsData, selectedAirlines, maxStops, priceMax, filterBaggageOnly, filterLowRiskOnly, sortBy])

  // Extract unique airlines from results for filter checkboxes
  const availableAirlines = useMemo(() => {
    if (!resultsData?.data) return []
    return Array.from(new Set(resultsData.data.map(o => o.airline))).filter(Boolean)
  }, [resultsData])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E5E0] text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-2">
            <Plane className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>Flight Search & Comparison</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0D0D0D] tracking-tight">
            Search Flights
          </h1>
          <p className="text-sm font-medium text-[#6B6B6B] mt-1">
            Compare verified fares, schedules, and cabin baggage inclusions.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E5E5E0] text-xs font-semibold shadow-subtle">
          <span className="text-[#8C8C85]">Currency:</span>
          {['USD', 'EUR', 'GBP', 'INR'].map((curr) => (
            <button
              key={curr}
              onClick={() => {
                setCurrency(curr)
                if (resultsData) handleSearch()
              }}
              className={`px-2.5 py-1 rounded-full transition-all ${
                currency === curr ? 'bg-[#1A1A1A] text-white' : 'text-[#6B6B6B] hover:bg-[#FAFAF7]'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => navigate('/trips')} className="underline hover:text-black">
            View My Journeys →
          </button>
        </div>
      )}

      {/* ================= SEARCH FORM CARD ================= */}
      <div className="surface-card p-6 sm:p-8 border border-[#E5E5E0] shadow-card space-y-6">

        {/* Trip Type Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-4">
          <button
            type="button"
            onClick={() => setTripType('one-way')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tripType === 'one-way'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-[#FAFAF7] text-[#6B6B6B] hover:text-[#0D0D0D]'
            }`}
          >
            One-Way
          </button>
          <button
            type="button"
            onClick={() => setTripType('round-trip')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tripType === 'round-trip'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-[#FAFAF7] text-[#6B6B6B] hover:text-[#0D0D0D]'
            }`}
          >
            Round-Trip
          </button>
          <button
            type="button"
            onClick={() => setTripType('multi-city')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tripType === 'multi-city'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-[#FAFAF7] text-[#6B6B6B] hover:text-[#0D0D0D]'
            }`}
          >
            Multi-City
          </button>
        </div>

        {/* Main Inputs Grid */}
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

            {/* Origin Autocomplete */}
            <div className="md:col-span-3">
              <AirportAutocomplete
                label="Origin Airport"
                placeholder="From (e.g. BOM, Mumbai)"
                value={origin}
                onChange={(code) => setOrigin(code)}
                required
              />
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex items-center justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapAirports}
                className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-transform active:scale-90"
                title="Swap departure and arrival"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Autocomplete */}
            <div className="md:col-span-3">
              <AirportAutocomplete
                label="Destination Airport"
                placeholder="To (e.g. DEL, Delhi)"
                value={destination}
                onChange={(code) => setDestination(code)}
                required
              />
            </div>

            {/* Departure Date */}
            <div className={tripType === 'round-trip' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  min={todayISO()}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="input-field pl-10 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            {/* Return Date (if Round-trip) */}
            {tripType === 'round-trip' && (
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
                  Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    min={departureDate}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="input-field pl-10 text-xs font-semibold"
                    required
                  />
                </div>
              </div>
            )}

            {/* Search Submit Button */}
            <div className={tripType === 'round-trip' ? 'md:col-span-1' : 'md:col-span-2'}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Find Flights</span>
              </button>
            </div>
          </div>

          {/* Secondary Preferences Bar: Cabin Class & Passengers */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Cabin:</span>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold outline-none"
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business Class</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500 uppercase tracking-wider">Adults:</span>
              <select
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Children:</span>
              <select
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold outline-none"
              >
                {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Quick Hub Chips */}
            <div className="ml-auto hidden lg:flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-semibold">Popular Routes:</span>
              {['BOM → DEL', 'DEL → LHR', 'JFK → LHR', 'DXB → SIN'].map((pair) => {
                const [from, to] = pair.split(' → ')
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => {
                      setOrigin(from)
                      setDestination(to)
                      // Trigger search immediately with selected codes
                      setTimeout(() => {
                        const evt = { preventDefault: () => {} }
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
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold transition-colors"
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
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="surface-card p-12 text-center space-y-4 border border-slate-200">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">Querying Global GDS & Airspace Corridors...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Comparing live airline inventory, calculating baggage allowances, and cross-referencing flight trajectories with active conflict bulletins.
          </p>
        </div>
      )}

      {/* ================= RESULTS SECTION ================= */}
      {!loading && resultsData && (
        <div className="space-y-6">

          {/* Results Bar & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900">
                  {filteredAndSortedOffers.length} Flight Offers Found
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
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
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>Compare Selected ({shortlist.length})</span>
                </button>
              )}

              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-subtle">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Table Comparison Matrix"
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Matrix</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Filters Sidebar + Results List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Filter Sidebar */}
            <div className="lg:col-span-3 surface-card p-5 border border-slate-200 shadow-subtle space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-800">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  Smart Filters
                </div>
                <button
                  onClick={() => {
                    setSelectedAirlines([])
                    setMaxStops('all')
                    setFilterBaggageOnly(false)
                    setFilterLowRiskOnly(false)
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#52524E] uppercase tracking-wider block">
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
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Maximum Stops
                </span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === 'all'}
                      onChange={() => setMaxStops('all')}
                      className="text-blue-600"
                    />
                    <span>All Available Routes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === '0'}
                      onChange={() => setMaxStops('0')}
                      className="text-blue-600"
                    />
                    <span>Direct Non-stop Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === '1'}
                      onChange={() => setMaxStops('1')}
                      className="text-blue-600"
                    />
                    <span>1 Stop or Fewer</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="uppercase tracking-wider">Max Price</span>
                  <span className="text-blue-600">{currency === 'INR' ? '₹' : '$'}{priceMax.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3500"
                  step="25"
                  value={priceMax}
                  onChange={(e) => setPriceMax(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Airlines Checkboxes */}
              {availableAirlines.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Airlines
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-slate-700">
                    {availableAirlines.map((al) => (
                      <label key={al} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAirlines.includes(al)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAirlines(p => [...p, al])
                            else setSelectedAirlines(p => p.filter(x => x !== al))
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="truncate">{al}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles: Baggage Included & Airspace Safety */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterBaggageOnly}
                    onChange={(e) => setFilterBaggageOnly(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Checked Bag Included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterLowRiskOnly}
                    onChange={(e) => setFilterLowRiskOnly(e.target.checked)}
                    className="rounded text-blue-600"
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
                    <div className="surface-card p-12 text-center space-y-3 border border-slate-200">
                      <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                      <h3 className="font-bold text-slate-800 text-lg">No Flights Match Filter Criteria</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                          className="surface-card p-6 border border-slate-200 shadow-card hover:shadow-lg transition-all duration-200 space-y-5"
                        >
                          {/* Card Top Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center font-mono text-sm">
                                {offer.airlineCode}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-base text-slate-900">{offer.airline}</span>
                                  <span className="text-xs font-mono text-slate-500 font-semibold">{offer.flightNumber}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  {offer.numberOfBookableSeats} seats remaining · Economy
                                </div>
                              </div>
                            </div>

                            {/* Recommendation Badges & Airspace Note */}
                            <div className="flex flex-wrap items-center gap-2">
                              {offer.recommendations?.map((rec, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#FAFAF7] text-[#52524E] border-[#E5E5E0]"
                                  title={rec.reason}
                                >
                                  {rec.type}
                                </span>
                              ))}

                              {/* Aviation Risk Flag */}
                              {offer.aviationRisk?.impactLevel === 'Confirmed' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAFAF7] text-[#1A1A1A] border border-[#E5E5E0]">
                                  Advisory Active
                                </span>
                              ) : offer.aviationRisk?.impactLevel === 'Potential Risk' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAFAF7] text-[#52524E] border border-[#E5E5E0]">
                                  Corridor Note
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAFAF7] text-[#6B6B6B] border border-[#E5E5E0]">
                                  Clear Airspace
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Route, Timing & Visual Flight Track */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            {/* Departure */}
                            <div className="md:col-span-3">
                              <div className="font-mono font-extrabold text-2xl text-slate-900">{offer.origin}</div>
                              <div className="text-xs font-bold text-slate-700 mt-0.5">
                                {new Date(offer.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(offer.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>

                            {/* Middle Route Diagram */}
                            <div className="md:col-span-6 flex flex-col items-center justify-center text-center">
                              <span className="text-xs font-bold text-slate-500 mb-1">{offer.duration}</span>
                              <div className="w-full flex items-center gap-1 px-4">
                                <div className="h-0.5 flex-1 bg-slate-200"></div>
                                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                                  <Plane className="w-3.5 h-3.5 rotate-90" />
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-200"></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 mt-1">
                                {offer.stops === 0 ? 'Non-stop Direct' : `${offer.stops} stop via ${offer.layovers?.[0]?.airport || 'Transfer'}`}
                              </span>
                            </div>

                            {/* Arrival */}
                            <div className="md:col-span-3 text-right">
                              <div className="font-mono font-extrabold text-2xl text-slate-900">{offer.destination}</div>
                              <div className="text-xs font-bold text-slate-700 mt-0.5">
                                {new Date(offer.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(offer.arrivalTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          {/* Price, Baggage & Action Controls */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Luggage className="w-4 h-4 text-slate-400" />
                                <span>{offer.baggage?.checkedBags}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>{offer.conditions?.changeFee}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              {/* Fare Total */}
                              <div className="text-right">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Fare</div>
                                <div className="font-display font-extrabold text-2xl text-slate-900 leading-none">
                                  {offer.pricing?.currency === 'INR' ? '₹' : '$'}{offer.pricing?.total?.toLocaleString()}
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleShortlist(offer)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    isShortlisted
                                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                  title="Add to comparison tray"
                                >
                                  {isShortlisted ? '✓ Shortlisted' : '+ Compare'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSaveOffer(offer)}
                                  className={`p-2 rounded-xl border transition-all ${
                                    isSaved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                                  }`}
                                  title="Save to My Journey"
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                                >
                                  <span>Details</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ================= EXPANDABLE SEGMENTS DRAWER ================= */}
                          {isExpanded && (
                            <div className="pt-4 border-t border-slate-200 space-y-4 animate-slide-up text-xs bg-slate-50/70 p-4 rounded-xl">
                              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                                Segment-by-Segment Flight Breakdown
                              </h4>

                              <div className="space-y-3">
                                {offer.segments?.map((seg, sIdx) => (
                                  <div key={seg.id} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between text-slate-700 font-semibold">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">Leg {sIdx + 1}: {seg.airline} ({seg.flightNumber})</span>
                                        <span className="text-[11px] text-slate-400 font-normal">· {seg.aircraft}</span>
                                      </div>
                                      <span className="text-slate-500 font-mono text-[11px]">{seg.duration}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-slate-600 pt-1">
                                      <div>
                                        <div className="font-bold text-slate-800">{seg.origin} ({seg.departureTerminal ? `Terminal ${seg.departureTerminal}` : 'Main'})</div>
                                        <div className="text-[11px] text-slate-500">
                                          {new Date(seg.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {seg.originAirport?.city}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-slate-800">{seg.destination} ({seg.arrivalTerminal ? `Terminal ${seg.arrivalTerminal}` : 'Main'})</div>
                                        <div className="text-[11px] text-slate-500">
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
                              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                                  <span>Live Airspace Assessment:</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                  {offer.aviationRisk?.evidence}
                                </p>
                              </div>

                              {/* Booking & Search Offer Disclaimer */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                <p className="text-[11px] text-slate-400">
                                  * Live search offer verified via GDS. Final fare confirmed upon booking.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/flight/${offer.flightNumber}`)}
                                    className="btn-secondary text-xs py-1.5 px-3"
                                  >
                                    Track Flight
                                  </button>
                                  {offer.bookingUrl && (
                                    <a
                                      href={offer.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Head-to-Head Flight Comparison ({shortlist.length} selected)
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
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

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setShortlist([])}
                className="text-xs text-rose-600 hover:underline font-bold"
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
