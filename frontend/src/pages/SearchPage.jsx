import { useState } from 'react'
import { Search, Plane, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react'
import { searchFlights } from '../services/api'
import { FlightOfferCard } from '../components/FlightCard'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function SearchPage() {
  const [form, setForm] = useState({ origin: '', destination: '', date: todayISO(), adults: '1' })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Flight Search</h1>
        <p className="text-slate-400">Find available flights powered by Amadeus.</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">From (IATA)</label>
            <input
              id="search-origin"
              type="text"
              maxLength={3}
              placeholder="JFK"
              value={form.origin}
              onChange={set('origin')}
              className="input-field uppercase"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">To (IATA)</label>
            <input
              id="search-destination"
              type="text"
              maxLength={3}
              placeholder="LHR"
              value={form.destination}
              onChange={set('destination')}
              className="input-field uppercase"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Departure Date</label>
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
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Passengers</label>
            <select
              id="search-adults"
              value={form.adults}
              onChange={set('adults')}
              className="input-field"
            >
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n} style={{ background: '#0c1425' }}>{n} Adult{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          id="search-submit"
          disabled={loading}
          className="btn-primary mt-5 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white">
              {results.count} flight{results.count !== 1 ? 's' : ''} found
              <span className="text-slate-500 font-normal text-sm ml-2">
                {results.params?.origin} → {results.params?.destination} · {results.params?.date}
              </span>
            </h2>
            {results.data?.[0]?.isMock && (
              <span className="text-xs text-sky-500/60 border border-sky-500/20 px-2 py-1 rounded-full">
                Demo Data
              </span>
            )}
          </div>

          {results.count === 0 ? (
            <div className="card text-center py-12">
              <Plane className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No flights found for this route and date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.data.map(offer => (
                <FlightOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
