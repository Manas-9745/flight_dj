import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, Layers, Compass, ArrowUpRight,
  Radio, X, ChevronRight, SlidersHorizontal, MapPin, Gauge
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getLiveFlights } from '../services/api'

// High-definition basemap tile configurations
const MAP_THEMES = {
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  dark: {
    name: 'Dark Radar',
    icon: '🌑',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
        }
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  light: {
    name: 'Daylight',
    icon: '🗺️',
    style: {
      version: 8,
      sources: {
        'carto-voyager': {
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
          id: 'carto-voyager-layer',
          type: 'raster',
          source: 'carto-voyager',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  }
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
  const [activeTheme, setActiveTheme] = useState('satellite') // default to rich satellite terrain
  const [showDrawer, setShowDrawer] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const res = await getLiveFlights()
      const list = res.flights || res.data || []
      setFlights(list)
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setError(null)
    } catch (err) {
      console.error('Failed to load live flights:', err)
      setError('Live ADS-B feed connection busy. Displaying active aviation corridor snapshot.')
    } finally {
      setLoading(false)
    }
  }

  // Polling every 120 seconds (2 minutes) to preserve free credits
  useEffect(() => {
    fetchFlights()
    const timer = setInterval(fetchFlights, 120000)
    return () => clearInterval(timer)
  }, [])

  // Initialize or re-theme map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
    }

    const themeConfig = MAP_THEMES[activeTheme] || MAP_THEMES.satellite
    const initialStyle = MAPBOX_TOKEN && activeTheme === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : themeConfig.style

    if (!mapRef.current) {
      // Center directly on Indian subcontinent & Middle East corridor (like Flightradar24 view)
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [75.5, 21.0],
        zoom: 4.3,
      })
      mapRef.current = map
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right')
    } else {
      mapRef.current.setStyle(initialStyle)
    }
  }, [activeTheme, MAPBOX_TOKEN])

  // Plot Flightradar24-style yellow airplane markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    flights.forEach(f => {
      if (typeof f.latitude !== 'number' || typeof f.longitude !== 'number' || isNaN(f.latitude) || isNaN(f.longitude)) return
      if (f.latitude === 0 && f.longitude === 0) return

      const isSelected = selectedFlight?.callsign && selectedFlight.callsign === f.callsign
      const planeColor = isSelected ? '#38BDF8' : '#FFE600' // vibrant Flightradar24 yellow, cyan if selected
      const planeSize = isSelected ? 26 : 22

      const el = document.createElement('div')
      el.className = 'fr24-aircraft-marker'
      el.style.cssText = `
        width: ${planeSize}px;
        height: ${planeSize}px;
        cursor: pointer;
        transform: rotate(${f.heading || 0}deg);
        transition: transform 0.3s ease, filter 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${isSelected ? 50 : 10};
      `

      // Pure Flightradar24 aircraft SVG silhouette with clean black outline and realistic drop shadow
      el.innerHTML = `
        <svg width="${planeSize}" height="${planeSize}" viewBox="0 0 24 24" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.85));">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="${planeColor}"
                stroke="#000000"
                stroke-width="0.75"
                stroke-linejoin="round" />
        </svg>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedFlight(f)
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [f.longitude, f.latitude], zoom: Math.max(mapRef.current.getZoom(), 6), speed: 1.2 })
        }
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([f.longitude, f.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(`
            <div style="font-family:Inter,sans-serif;padding:3px 5px;background:#0F172A;color:#FFFFFF;border-radius:6px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 12px rgba(0,0,0,0.4);">
              <div style="font-weight:800;color:#FFE600;font-size:12px;letter-spacing:0.5px;">${f.callsign || 'AIRCRAFT'}</div>
              <div style="font-size:10px;color:#94A3B8;margin-top:1px;">${f.airline || f.originCountry || 'Commercial'}</div>
              <div style="font-size:10px;color:#E2E8F0;margin-top:2px;font-family:monospace;">
                ${f.altitude ? f.altitude.toLocaleString() + ' FT' : 'GND'} · ${f.velocityKts || 0} KTS
              </div>
            </div>
          `)
        )
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })
  }, [flights, selectedFlight])

  const filteredFlights = flights.filter(f => {
    const q = searchTerm.toUpperCase()
    const country = f.originCountry || f.origin_country || ''
    const airline = f.airline || ''
    return !q || (f.callsign && f.callsign.includes(q)) || country.toUpperCase().includes(q) || airline.toUpperCase().includes(q)
  })

  // Quick region jumpers
  const focusRegion = (coords, zoom) => {
    if (!mapRef.current) return
    mapRef.current.flyTo({ center: coords, zoom, speed: 1.4 })
  }

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[640px] bg-slate-950 overflow-hidden font-sans">
      {/* ── 1. Full-screen Interactive Map Canvas ── */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* ── 2. Flightradar24-Inspired Top Floating Search & Region Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Quick Region Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-xl pointer-events-auto">
          <button
            onClick={() => focusRegion([76.5, 21.0], 4.5)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
            title="Focus Indian Subcontinent & Arabian Sea"
          >
            <span>🇮🇳</span>
            <span className="hidden sm:inline">India & Gulf</span>
          </button>
          <button
            onClick={() => focusRegion([54.0, 24.5], 5.0)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
            title="Focus Middle East Hubs"
          >
            <span>🇦🇪</span>
            <span className="hidden sm:inline">Middle East</span>
          </button>
          <button
            onClick={() => focusRegion([15.0, 48.0], 4.2)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
            title="Focus Europe Corridor"
          >
            <span>🇪🇺</span>
            <span className="hidden sm:inline">Europe</span>
          </button>
          <button
            onClick={() => focusRegion([20.0, 30.0], 2.2)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
            title="Global World View"
          >
            <span>🌍</span>
            <span className="hidden sm:inline">World</span>
          </button>
        </div>

        {/* Center: Flight Search Pill */}
        <div className="flex-1 max-w-md mx-auto pointer-events-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search flight (e.g. AIC645, BA142, Emirates)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-full text-xs text-white placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Basemap Switcher & Flight Count Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Basemap Toggle */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-xl">
            {Object.entries(MAP_THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setActiveTheme(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  activeTheme === key
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                <span className="hidden md:inline">{t.name}</span>
              </button>
            ))}
          </div>

          {/* Aircraft Counter Pill */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl flex items-center gap-2 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-amber-400 font-mono font-bold">{filteredFlights.length}</span>
            <span className="hidden sm:inline text-slate-300">Live ADS-B</span>
          </div>

          {/* Drawer Toggle */}
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="bg-slate-900/90 backdrop-blur-md p-2 rounded-full border border-white/15 text-white hover:bg-slate-800 shadow-xl transition"
            title="Toggle Flights List"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* ── 3. Selected Flight Inspector Card (Flightradar24 Drawer) ── */}
      {selectedFlight && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-30 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-white shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center font-display text-base shadow-sm">
                ✈️
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white tracking-wide">
                  {selectedFlight.callsign || 'N/A'}
                </h3>
                <p className="text-[11px] text-slate-400">{selectedFlight.airline || selectedFlight.originCountry || 'Commercial Airliner'}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFlight(null)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs transition"
            >
              ✕
            </button>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-3 gap-2 bg-black/40 rounded-xl p-3 border border-white/10 text-center text-xs font-mono mb-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Altitude</div>
              <div className="text-amber-400 font-bold text-sm mt-0.5">
                {selectedFlight.altitude ? `${Math.round(selectedFlight.altitude).toLocaleString()} ft` : 'Ground'}
              </div>
            </div>
            <div className="border-l border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Airspeed</div>
              <div className="text-white font-bold text-sm mt-0.5">
                {selectedFlight.velocityKts ? `${Math.round(selectedFlight.velocityKts)} kts` : '—'}
              </div>
            </div>
            <div className="border-l border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Track</div>
              <div className="text-white font-bold text-sm mt-0.5">
                {selectedFlight.heading ? `${Math.round(selectedFlight.heading)}°` : '0°'}
              </div>
            </div>
          </div>

          {/* Coordinates & Actions */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
            <span>Lat: {selectedFlight.latitude?.toFixed(4)}°</span>
            <span>Lon: {selectedFlight.longitude?.toFixed(4)}°</span>
            <span>Origin: {selectedFlight.originCountry || 'International'}</span>
          </div>

          <button
            onClick={() => navigate(`/flight/${selectedFlight.callsign}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg"
          >
            <span>Inspect Full Flight & Radar Route</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 4. Slide-out Flight List Drawer (Right Side) ── */}
      {showDrawer && (
        <div className="absolute top-20 right-4 bottom-6 w-80 z-20 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-fade-in">
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/30">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Airspace Radar Feed</span>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="p-2.5 bg-black/20 border-b border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredFlights.length} flights</span>
            <span>Updated {lastRefreshed || 'live'}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredFlights.map((f, i) => (
              <div
                key={f.callsign || i}
                onClick={() => {
                  setSelectedFlight(f)
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [f.longitude, f.latitude], zoom: 6 })
                  }
                }}
                className={`p-3 text-xs flex items-center justify-between cursor-pointer transition ${
                  selectedFlight?.callsign === f.callsign
                    ? 'bg-amber-400/20 border-l-2 border-amber-400'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">✈</span>
                  <div>
                    <div className="font-bold text-white font-mono">{f.callsign || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400">{f.airline || f.originCountry}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-amber-300 text-[11px] font-semibold">{f.altitude ? `${Math.round(f.altitude / 1000)}k ft` : 'GND'}</div>
                  <div className="text-[10px] text-slate-400">{f.velocityKts || 0} kts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Bottom Brand Watermark & 120s Cache Indicator ── */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-slate-300 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>AeroMate Global ADS-B Radar</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">120s Telemetry Cache</span>
      </div>
    </div>
  )
}
