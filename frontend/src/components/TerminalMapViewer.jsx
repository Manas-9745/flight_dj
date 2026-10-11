import React, { useState } from 'react'
import {
  MapPin,
  Compass,
  Layers,
  Clock,
  ExternalLink,
  ShieldCheck,
  Plane,
  Luggage,
  Users,
  Coffee,
  Info,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Eye,
  Footprints
} from 'lucide-react'

export default function TerminalMapViewer({
  terminalDetails,
  flight,
  currentStep,
  nextStep,
  onSelectStepFacility,
  language = 'en'
}) {
  const isHi = language === 'hi'
  const levels = terminalDetails?.levels || []
  const zones = terminalDetails?.zones || []
  const hasIndoorData = terminalDetails?.indoorDataAvailable

  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0)
  const [selectedZoneId, setSelectedZoneId] = useState(currentStep?.facilityId || null)

  const activeLevel = levels[selectedLevelIdx] || levels[0] || {
    level: 'Departures Level',
    name: 'Main Concourse',
    desc: 'Terminal departures hall and passenger gates.'
  }

  // Zone icon mapping
  const getZoneIcon = (id) => {
    switch (id) {
      case 'entry':
        return ShieldCheck
      case 'checkin':
        return Users
      case 'bagdrop':
        return Luggage
      case 'security':
        return ShieldCheck
      case 'immigration':
      case 'arrival_immigration':
        return Compass
      case 'lounges':
        return Coffee
      case 'gates':
        return Plane
      case 'baggage_claim':
        return Luggage
      case 'customs_exit':
        return Navigation
      default:
        return MapPin
    }
  }

  // Active step coordinates or zone highlight
  const currentCoords = currentStep?.coords || { x: 50, y: 50 }
  const nextCoords = nextStep?.coords || null

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-card overflow-hidden text-left space-y-0 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-[#FAFAF7] border-b border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1A1A1A] text-white">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {hasIndoorData
                ? (isHi ? 'प्रमाणित टर्मिनल लेआउट' : 'Verified Facility Map')
                : (isHi ? 'मानक एयरपोर्ट लेआउट' : 'Standard Airport Layout [Demo Mode]')}
            </span>
            {hasIndoorData ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isHi ? 'सत्यापित इनडोर डेटा' : 'Verified Facility-Level Coordinates'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <Info className="w-3.5 h-3.5" />
                {isHi ? 'जनरल गाइड' : 'General Guidance (No Live BLE Beacon)'}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0D0D0D]">
            {terminalDetails?.name || `Terminal ${flight?.terminal || '1'}`}
          </h3>
          <p className="text-xs sm:text-sm text-[#52524E] mt-0.5">
            {flight?.navigatingAirport?.name || flight?.navigatingAirportCode} ({flight?.navigatingAirportCode}) • {flight?.navigatingAirport?.city}
            {flight?.isArrival ? ` (Arrival Terminal)` : ` (Departure Terminal)`}
          </p>
        </div>

        {/* Official Airport Map Link (Requirement 4) */}
        {terminalDetails?.officialMapUrl && (
          <a
            href={terminalDetails.officialMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] text-[#1A1A1A] text-xs sm:text-sm font-semibold hover:bg-[#F5F5F0] hover:border-[#1A1A1A] transition-all shadow-xs self-start sm:self-auto"
          >
            <span>{isHi ? 'आधिकारिक एयरपोर्ट नक्शा खोलें' : 'Official Airport Web Map'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </a>
        )}
      </div>

      {/* Level Selector Tabs */}
      {levels.length > 0 && (
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-[#E5E5E0] bg-[#FFFFFF] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-semibold text-[#8C8C85] uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            {isHi ? 'लेवल / मंजिल:' : 'Terminal Level:'}
          </span>
          {levels.map((lvl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedLevelIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                selectedLevelIdx === idx
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F5F5F0] text-[#4A4A45] hover:bg-[#ECECE6] hover:text-[#0D0D0D]'
              }`}
            >
              {lvl.level}
            </button>
          ))}
        </div>
      )}

      {/* Active Level Detail Card */}
      {activeLevel && (
        <div className="px-5 sm:px-6 py-3 bg-[#FAF9F5] border-b border-[#E5E5E0] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <span className="font-bold text-[#0D0D0D]">{activeLevel.name}</span>
              <span className="text-[#6B6B6B] ml-2 hidden sm:inline">— {activeLevel.desc}</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#8C8C85] bg-white px-2.5 py-0.5 rounded-lg border border-[#E5E5E0] shrink-0 font-mono">
            {activeLevel.level}
          </span>
        </div>
      )}

      {/* Interactive 2D Visual Map Schematic Canvas (Requirement 3 & 5) */}
      <div className="p-5 sm:p-6 bg-[#F5F5F0]/60 border-b border-[#E5E5E0]">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            {isHi ? 'इंटरैक्टिव इनडोर टर्मिनल मैप' : 'Interactive Facility Route Map'}
          </span>
          <span className="text-[11px] text-[#6B6B6B]">
            {currentStep ? (
              <span className="text-[#0D0D0D] font-semibold">
                Pinpoint: {currentStep.facilityName} ({currentStep.floorLevel || activeLevel.level})
              </span>
            ) : null}
          </span>
        </div>

        {/* 2D Canvas Schematic with Waypoints and Route Vector */}
        <div className="relative w-full h-[280px] sm:h-[340px] bg-white rounded-2xl border border-[#E5E5E0] overflow-hidden shadow-inner flex items-center justify-center select-none">
          
          {/* Subtle architectural grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#E5E5E0_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

          {/* SVG Connecting Route Path between Current Step and Next Step */}
          {nextCoords && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <line
                x1={`${currentCoords.x}%`}
                y1={`${currentCoords.y}%`}
                x2={`${nextCoords.x}%`}
                y2={`${nextCoords.y}%`}
                stroke="url(#routeGradient)"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Facility Waypoint Markers plotted by coordinates */}
          {zones.map((zone) => {
            const coords = zone.coords || { x: 50, y: 50 }
            const isCurrent = currentStep?.facilityId === zone.id
            const isNext = nextStep?.facilityId === zone.id
            const isSelected = selectedZoneId === zone.id
            const IconComp = getZoneIcon(zone.id)

            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-300 ${
                  isCurrent ? 'scale-125 z-30' : isNext ? 'scale-110 z-25' : 'hover:scale-110'
                }`}
                title={zone.name}
              >
                {/* Ping pulse for current location */}
                {isCurrent && (
                  <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
                )}

                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shadow-md border transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-white ring-4 ring-blue-500/20'
                    : isNext
                    ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-500/20'
                    : isSelected
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-[#D5D5D0] hover:border-[#1A1A1A]'
                }`}>
                  <IconComp className="w-4 h-4" />
                </div>

                {/* Floating label pill */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shadow-xs pointer-events-none ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isNext
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/90 text-[#0D0D0D] border border-[#E5E5E0] backdrop-blur-xs'
                }`}>
                  {isCurrent ? `★ ${zone.name}` : zone.name}
                </div>
              </div>
            )
          })}

          {/* Map Overlay Bottom Legend */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px]">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E5E5E0] shadow-xs pointer-events-auto">
              <span className="flex items-center gap-1 font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Current Step
              </span>
              {nextStep && (
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Next Target
                </span>
              )}
              <span className="text-[#8C8C85] hidden sm:inline">• Terminal Floor Schematic</span>
            </div>

            {currentStep?.distanceMeters > 0 && (
              <div className="bg-[#1A1A1A] text-white px-3 py-1.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-amber-400" />
                <span>~{currentStep.distanceMeters}m ({currentStep.walkingTimeMins}m walk)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Zones Detail List */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            {isHi ? 'टर्मिनल इनडोर मार्ग व प्रमुख क्षेत्र' : 'Terminal Wayfinding Waypoints & Zones'}
          </h4>
          <span className="text-xs text-[#8C8C85]">
            {zones.length} {isHi ? 'सत्यापित क्षेत्र' : 'zones mapped'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((zone) => {
            const IconComp = getZoneIcon(zone.id)
            const isSelected = selectedZoneId === zone.id
            const isCurrent = currentStep?.facilityId === zone.id
            const isFlightGateZone = zone.id === 'gates' && flight?.gate
            const isFlightCounterZone = zone.id === 'checkin' && flight?.checkinCounter

            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-600'
                    : isSelected
                    ? 'border-[#1A1A1A] bg-[#FAFAF7] shadow-sm ring-1 ring-[#1A1A1A]'
                    : 'border-[#E5E5E0] bg-white hover:border-[#C5C5BF] hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F0] text-[#1A1A1A]'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#0D0D0D]">{zone.name}</h5>
                      <span className="text-[10px] text-[#8C8C85] font-semibold">{zone.level || zone.floor || 'Main Hall'}</span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                      Current
                    </span>
                  )}
                  {isFlightGateZone && !isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Gate {flight.gate}
                    </span>
                  )}
                  {isFlightCounterZone && !isFlightGateZone && !isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Active Desks
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#52524E] line-clamp-2 leading-relaxed">
                  {zone.landmarks}
                </p>

                {isSelected && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E5E0] flex items-center justify-between text-[11px] text-[#1A1A1A] font-semibold">
                    <span className="text-blue-600">
                      Floor: {zone.floor || 'Level 4'} • Coords verified
                    </span>
                    <span className="text-[#8C8C85]">
                      Click to close
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
