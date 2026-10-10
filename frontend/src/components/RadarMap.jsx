import { useEffect, useRef, useMemo } from 'react'
import { Radio, Plane, ShieldCheck, Navigation, MapPin } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { GLOBAL_AIRPORTS } from '../data/airportsData'

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

export default function RadarMap({
  position,
  flightNumber = 'AI645',
  origin = 'BOM',
  destination = 'DEL'
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  // Resolve verified geographic coordinates for origin and destination
  const origAirport = useMemo(() => {
    const code = (origin || position?.originAirport?.iata || position?.departure?.iata || position?.origin || 'LHR').toUpperCase()
    const found = GLOBAL_AIRPORTS.find(a => a.iata === code)
    const directLat = position?.originAirport?.lat ?? position?.departure?.lat
    const directLng = position?.originAirport?.lng ?? position?.departure?.lng
    return {
      iata: code,
      city: found?.city || position?.originAirport?.city || position?.departure?.airport || code,
      name: found?.name || position?.originAirport?.name || position?.departure?.airport || `${code} Airport`,
      country: found?.country || 'International',
      lat: (typeof directLat === 'number' && directLat !== 0) ? directLat : (found?.lat ?? 51.4700),
      lng: (typeof directLng === 'number' && directLng !== 0) ? directLng : (found?.lng ?? -0.4543)
    }
  }, [origin, position])

  const destAirport = useMemo(() => {
    const code = (destination || position?.destinationAirport?.iata || position?.arrival?.iata || position?.destination || 'JFK').toUpperCase()
    const found = GLOBAL_AIRPORTS.find(a => a.iata === code)
    const directLat = position?.destinationAirport?.lat ?? position?.arrival?.lat
    const directLng = position?.destinationAirport?.lng ?? position?.arrival?.lng
    return {
      iata: code,
      city: found?.city || position?.destinationAirport?.city || position?.arrival?.airport || code,
      name: found?.name || position?.destinationAirport?.name || position?.arrival?.airport || `${code} Airport`,
      country: found?.country || 'International',
      lat: (typeof directLat === 'number' && directLat !== 0) ? directLat : (found?.lat ?? 40.6413),
      lng: (typeof directLng === 'number' && directLng !== 0) ? directLng : (found?.lng ?? -73.7781)
    }
  }, [destination, position])

  // Accurate aircraft coordinates (live telemetry or calculated along route)
  const lat = position?.latitude ?? ((origAirport.lat + destAirport.lat) / 2)
  const lon = position?.longitude ?? ((origAirport.lng + destAirport.lng) / 2)
  const alt = position?.altitude || 32000
  const speed = position?.velocityKts || 460
  const heading = position?.heading || 65
  const isLive = Boolean(position?.isLive && position?.available)

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return // Already mounted

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/light-v11' : FREE_MAP_STYLE,
      center: [lon, lat],
      zoom: 4,
    })
    mapRef.current = map

    map.on('load', () => {
      // 1. Origin Airport Marker
      const originEl = document.createElement('div')
      originEl.className = 'origin-pin'
      originEl.style.cssText = `
        background: #1A1A1A; color: white; padding: 4px 8px;
        border-radius: 8px; font-weight: bold; font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-family: monospace;
      `
      originEl.innerText = origAirport.iata
      new mapboxgl.Marker(originEl)
        .setLngLat([origAirport.lng, origAirport.lat])
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`<strong>${origAirport.name}</strong><br/>${origAirport.city}, ${origAirport.country}`))
        .addTo(map)

      // 2. Destination Airport Marker
      const destEl = document.createElement('div')
      destEl.className = 'dest-pin'
      destEl.style.cssText = `
        background: #246BFD; color: white; padding: 4px 8px;
        border-radius: 8px; font-weight: bold; font-size: 11px;
        box-shadow: 0 2px 8px rgba(36,107,253,0.3); font-family: monospace;
      `
      destEl.innerText = destAirport.iata
      new mapboxgl.Marker(destEl)
        .setLngLat([destAirport.lng, destAirport.lat])
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`<strong>${destAirport.name}</strong><br/>${destAirport.city}, ${destAirport.country}`))
        .addTo(map)

      // 3. Aircraft Marker
      const planeEl = document.createElement('div')
      planeEl.className = 'aircraft-marker'
      planeEl.style.cssText = `
        width: 38px; height: 38px;
        background: rgba(36,107,253,0.15);
        border: 2px solid #246BFD;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${heading}deg);
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(36,107,253,0.35);
      `
      planeEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#246BFD"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`

      new mapboxgl.Marker(planeEl)
        .setLngLat([lon, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family:Inter,sans-serif;color:#0D0D0D;background:#FFFFFF;padding:8px;border-radius:8px;">
              <div style="font-weight:700;font-size:13px;color:#246BFD;">${flightNumber}</div>
              <div style="font-size:11px;color:#52524E;margin-top:2px;">
                ${origAirport.iata} → ${destAirport.iata}<br/>
                Alt: ${alt.toLocaleString()} ft · ${speed} kts
              </div>
            </div>
          `)
        )
        .addTo(map)

      // 4. Flight Route GeoJSON Line
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [origAirport.lng, origAirport.lat],
              [lon, lat],
              [destAirport.lng, destAirport.lat]
            ]
          }
        }
      })

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#246BFD',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      })

      // Adjust camera bounds to fit origin, destination and aircraft
      const bounds = new mapboxgl.LngLatBounds()
        .extend([origAirport.lng, origAirport.lat])
        .extend([destAirport.lng, destAirport.lat])
        .extend([lon, lat])

      map.fitBounds(bounds, { padding: 50, maxZoom: 8 })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [MAPBOX_TOKEN, origAirport, destAirport, lon, lat, heading, flightNumber, alt, speed])

  return (
    <div className="surface-card p-0 overflow-hidden border border-[#E5E5E0] shadow-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFAF7] border-b border-[#E5E5E0]">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <span className="text-[#0D0D0D] text-sm font-semibold font-display">Flight Radar</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            isLive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-[#E5E5E0] text-[#52524E] border-[#D5D5D0]'
          }`}>
            {isLive ? 'Live Radar' : 'Flight Path'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#52524E] font-medium">
          <Navigation className="w-3.5 h-3.5 text-[#246BFD]" />
          <span>Heading {heading}°</span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div ref={mapContainerRef} className="w-full bg-[#f8f9fa]" style={{ height: '340px' }} />

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 border-t border-[#E5E5E0]">
        <div className="text-center">
          <div className="text-[10px] uppercase font-bold text-[#8C8C85]">Latitude</div>
          <div className="text-xs font-bold text-[#0D0D0D] font-mono mt-0.5">{lat.toFixed(4)}°</div>
        </div>
        <div className="text-center border-l border-[#E5E5E0]">
          <div className="text-[10px] uppercase font-bold text-[#8C8C85]">Longitude</div>
          <div className="text-xs font-bold text-[#0D0D0D] font-mono mt-0.5">{lon.toFixed(4)}°</div>
        </div>
        <div className="text-center border-l border-[#E5E5E0]">
          <div className="text-[10px] uppercase font-bold text-[#8C8C85]">Altitude</div>
          <div className="text-xs font-bold text-[#246BFD] font-mono mt-0.5">{alt.toLocaleString()} ft</div>
        </div>
        <div className="text-center border-l border-[#E5E5E0]">
          <div className="text-[10px] uppercase font-bold text-[#8C8C85]">Airspeed</div>
          <div className="text-xs font-bold text-[#246BFD] font-mono mt-0.5">{speed} kts</div>
        </div>
      </div>
    </div>
  )
}
