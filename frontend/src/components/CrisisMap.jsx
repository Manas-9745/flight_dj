import { useState } from 'react'
import { AlertTriangle, ShieldAlert, CloudRain, Flame, Ban, PlaneTakeoff, Info, ExternalLink, Sparkles, MapPin } from 'lucide-react'

export default function CrisisMap({ alerts = [], onSelectAlert }) {
  const [selectedPin, setSelectedPin] = useState(null)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')

  // Categories & symbols mapping
  const CATEGORY_ICONS = {
    conflict: { icon: Flame, color: '#EF4444', bg: 'bg-rose-500', label: 'Armed Conflict' },
    airspace: { icon: Ban, color: '#F59E0B', bg: 'bg-amber-500', label: 'Airspace Restriction' },
    weather: { icon: CloudRain, color: '#3B82F6', bg: 'bg-blue-500', label: 'Severe Weather / Ash' },
    airport_closure: { icon: ShieldAlert, color: '#DC2626', bg: 'bg-red-600', label: 'Airport Closure' },
    strike: { icon: AlertTriangle, color: '#8B5CF6', bg: 'bg-purple-500', label: 'Industrial Action' },
    accident: { icon: PlaneTakeoff, color: '#6B7280', bg: 'bg-gray-500', label: 'Safety Investigation' },
  }

  // Filtered alerts that have verified valid coordinates (excluding null/undefined or (0,0))
  const filteredAlerts = alerts.filter(a => {
    if (!a.coordinates) return false
    const { lat, lng } = a.coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return false
    if (lat === 0 && lng === 0) return false
    if (activeCategoryFilter !== 'all' && a.category !== activeCategoryFilter) return false
    return true
  })

  // Conversion of Lat/Lng to SVG percentage projection (Equirectangular)
  const getCoordinatesPct = (lat, lng) => {
    // Lat: 90 (top 0%) to -60 (bottom 100%)
    // Lng: -180 (left 0%) to 180 (right 100%)
    const x = ((lng + 180) / 360) * 100
    const y = ((90 - lat) / 150) * 100
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)) }
  }

  const handlePinClick = (alert) => {
    setSelectedPin(alert)
    if (onSelectAlert) onSelectAlert(alert)
  }

  return (
    <div className="surface-card p-6 border border-aeromate-border shadow-card space-y-4">
      {/* Top Map Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h3 className="font-display font-bold text-lg text-aeromate-ink">
              Interactive Global Crisis & Airspace Radar
            </h3>
          </div>
          <p className="text-xs text-aeromate-muted mt-0.5">
            Geolocated official advisories, conflict zones, and severe airspace disruptions.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeCategoryFilter === 'all'
                ? 'bg-aeromate-ink text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Incidents ({alerts.length})
          </button>
          {Object.entries(CATEGORY_ICONS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                activeCategoryFilter === key
                  ? 'bg-aeromate-ink text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.bg}`}></span>
              <span>{config.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative w-full h-[420px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {/* Stylized Vector World Map Background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35 object-cover pointer-events-none"
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Continents outlines (Stylized Clean Silhouette) */}
          {/* North America */}
          <path d="M120,80 Q220,70 280,120 Q320,180 250,230 Q180,240 140,180 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* South America */}
          <path d="M260,260 Q340,280 320,380 Q280,440 240,360 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* Europe */}
          <path d="M470,80 Q560,75 580,140 Q520,170 460,150 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* Africa */}
          <path d="M480,180 Q580,170 600,280 Q550,380 470,260 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* Asia */}
          <path d="M580,80 Q840,70 880,200 Q780,290 620,200 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* Australia */}
          <path d="M780,320 Q880,310 870,400 Q790,410 770,360 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
        </svg>

        {/* Global Airspace Flight Corridors Overlay (Indicative dashed lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path d="M 180 140 Q 520 70 820 180" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 500 130 Q 620 200 750 260" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 280 200 Q 480 240 580 320" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>

        {/* Geolocated Alert Pins with Pulsing Radar Rings */}
        {filteredAlerts.map((alert) => {
          const { x, y } = getCoordinatesPct(alert.coordinates.lat, alert.coordinates.lng)
          const isSelected = selectedPin?.id === alert.id
          const cat = CATEGORY_ICONS[alert.category] || CATEGORY_ICONS.airspace
          const IconComp = cat.icon

          return (
            <div
              key={alert.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => handlePinClick(alert)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
            >
              {/* Radar Pulse Effect */}
              {alert.severity === 'CRITICAL' && (
                <span className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none"></span>
              )}
              {alert.severity === 'WARNING' && (
                <span className="absolute -inset-2.5 rounded-full bg-amber-500/25 animate-pulse pointer-events-none"></span>
              )}

              {/* Marker Bubble */}
              <div
                className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-125 ${
                  isSelected ? 'ring-4 ring-white scale-125 z-30' : ''
                } ${cat.bg}`}
              >
                <IconComp className="w-4 h-4 text-white" />
              </div>

              {/* Hover Badge */}
              <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                <div className="bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700 shadow-xl max-w-xs truncate">
                  <span className="font-bold text-amber-400">[{alert.severity}]</span> {alert.headline}
                </div>
                <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
              </div>
            </div>
          )
        })}

        {/* Selected Incident Drawer / Popover inside the Map */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-2xl z-30 animate-slide-up text-slate-900">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${CATEGORY_ICONS[selectedPin.category]?.bg || 'bg-amber-500'}`}></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedPin.affectedRegion} · {selectedPin.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
              {selectedPin.headline}
            </h4>

            <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
              {selectedPin.summary}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate font-medium">Source: {selectedPin.source.name}</span>
              {selectedPin.source.url && (
                <a
                  href={selectedPin.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  Official Link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onSelectAlert && onSelectAlert(selectedPin)}
                className="w-full btn-primary text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                View AI Impact Analysis
              </button>
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 space-y-1 hidden sm:block pointer-events-none">
          <div className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">Incident Symbols</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Armed Conflict / War
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Airspace Closure / SFAR
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Ash / Severe Met Hazard
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> ATC Strike / Walkout
          </div>
        </div>

        {/* Disclaimer Note at Bottom Left */}
        <div className="absolute bottom-2 left-3 text-[10px] text-slate-400/80 hidden lg:block pointer-events-none">
          * Pin locations reflect official advisory centroids. Exact flight trajectories are determined by operating airlines.
        </div>
      </div>
    </div>
  )
}
