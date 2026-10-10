import { useEffect, useRef, useState } from 'react'
import { Radio, AlertTriangle, RefreshCw, MapPin, Gauge, Navigation } from 'lucide-react'

export default function RadarMap({ position, flightNumber, onRefresh }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!position?.available || !MAPBOX_TOKEN) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [position.longitude, position.latitude],
        zoom: 5,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        // Aircraft marker
        const el = document.createElement('div')
        el.className = 'aircraft-marker'
        el.style.cssText = `
          width: 38px; height: 38px;
          background: rgba(37,99,235,0.15);
          border: 2px solid rgba(37,99,235,0.8);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transform: rotate(${position.heading || 0}deg);
          cursor: pointer;
        `
        el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#2563EB"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`

        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: false,
          className: 'aeromate-popup'
        }).setHTML(`
          <div style="font-family:Inter,sans-serif;padding:10px 14px;min-width:180px">
            <div style="font-weight:700;font-size:14px;color:#172B4D;margin-bottom:4px">${flightNumber}</div>
            <div style="font-size:11px;color:#64748B">
              ${position.latitude?.toFixed(4)}°N, ${position.longitude?.toFixed(4)}°E<br/>
              Alt: ${position.altitude?.toLocaleString()} ft &nbsp;·&nbsp; ${position.velocityKts} kts<br/>
              Heading: ${position.heading}°
            </div>
            <div style="font-size:10px;color:#94A3B8;margin-top:6px;padding-top:6px;border-top:1px solid #F1F5F9">
              ${position.source || 'OpenSky Network'}
            </div>
          </div>
        `)

        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([position.longitude, position.latitude])
          .setPopup(popup)
          .addTo(map)
      })
    } else {
      // Update existing marker position
      if (markerRef.current) {
        markerRef.current.setLngLat([position.longitude, position.latitude])
        mapRef.current.flyTo({ center: [position.longitude, position.latitude], speed: 0.8 })
      }
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [position, MAPBOX_TOKEN, flightNumber])

  // Position unavailable state
  if (!position?.available) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center mb-4">
          <Radio className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="font-display font-semibold text-navy-700 mb-1">Live Radar Unavailable</h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          {position?.message || 'ADS-B telemetry is not currently active for this flight. It may be on the ground or not yet airborne.'}
        </p>
        {onRefresh && (
          <button onClick={onRefresh} className="btn-secondary mt-4 text-sm flex items-center gap-2 py-2 px-4">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>
    )
  }

  // No Mapbox token — show coordinate data instead
  if (!MAPBOX_TOKEN) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-sm font-semibold text-teal-600">Live Position Data</span>
          <span className="ml-auto text-xs text-slate-400">{position.source}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MapPin,    label: 'Latitude',  value: `${position.latitude?.toFixed(4)}°` },
            { icon: MapPin,    label: 'Longitude', value: `${position.longitude?.toFixed(4)}°` },
            { icon: Gauge,     label: 'Altitude',  value: `${position.altitude?.toLocaleString()} ft` },
            { icon: Navigation, label: 'Speed',   value: `${position.velocityKts} kts` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface-50 border border-surface-200 rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-brand-400 mx-auto mb-1" />
              <div className="text-slate-500 text-xs mb-1">{label}</div>
              <div className="text-navy-700 font-display font-bold text-sm">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Add <code className="bg-surface-100 px-1 rounded">VITE_MAPBOX_TOKEN</code> to <code className="bg-surface-100 px-1 rounded">.env</code> for interactive map
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-200">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        <span className="text-sm font-semibold text-teal-600">Live Radar Tracking</span>
        <span className="ml-auto text-xs text-slate-400">
          {position.source} · Heading {position.heading}° · {position.velocityKts} kts
        </span>
        {onRefresh && (
          <button onClick={onRefresh} className="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-surface-100 transition-all" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div ref={mapContainerRef} style={{ height: '360px', width: '100%' }} />
    </div>
  )
}
