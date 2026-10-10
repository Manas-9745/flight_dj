import { useEffect, useRef } from 'react'
import { Radio, AlertTriangle } from 'lucide-react'

// If Mapbox token is configured, renders a live radar map.
// Otherwise renders a clean styled fallback.
export default function RadarMap({ position, flightNumber }) {
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
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [position.longitude, position.latitude],
      zoom: 5,
    })
    mapRef.current = map

    map.on('load', () => {
      // Aircraft marker
      const el = document.createElement('div')
      el.className = 'aircraft-marker'
      el.style.cssText = `
        width: 36px; height: 36px;
        background: rgba(14,165,233,0.2);
        border: 2px solid rgba(14,165,233,0.8);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${position.heading || 0}deg);
        cursor: pointer;
        box-shadow: 0 0 16px rgba(14,165,233,0.5);
      `
      el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#38bdf8"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`

      new mapboxgl.Marker(el)
        .setLngLat([position.longitude, position.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: 'mapbox-popup-dark' }).setHTML(`
            <div style="font-family:Inter,sans-serif;color:#e2e8f0;background:#0c1425;padding:8px;border-radius:8px;">
              <div style="color:#38bdf8;font-weight:700;font-size:14px;">${flightNumber}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
                ${position.latitude?.toFixed(4)}°N, ${position.longitude?.toFixed(4)}°E<br/>
                Alt: ${position.altitude?.toLocaleString()} ft · ${position.velocityKts} kts
              </div>
            </div>
          `)
        )
        .addTo(map)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [position, MAPBOX_TOKEN])

  if (!position?.available) {
    return (
      <div className="card flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
          <Radio className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="text-slate-300 font-semibold mb-1">Live Radar Tracking Unavailable</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          {position?.message || 'ADS-B telemetry is not currently active for this flight. It may be on the ground or not yet airborne.'}
        </p>
      </div>
    )
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm font-semibold">Live Position Data</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Latitude',  value: `${position.latitude?.toFixed(4)}°` },
            { label: 'Longitude', value: `${position.longitude?.toFixed(4)}°` },
            { label: 'Altitude',  value: `${position.altitude?.toLocaleString()} ft` },
            { label: 'Speed',     value: `${position.velocityKts} kts` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-slate-500 text-xs mb-1">{label}</div>
              <div className="text-sky-400 font-display font-bold">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-600">Add VITE_MAPBOX_TOKEN to .env for interactive map</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-sm font-semibold">Live Radar Tracking</span>
        <span className="ml-auto text-slate-500 text-xs">
          {position.source} · Heading {position.heading}°
        </span>
      </div>
      <div ref={mapContainerRef} style={{ height: '360px', width: '100%' }} />
    </div>
  )
}
