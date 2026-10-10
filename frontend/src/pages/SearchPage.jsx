import { useState, useMemo } from 'react'
import {
  Search, Plane, Loader2, AlertCircle, SlidersHorizontal,
  ArrowUpDown, Zap, DollarSign, Clock, ShieldCheck, Tag
} from 'lucide-react'
import { searchFlights } from '../services/api'
import { FlightOfferCard } from '../components/FlightCard'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function SearchPage() {
  const [form, setForm] = useState({ origin: 'JFK', destination: 'LHR', date: todayISO(), adults: '1' })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('price') // 'price', 'duration', 'departure'
  const [filterStops, setFilterStops] = useState('all') // 'all', 'direct', 'connecting'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResults(null)
    setLoading(true)
    try {
      const res = await searchFlights(form)
      setResults(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search flights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const getPrice = (f) => {
    if (typeof f?.price === 'number') return f.price
    if (f?.price?.total) return parseFloat(f.price.total)
    if (typeof f?.price === 'string') return parseFloat(f.price)
    return 99999
  }

  const getDurationMinutes = (f) => {
    if (typeof f?.durationMinutes === 'number') return f.durationMinutes
    if (typeof f?.duration === 'string') {
      const h = parseInt((f.duration.match(/(\d+)\s*h/) || [])[1] || '0', 10)
      const m = parseInt((f.duration.match(/(\d+)\s*m/) || [])[1] || '0', 10)
      return (h * 60) + m || 480
    }
    return 480
  }

  // Processed, sorted and filtered flights
  const processedFlights = useMemo(() => {
    if (!results?.data) return []
    let list = [...results.data]

    // Filter by stops
    if (filterStops === 'direct') {
      list = list.filter(f => f.itineraries?.[0]?.segments?.length === 1 || f.stops === 0)
    } else if (filterStops === 'connecting') {
      list = list.filter(f => (f.itineraries?.[0]?.segments?.length || 0) > 1 || f.stops > 0)
    }

    // Sort
    if (sortBy === 'price') {
      list.sort((a, b) => getPrice(a) - getPrice(b))
    } else if (sortBy === 'duration') {
      list.sort((a, b) => getDurationMinutes(a) - getDurationMinutes(b))
    }

    return list
  }, [results, sortBy, filterStops])

  const lowestPriceId = useMemo(() => {
    if (!results?.data || results.data.length === 0) return null
    let min = Infinity
    let id = null
    results.data.forEach(f => {
      const p = getPrice(f)
      if (p < min) { min = p; id = f.id }
    })
    return id
  }, [results])

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-navy-700">Flight Search & Cost Comparison</h1>
          <span className="badge-live">MULTI-GDS METASEARCH</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Search real-time Amadeus airline offers, rank by total fare, and audit connection durations
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-navy-700 mb-1.5 block">From (IATA)</label>
            <input
              id="search-origin"
              type="text"
              maxLength={3}
              placeholder="JFK"
              value={form.origin}
              onChange={set('origin')}
              className="input-field uppercase font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-700 mb-1.5 block">To (IATA)</label>
            <input
              id="search-destination"
              type="text"
              maxLength={3}
              placeholder="LHR"
              value={form.destination}
              onChange={set('destination')}
              className="input-field uppercase font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-700 mb-1.5 block">Departure Date</label>
            <input
              id="search-date"
              type="date"
              value={form.date}
              onChange={set('date')}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-700 mb-1.5 block">Passengers</label>
            <select
              id="search-adults"
              value={form.adults}
              onChange={set('adults')}
              className="input-field"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          id="search-submit"
          disabled={loading}
          className="btn-primary mt-5 flex items-center justify-center gap-2 py-2.5 px-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching Global Airline Inventories...' : 'Search & Compare Fares'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar: Sort & Filter */}
          <div className="bg-white border border-surface-200 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-navy-700">
              <span>{processedFlights.length} Fares Available</span>
              <span className="text-slate-400 font-normal">
                ({form.origin} → {form.destination})
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Stops:</span>
                <select
                  value={filterStops}
                  onChange={e => setFilterStops(e.target.value)}
                  className="bg-surface-50 border border-surface-200 rounded-xl px-2.5 py-1 text-navy-700 font-medium"
                >
                  <option value="all">All Flights</option>
                  <option value="direct">Nonstop Only</option>
                  <option value="connecting">Connecting Only</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-surface-50 border border-surface-200 rounded-xl px-2.5 py-1 text-navy-700 font-medium"
                >
                  <option value="price">Lowest Price First</option>
                  <option value="duration">Shortest Duration</option>
                </select>
              </div>
            </div>
          </div>

          {processedFlights.length === 0 ? (
            <div className="bg-white border border-surface-200 rounded-2xl text-center py-12">
              <Plane className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No flights found matching the selected filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedFlights.map(offer => {
                const isLowest = offer.id === lowestPriceId
                return (
                  <div key={offer.id} className="relative">
                    {isLowest && (
                      <div className="absolute -top-2.5 right-6 z-10 bg-teal-500 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Best Value Fare
                      </div>
                    )}
                    <FlightOfferCard offer={offer} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
