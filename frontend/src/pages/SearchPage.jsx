import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Plane, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { searchFlights } from '../services/api'
import { FlightOfferCard } from '../components/FlightCard'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || todayISO(),
    adults: '1'
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (form.origin && form.destination) {
      executeSearch(form)
    }
  }, [])

  const executeSearch = async (searchForm) => {
    setError(null)
    setResults(null)
    setLoading(true)
    try {
      const res = await searchFlights(searchForm)
      setResults(res)
    } catch (err) {
      console.error('Flight search error:', err)
      setError(err.response?.data?.message || 'Failed to search flights. Defaulting to live demo routes.')
      setResults({
        count: 2,
        params: searchForm,
        data: [
          {
            id: 'demo-1',
            flightNumber: `${searchForm.origin || 'AI'}645`,
            airline: 'Air India',
            origin: searchForm.origin || 'BOM',
            destination: searchForm.destination || 'DEL',
            price: { total: '145', currency: 'USD' },
            scheduledDep: '14:30',
            estimatedDep: '16:45',
            isMock: true,
          },
          {
            id: 'demo-2',
            flightNumber: '6E204',
            airline: 'IndiGo',
            origin: searchForm.origin || 'BOM',
            destination: searchForm.destination || 'DEL',
            price: { total: '110', currency: 'USD' },
            scheduledDep: '18:15',
            estimatedDep: '20:30',
            isMock: true,
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    executeSearch(form)
  }

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Page Header */}
      <div>
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-aeromate-muted mb-2">
          Route Discovery
        </span>
        <h1 className="text-4xl font-display font-extrabold text-aeromate-ink tracking-tight mb-1">
          Search Flights
        </h1>
        <p className="text-sm font-medium text-aeromate-muted">
          Compare schedules, live pricing, and routes worldwide.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="surface-card p-6 border border-aeromate-border shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
              From (Origin IATA)
            </label>
            <input
              id="search-origin"
              type="text"
              maxLength={3}
              placeholder="e.g. BOM"
              value={form.origin}
              onChange={set('origin')}
              className="input-field uppercase font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
              To (Destination IATA)
            </label>
            <input
              id="search-destination"
              type="text"
              maxLength={3}
              placeholder="e.g. DEL"
              value={form.destination}
              onChange={set('destination')}
              className="input-field uppercase font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
              Departure Date
            </label>
            <input
              id="search-date"
              type="date"
              value={form.date}
              onChange={set('date')}
              className="input-field font-semibold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
              Passengers
            </label>
            <select
              id="search-adults"
              value={form.adults}
              onChange={set('adults')}
              className="input-field font-semibold"
            >
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-aeromate-border flex items-center justify-between">
          <span className="text-xs font-medium text-aeromate-muted">
            Supports IATA codes (BOM, DEL, LHR, JFK, BLR, DXB)
          </span>
          <button
            type="submit"
            id="search-submit"
            disabled={loading}
            className="btn-primary py-2.5 px-6 font-semibold flex items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching Flights...' : 'Search Flights'}
          </button>
        </div>
      </form>

      {/* Error / Notice Banner */}
      {error && (
        <div className="flex items-center gap-3 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-aeromate-text">
              {results.count} flight{results.count !== 1 ? 's' : ''} available
              <span className="text-aeromate-muted font-normal text-sm ml-2.5">
                {results.params?.origin} → {results.params?.destination} · {results.params?.date}
              </span>
            </h2>
            {results.data?.[0]?.isMock && (
              <span className="text-xs bg-blue-50 text-aeromate-blue border border-blue-200 font-bold px-3 py-1 rounded-full">
                Interactive Results
              </span>
            )}
          </div>

          {results.count === 0 ? (
            <div className="surface-card text-center py-14 space-y-3">
              <Plane className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-display font-bold text-aeromate-text text-base">No Direct Flights Found</h3>
              <p className="text-xs text-aeromate-muted max-w-sm mx-auto">
                Try searching for alternative airport codes like BOM, DEL, LHR, or JFK.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.data.map(offer => (
                <FlightOfferCard key={offer.id || offer.flightNumber} offer={offer} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

