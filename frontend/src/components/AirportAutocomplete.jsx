import { useState, useEffect, useRef } from 'react'
import { MapPin, Plane, Loader2 } from 'lucide-react'
import { searchAirports } from '../services/api'

export default function AirportAutocomplete({
  label = 'Airport',
  placeholder = 'City or IATA (e.g. BOM, London, JFK)',
  value = '',
  onChange,
  id = 'airport-input',
  required = false
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  // Debounced airport search
  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setSuggestions([])
      return
    }

    // If query is already a 3-letter uppercase match, we can still fetch options
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchAirports(query)
        if (res?.airports) {
          setSuggestions(res.airports)
        }
      } catch (err) {
        console.error('Failed to search airports:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (airport) => {
    setQuery(airport.iata)
    onChange(airport.iata, airport)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="text-xs font-bold text-aeromate-muted mb-1.5 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value.toUpperCase()
            setQuery(val)
            onChange(val, null)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="input-field pl-10 font-mono font-bold tracking-wider"
          maxLength={20}
          required={required}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto animate-slide-up">
          {suggestions.map((ap) => (
            <button
              key={ap.iata}
              type="button"
              onClick={() => handleSelect(ap)}
              className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {ap.iata}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {ap.city}, {ap.country}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {ap.name}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {ap.iata}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
