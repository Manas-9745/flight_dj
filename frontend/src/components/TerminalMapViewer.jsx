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
  CheckCircle2
} from 'lucide-react'

export default function TerminalMapViewer({
  terminalDetails,
  flight,
  currentStep,
  language = 'en'
}) {
  const isHi = language === 'hi'
  const levels = terminalDetails?.levels || []
  const zones = terminalDetails?.zones || []
  const hasIndoorData = terminalDetails?.indoorDataAvailable

  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0)
  const [selectedZoneId, setSelectedZoneId] = useState(null)

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
        return Compass
      case 'lounges':
        return Coffee
      case 'gates':
        return Plane
      default:
        return MapPin
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-[#FAFAF7] border-b border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1A1A1A] text-white">
              <Compass className="w-3.5 h-3.5" />
              {hasIndoorData
                ? (isHi ? 'प्रमाणित टर्मिनल लेआउट' : 'Verified Terminal Architecture')
                : (isHi ? 'मानक एयरपोर्ट लेआउट' : 'Standard Airport Navigation')}
            </span>
            {hasIndoorData && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {isHi ? 'सत्यापित इनडोर डेटा' : 'Indoor Zones Verified'}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-xl text-[#0D0D0D]">
            {terminalDetails?.name || `Terminal ${flight?.terminal || '1'}`}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            {flight?.originAirport?.name || flight?.origin} ({flight?.origin}) • {flight?.originAirport?.city || ''}
          </p>
        </div>

        {/* Official Airport Map Link */}
        {terminalDetails?.officialMapUrl && (
          <a
            href={terminalDetails.officialMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D5D5D0] text-[#1A1A1A] text-xs sm:text-sm font-semibold hover:bg-[#F5F5F0] hover:border-[#1A1A1A] transition-all shadow-xs self-start sm:self-auto"
          >
            <span>{isHi ? 'आधिकारिक एयरपोर्ट नक्शा खोलें' : 'Official Airport Map'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </a>
        )}
      </div>

      {/* Level Selector Tabs */}
      {levels.length > 0 && (
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-[#E5E5E0] bg-[#FFFFFF] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-semibold text-[#8C8C85] uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            {isHi ? 'लेवल:' : 'Level:'}
          </span>
          {levels.map((lvl, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedLevelIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
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
        <div className="px-5 sm:px-6 py-3.5 bg-[#FAF9F5] border-b border-[#E5E5E0] flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <span className="font-bold text-[#0D0D0D]">{activeLevel.name}</span>
              <span className="text-[#6B6B6B] ml-2 hidden sm:inline">— {activeLevel.desc}</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#8C8C85] bg-white px-2 py-0.5 rounded border border-[#E5E5E0] shrink-0">
            {activeLevel.level}
          </span>
        </div>
      )}

      {/* Terminal Visual Schematic & Zones Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Visual Wayfinding Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
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
              const isFlightGateZone = zone.id === 'gates' && flight?.gate
              const isFlightCounterZone = zone.id === 'checkin' && flight?.checkinCounter

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? 'border-[#1A1A1A] bg-[#FAFAF7] shadow-sm ring-1 ring-[#1A1A1A]'
                      : 'border-[#E5E5E0] bg-white hover:border-[#C5C5BF] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#1A1A1A] text-white' : 'bg-[#F5F5F0] text-[#1A1A1A]'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-sm text-[#0D0D0D]">{zone.name}</h5>
                    </div>
                    {isFlightGateZone && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Gate {flight.gate}
                      </span>
                    )}
                    {isFlightCounterZone && !isFlightGateZone && (
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
                        {isHi ? 'स्थान विवरण देखा जा रहा है' : 'Active waypoint inspected'}
                      </span>
                      <span className="text-[#8C8C85]">
                        {isHi ? 'क्लिक करके बंद करें' : 'Click to close'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Turn-by-turn Navigation Corridor Walkthrough */}
        <div className="bg-[#FAF9F5] rounded-xl p-4 sm:p-5 border border-[#E5E5E0]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            {isHi ? 'अनुशंसित इनडोर पैदल मार्ग' : 'Recommended Indoor Corridor Progression'}
          </h4>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
            {/* Step 1: Curbside */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-[#E5E5E0]">
              <div className="flex items-center gap-1.5 font-bold text-[#0D0D0D] mb-1">
                <span className="w-4 h-4 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px]">1</span>
                {isHi ? 'कर्बसाइड ड्रॉप-ऑफ' : 'Departures Drop-off'}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                {flight?.terminal ? `Terminal ${flight.terminal} Pillars` : 'Terminal Curbside'}
              </p>
            </div>

            <div className="hidden sm:flex text-[#C5C5BF]">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 2: Check-in & Bag Drop */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-[#E5E5E0]">
              <div className="flex items-center gap-1.5 font-bold text-[#0D0D0D] mb-1">
                <span className="w-4 h-4 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px]">2</span>
                {isHi ? 'चेक-इन / बैग ड्रॉप' : 'Check-in Island'}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                {flight?.checkinCounter || 'Airline Desks'}
              </p>
            </div>

            <div className="hidden sm:flex text-[#C5C5BF]">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 3: Security & Immigration */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-[#E5E5E0]">
              <div className="flex items-center gap-1.5 font-bold text-[#0D0D0D] mb-1">
                <span className="w-4 h-4 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px]">3</span>
                {flight?.isDomestic ? (isHi ? 'सुरक्षा जांच' : 'Security Hold') : (isHi ? 'इमिग्रेशन व सुरक्षा' : 'Security & Passport')}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                {flight?.isDomestic ? 'Domestic Checkpoint' : 'International Wings'}
              </p>
            </div>

            <div className="hidden sm:flex text-[#C5C5BF]">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 4: Gate */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-[#E5E5E0]">
              <div className="flex items-center gap-1.5 font-bold text-[#0D0D0D] mb-1">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                {isHi ? 'बोर्डिंग गेट' : 'Boarding Gate'}
              </div>
              <p className="text-[11px] font-semibold text-blue-700">
                {flight?.gate ? `Gate ${flight.gate}` : (isHi ? 'FIDS पर देखें' : 'Check FIDS')}
              </p>
            </div>
          </div>
        </div>

        {/* Airport Reality Notice */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">
              {isHi ? 'सटीक इनडोर नेविगेशन सूचना:' : 'Airport Wayfinding Protocol:'}
            </span>{' '}
            {isHi
              ? 'टर्मिनल गेट असाइनमेंट और काउंटर संचालन अंतिम समय में बदल सकते हैं। हमेशा टर्मिनल डिस्प्ले बोर्ड (FIDS) और साइनेज का पालन करें।'
              : 'Indoor wayfinding landmarks and level data are verified against airport layouts. Gate assignments and counter desks are subject to live airport operational changes. Always cross-check terminal FIDS screens before departure.'}
          </div>
        </div>
      </div>
    </div>
  )
}
