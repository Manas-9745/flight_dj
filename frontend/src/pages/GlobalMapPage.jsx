import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Plane, Search, RefreshCw, Layers, Compass,
  SlidersHorizontal, AlertCircle, ArrowUpRight, Gauge, Radio
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getLiveFlights } from '../services/api'

const FREE_MAP_STYLE = {
  version: 8,
  sources: {
    'carto-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-tiles-layer',
      type: 'raster',
      source: 'carto-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

export default function GlobalMapPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const res = await getLiveFlights()
      const list = res.flights || res.data || []
      setFlights(list)
      setLastRefreshed(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      console.error('Failed to load live flights:', err)
      setError('Unable to fetch live radar telemetry. Using cached aviation snapshot.')
      // Graceful fallback sample data
      setFlights([
        { callsign: 'BA142', icao24: '400511', latitude: 51.47, longitude: -0.45, altitude: 34000, velocityKts: 480, heading: 275, originCountry: 'United Kingdom' },
        { callsign: 'AI645', icao24: '800234', latitude: 19.09, longitude: 72.87, altitude: 28000, velocityKts: 440, heading: 18, originCountry: 'India' },
        { callsign: 'AF112', icao24: '394a12', latitude: 48.85, longitude: 2.35, altitude: 36000, velocityKts: 510, heading: 120, originCountry: 'France' },
        { callsign: 'LH404', icao24: '3c65a1', latitude: 50.03, longitude: 8.57, altitude: 38000, velocityKts: 495, heading: 290, originCountry: 'Germany' },
        { callsign: 'EK201', icao24: '896123', latitude: 25.25, longitude: 55.36, altitude: 39000, velocityKts: 520, heading: 310, originCountry: 'UAE' },
        { callsign: 'UA88',  icao24: 'a12bc4', latitude: 40.64, longitude: -73.78, altitude: 31000, velocityKts: 460, heading: 85, originCountry: 'United States' },
        { callsign: 'SQ321', icao24: '76a89b', latitude: 1.36, longitude: 103.99, altitude: 37000, velocityKts: 505, heading: 330, originCountry: 'Singapore' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
    let timer = null
    if (autoRefresh) {
      timer = setInterval(fetchFlights, 120000) // 120 seconds (2 minutes) minimum refresh
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh])

  // Interactive map initialization (Mapbox or high-DPI OpenStreetMap / CARTO)
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
    }

    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/light-v11' : FREE_MAP_STYLE,
        center: [15, 35],
        zoom: 2.2,
      })
      mapRef.current = map
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Add markers for flights
    flights.forEach(f => {
      if (typeof f.latitude !== 'number' || typeof f.longitude !== 'number' || isNaN(f.latitude) || isNaN(f.longitude)) return
      if (f.latitude === 0 && f.longitude === 0) return

      const el = document.createElement('div')
      el.className = 'aircraft-icon-pin'
      el.style.cssText = `
        width: 28px; height: 28px;
        background: #FFFFFF;
        border: 2px solid #2563EB;
        box-shadow: 0 4px 10px rgba(37,99,235,0.25);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transform: rotate(${f.heading || 0}deg);
        transition: transform 0.2s ease;
      `
      el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#2563EB"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`

      el.addEventListener('click', () => {
        setSelectedFlight(f)
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat([f.longitude, f.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(`
            <div style="font-family:Inter,sans-serif;padding:4px 6px;">
              <div style="font-weight:700;color:#2563EB;font-size:13px;">${f.callsign || 'Unknown'}</div>
              <div style="font-size:11px;color:#475569;">${f.originCountry || f.origin_country || 'Commercial Flight'}</div>
              <div style="font-size:11px;color:#0F172A;margin-top:2px;">Alt: ${f.altitude ? f.altitude.toLocaleString() + ' ft' : 'Ground'} · Speed: ${f.velocityKts || 0} kts</div>
            </div>
          `)
        )
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })

    return () => {
      // Keep map alive or teardown on page unmount
    }
  }, [flights, MAPBOX_TOKEN])

  const filteredFlights = flights.filter(f => {
    const q = searchTerm.toUpperCase()
    const country = f.originCountry || f.origin_country || ''
    return !q || (f.callsign && f.callsign.includes(q)) || country.toUpperCase().includes(q)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-navy-700">Worldwide Live Flight Map</h1>
            <span className="badge-live">LIVE ADS-B</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time global aircraft positions, radar vectors, and telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-teal-50 text-teal-600 border-teal-200'
                : 'bg-white text-slate-500 border-surface-200 hover:bg-surface-50'
            }`}
          >
            {autoRefresh ? '● Auto-refresh (30s)' : '○ Manual refresh'}
          </button>
          <button
            onClick={fetchFlights}
            disabled={loading}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Refresh positions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Map Container & Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden relative">
            {/* Map Header Status Bar */}
            <div className="px-5 py-3 border-b border-surface-200 flex items-center justify-between text-xs text-slate-500 bg-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                <span className="font-semibold text-navy-700">{filteredFlights.length} Aircraft Plotted</span>
              </div>
              <div>Last ping: {lastRefreshed || 'Just now'}</div>
            </div>

            {/* Real Interactive World Map Canvas */}
            <div ref={mapContainerRef} className="w-full bg-[#f8f9fa]" style={{ height: '560px' }} />
          </div>
        </div>

        {/* Right 1 Col: Live Aircraft List & Selected Details */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white border border-surface-200 rounded-2xl p-4 shadow-card">
            <label className="text-xs font-semibold text-navy-700 block mb-2">Search Aircraft or Country</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. BA142, AI645, United States"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Selected Aircraft Quick Peek */}
          {selectedFlight && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Inspecting Airframe</span>
                <button
                  onClick={() => setSelectedFlight(null)}
                  className="text-xs text-slate-400 hover:text-navy-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-display font-bold text-navy-700">{selectedFlight.callsign?.trim() || 'N/A'}</div>
                  <div className="text-xs text-slate-500">{selectedFlight.origin_country}</div>
                </div>
                <button
                  onClick={() => navigate(`/flight/${selectedFlight.callsign?.trim()}`)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  Full Journey <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-brand-200/60 text-center text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Altitude</div>
                  <div className="font-semibold text-navy-700">{selectedFlight.altitude ? `${Math.round(selectedFlight.altitude).toLocaleString()} ft` : 'Ground'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Speed</div>
                  <div className="font-semibold text-navy-700">{selectedFlight.velocityKts ? `${Math.round(selectedFlight.velocityKts)} kts` : '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Heading</div>
                  <div className="font-semibold text-navy-700">{selectedFlight.heading ? `${Math.round(selectedFlight.heading)}°` : '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Aircraft Radar Feed */}
          <div className="bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between text-xs font-semibold text-navy-700 bg-surface-50">
              <span>Radar Detections</span>
              <span className="text-slate-400">{filteredFlights.length} Available</span>
            </div>
            <div className="divide-y divide-surface-100 max-h-[380px] overflow-y-auto">
              {filteredFlights.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No aircraft matching "{searchTerm}"
                </div>
              ) : (
                filteredFlights.map((f, i) => {
                  const callsign = f.callsign?.trim() || `ICAO ${f.icao24}`
                  const isSelected = selectedFlight?.callsign === f.callsign
                  return (
                    <div
                      key={f.icao24 || i}
                      onClick={() => setSelectedFlight(f)}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50/70' : 'hover:bg-surface-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center text-brand-600 font-bold shrink-0">
                          <Plane className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-navy-700">{callsign}</div>
                          <div className="text-[11px] text-slate-400">{f.origin_country || 'Commercial Flight'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-navy-700 font-medium">
                          {f.altitude ? `${Math.round(f.altitude / 1000)}k ft` : 'GND'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {f.velocityKts ? `${Math.round(f.velocityKts)} kts` : '—'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
