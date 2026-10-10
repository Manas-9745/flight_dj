import { useEffect, useRef } from 'react'
import { Radio, Plane, ShieldCheck, Navigation } from 'lucide-react'

// If Mapbox token is configured, renders a live light-themed radar map.
// Otherwise renders a clean SVG radar graphic fallback.
export default function RadarMap({ position, flightNumber = 'AI645' }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!position?.available || !MAPBOX_TOKEN) return
    if (mapRef.current) return // Already mounted

    let mapboxgl
    try {
      mapboxgl = window.mapboxgl
      if (!mapboxgl) return
    } catch { return }

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [position.longitude || 72.8777, position.latitude || 19.0760],
      zoom: 6,
    })
    mapRef.current = map

    map.on('load', () => {
      // Aircraft marker
      const el = document.createElement('div')
      el.className = 'aircraft-marker'
      el.style.cssText = `
        width: 40px; height: 40px;
        background: rgba(36,107,253,0.12);
        border: 2px solid #246BFD;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${position.heading || 45}deg);
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(36,107,253,0.3);
      `
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#246BFD"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`

      new mapboxgl.Marker(el)
        .setLngLat([position.longitude, position.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family:Inter,sans-serif;color:#172B45;background:#FFFFFF;padding:10px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
              <div style="color:#246BFD;font-weight:700;font-size:14px;">${flightNumber}</div>
              <div style="font-size:12px;color:#63748A;margin-top:4px;">
                ${position.latitude?.toFixed(4)}°N, ${position.longitude?.toFixed(4)}°E<br/>
                Alt: ${position.altitude?.toLocaleString()} ft · ${position.velocityKts} kts
              </div>
            </div>
          `)
        )
        .addTo(map)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [position, MAPBOX_TOKEN, flightNumber])

  const lat = position?.latitude || 19.0760
  const lon = position?.longitude || 72.8777
  const alt = position?.altitude || 32000
  const speed = position?.velocityKts || 460
  const heading = position?.heading || 65

  return (
    <div className="surface-card p-0 overflow-hidden border border-slate-200 shadow-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-aeromate-text text-sm font-bold font-display">Live Radar Tracking</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            {position?.available ? 'ADS-B Signal Live' : 'Active Route Simulation'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-aeromate-muted font-medium">
          <Navigation className="w-3.5 h-3.5 text-aeromate-blue" />
          <span>Heading {heading}°</span>
        </div>
      </div>

      {/* Interactive / Graphical Radar Surface */}
      {MAPBOX_TOKEN && position?.available ? (
        <div ref={mapContainerRef} style={{ height: '340px', width: '100%' }} />
      ) : (
        <div className="relative h-[340px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-6 flex flex-col justify-between overflow-hidden">
          {/* Circular Radar Sweep Effect */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-[320px] h-[320px] rounded-full border border-blue-300 flex items-center justify-center">
              <div className="w-[220px] h-[220px] rounded-full border border-blue-200 flex items-center justify-center">
                <div className="w-[120px] h-[120px] rounded-full border border-blue-200" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-spin duration-7000" style={{ transformOrigin: 'center center' }} />
          </div>

          {/* Air Route Canvas Visual */}
          <div className="relative z-10 flex items-center justify-between my-auto px-4">
            {/* Origin Node */}
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm text-center min-w-[110px]">
              <span className="text-xs font-bold text-aeromate-muted uppercase tracking-wider">Departure</span>
              <div className="font-display font-black text-2xl text-aeromate-text mt-0.5">BOM</div>
              <span className="text-[11px] text-slate-500 font-medium">Mumbai</span>
            </div>

            {/* Flight Arc & Plane */}
            <div className="flex-1 mx-6 relative flex flex-col items-center">
              <svg className="w-full h-16 overflow-visible" viewBox="0 0 200 40">
                <path d="M 10 35 Q 100 0 190 35" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 10 35 Q 100 0 130 18" fill="none" stroke="#246BFD" strokeWidth="3" />
              </svg>

              <div 
                className="absolute top-2 w-9 h-9 rounded-full bg-aeromate-blue text-white shadow-lg shadow-aeromate-blue/30 flex items-center justify-center transition-all animate-float"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                <Plane className="w-5 h-5" />
              </div>

              <div className="mt-2 text-center">
                <span className="bg-white/90 text-aeromate-blue font-bold text-xs px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                  {flightNumber} · {speed} kts
                </span>
              </div>
            </div>

            {/* Destination Node */}
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm text-center min-w-[110px]">
              <span className="text-xs font-bold text-aeromate-muted uppercase tracking-wider">Arrival</span>
              <div className="font-display font-black text-2xl text-aeromate-text mt-0.5">DEL</div>
              <span className="text-[11px] text-slate-500 font-medium">Delhi</span>
            </div>
          </div>

          {/* Telemetry Metrics Bar */}
          <div className="relative z-10 grid grid-cols-4 gap-3 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Latitude</div>
              <div className="text-xs font-bold text-aeromate-text font-mono mt-0.5">{lat.toFixed(4)}°N</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Longitude</div>
              <div className="text-xs font-bold text-aeromate-text font-mono mt-0.5">{lon.toFixed(4)}°E</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Altitude</div>
              <div className="text-xs font-bold text-aeromate-blue font-mono mt-0.5">{alt.toLocaleString()} ft</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ground Speed</div>
              <div className="text-xs font-bold text-aeromate-blue font-mono mt-0.5">{speed} kts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

