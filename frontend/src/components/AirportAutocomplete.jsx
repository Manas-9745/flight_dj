import { useState, useEffect, useRef, useMemo } from 'react'
import { MapPin, Plane, Loader2, Check, X, Search, Sparkles } from 'lucide-react'
import { searchAirports } from '../services/api'
import { searchLocalAirports, POPULAR_AIRPORTS, GLOBAL_AIRPORTS } from '../data/airportsData'

export default function AirportAutocomplete({
  label = 'Airport',
  placeholder = 'City or IATA (e.g. BOM, London, JFK)',
  value = '',
  onChange,
  id = 'airport-input',
  required = false
}) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [remoteAirports, setRemoteAirports] = useState([])
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Keep internal query synchronized with external value
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Instant local suggestions based on current query
  const localSuggestions = useMemo(() => {
    const q = (query || '').trim()
    if (!q) {
      return POPULAR_AIRPORTS.map(p => {
        const full = GLOBAL_AIRPORTS.find(g => g.iata === p.iata)
        return full || { ...p, name: `${p.city} International Airport` }
      })
    }
    return searchLocalAirports(q)
  }, [query])

  // Combined suggestions (local instant + remote)
  const suggestions = useMemo(() => {
    const combined = [...localSuggestions]
    remoteAirports.forEach(remote => {
      if (!combined.some(c => c.iata === remote.iata)) {
        combined.push(remote)
      }
    })
    return combined.slice(0, 8)
  }, [localSuggestions, remoteAirports])

  // Debounced remote API search as enhancement
  useEffect(() => {
    const trimmed = (query || '').trim()
    if (!trimmed) {
      setRemoteAirports([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchAirports(trimmed)
        if (res?.airports && Array.isArray(res.airports)) {
          setRemoteAirports(res.airports)
        }
      } catch {
        // Silently rely on local instant dataset
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Currently selected airport object
  const currentSelectedAirport = useMemo(() => {
    const upper = (value || '').toUpperCase()
    return GLOBAL_AIRPORTS.find(a => a.iata === upper) || null
  }, [value])

  const handleSelect = (airport) => {
    setQuery(airport.iata)
    onChange(airport.iata, airport)
    setIsOpen(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, suggestions.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setQuery('')
    onChange('', null)
    if (inputRef.current) inputRef.current.focus()
    setIsOpen(true)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="block text-[13px] font-medium text-[#383835] leading-none">
          {label}
        </label>
        {currentSelectedAirport && (
          <span className="text-xs font-medium text-[#246BFD] truncate max-w-[180px] leading-none">
            {currentSelectedAirport.city}
          </span>
        )}
      </div>

      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C85] pointer-events-none" />
        
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value.toUpperCase()
            setQuery(val)
            onChange(val, null)
            setIsOpen(true)
            setSelectedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-12 bg-[#FAFAF7] border border-[#E5E5E0] hover:border-[#1A1A1A]/40 focus:border-[#1A1A1A] focus:bg-white rounded-xl pl-10 pr-9 font-mono font-bold text-sm text-[#0D0D0D] tracking-wider outline-none transition-all"
          maxLength={25}
          required={required}
          autoComplete="off"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-[#246BFD] animate-spin" />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#8C8C85] hover:text-[#0D0D0D] p-0.5 rounded-full"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Auto Suggestion Dropdown List with Checkboxes */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E5E5E0] shadow-xl z-50 overflow-hidden animate-slide-up max-h-80 flex flex-col">
          
          {/* Header Bar */}
          <div className="px-4 py-2 bg-[#FAFAF7] border-b border-[#E5E5E0] flex items-center justify-between text-[11px] text-[#6B6B6B]">
            <span className="font-semibold text-[#0D0D0D] flex items-center gap-1.5">
              <Search className="w-3 h-3 text-[#246BFD]" />
              {query.trim() ? `Airports matching "${query}"` : 'Popular Destinations'}
            </span>
            <span className="text-[10px]">Click or check to select</span>
          </div>

          {/* Popular Quick Chips if query is short */}
          {(!query || query.length <= 1) && (
            <div className="px-3 py-2 bg-white border-b border-[#E5E5E0] flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#8C8C85] font-semibold mr-1">Quick:</span>
              {POPULAR_AIRPORTS.slice(0, 6).map((pop) => (
                <button
                  key={pop.iata}
                  type="button"
                  onClick={() => {
                    const full = GLOBAL_AIRPORTS.find(g => g.iata === pop.iata) || pop
                    handleSelect(full)
                  }}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border ${
                    value === pop.iata
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-[#FAFAF7] text-[#0D0D0D] border-[#E5E5E0] hover:bg-[#EAEAE5]'
                  }`}
                >
                  {pop.iata} ({pop.city})
                </button>
              ))}
            </div>
          )}

          {/* Suggestion Items with Checkboxes */}
          <div className="overflow-y-auto divide-y divide-[#F0F0EB]">
            {suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6B6B6B]">
                No matching airports found for "{query}". You can still enter your 3-letter IATA code directly.
              </div>
            ) : (
              suggestions.map((ap, index) => {
                const isSelected = value === ap.iata
                const isHighlighted = index === selectedIndex

                return (
                  <button
                    key={ap.iata}
                    type="button"
                    onClick={() => handleSelect(ap)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      isHighlighted
                        ? 'bg-[#FAFAF7]'
                        : 'hover:bg-[#FAFAF7]'
                    } ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Checkbox Icon */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]'
                        : 'border border-[#C5C5BF] bg-white group-hover:border-[#1A1A1A]'
                    }`}>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : null}
                    </div>

                    {/* IATA Code Pill */}
                    <div className="w-11 h-7 rounded-lg bg-[#FAFAF7] border border-[#E5E5E0] text-[#0D0D0D] flex items-center justify-center font-bold font-mono text-xs flex-shrink-0">
                      {ap.iata}
                    </div>

                    {/* City & Airport Full Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0D0D0D] truncate">
                          {ap.city}, {ap.country}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] truncate">
                        {ap.name || `${ap.city} Airport`}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
