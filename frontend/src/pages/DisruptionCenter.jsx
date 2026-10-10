import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  Plane,
  ArrowRight,
  ShieldCheck,
  Building,
  Car,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  ExternalLink,
  ChevronRight,
  Sliders,
  DollarSign,
  AlertOctagon,
  FileText,
  History,
  Check,
  Calculator,
  Compass,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Info
} from 'lucide-react'
import {
  getDisruptionMonitoring,
  findAlternativeFlights,
  getDisruptionImpact,
  proposeItineraryRecovery,
  applyItineraryUpdate,
  dismissDisruptionAlert,
  getDisruptionHotelRecommendations
} from '../services/api'

export default function DisruptionCenter({ token }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Active Tab: 'impact' | 'alternatives' | 'recovery' | 'hotels' | 'rights'
  const [activeTab, setActiveTab] = useState('impact')

  // Monitoring State
  const [monitoredTrips, setMonitoredTrips] = useState([])
  const [activeDisruptionsCount, setActiveDisruptionsCount] = useState(0)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [loadingMonitoring, setLoadingMonitoring] = useState(true)
  const [monitoringError, setMonitoringError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  // Impact Engine State
  const [impactData, setImpactData] = useState(null)
  const [loadingImpact, setLoadingImpact] = useState(false)

  // Alternatives Engine State
  const [alternativesData, setAlternativesData] = useState(null)
  const [selectedAlternative, setSelectedAlternative] = useState(null)
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)

  // Hotel Recommendations State
  const [hotelData, setHotelData] = useState(null)
  const [loadingHotels, setLoadingHotels] = useState(false)
  const [hotelNights, setHotelNights] = useState(1)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [hotelFilters, setHotelFilters] = useState({
    sortBy: 'distance', // 'distance' | 'price_low' | 'rating'
    hasShuttle: false,
    maxPrice: null
  })

  // Proposed Recovery State
  const [proposedItinerary, setProposedItinerary] = useState(null)
  const [loadingProposal, setLoadingProposal] = useState(false)
  const [approvalSubmitting, setApprovalSubmitting] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(null)

  // Dismissed Alert IDs
  const [dismissedAlertsList, setDismissedAlertsList] = useState(new Set())

  // Legal Calculator State
  const [calc, setCalc] = useState({
    region: 'EU261', // 'EU261' | 'DGCA' | 'USDOT'
    delayHours: '3.5',
    isCancelled: false,
    distanceKm: '1800',
  })

  const [estimate, setEstimate] = useState({
    cash: '€400',
    food: 'Full complimentary meals & drinks provided',
    hotel: 'Overnight hotel accommodation if delay extends past midnight',
    rebooking: 'Free alternative flight or 100% full refund within 7 days',
    rule: 'EU Regulation 261/2004 Article 7'
  })

  // 1. Fetch Disruption Monitoring
  const fetchMonitoring = async () => {
    setLoadingMonitoring(true)
    setMonitoringError(null)
    try {
      const res = await getDisruptionMonitoring(token)
      if (res?.data) {
        const trips = res.data.trips || []
        setMonitoredTrips(trips)
        setActiveDisruptionsCount(res.data.activeDisruptionsCount || 0)
        setLastChecked(res.data.timestamp)

        // Select the first disrupted trip or first trip
        const firstDisrupted = trips.find(t => t.isDisrupted && !t.isDismissed) || trips[0] || null
        if (firstDisrupted && !selectedTrip) {
          setSelectedTrip(firstDisrupted)
          loadImpactAndAlternatives(firstDisrupted)
        }
      }
    } catch (err) {
      console.error('Error fetching disruption monitoring:', err)
      setMonitoringError(err.message || 'Failed to poll saved flight status.')
    } finally {
      setLoadingMonitoring(false)
    }
  }

  // Load Impact & Alternatives for a trip
  const loadImpactAndAlternatives = async (trip) => {
    if (!trip) return

    setLoadingImpact(true)
    setLoadingAlternatives(true)
    setApprovalSuccess(null)

    try {
      // 1. Impact Engine
      const impactRes = await getDisruptionImpact({
        tripId: trip.tripId,
        flightNumber: trip.flightNumber,
        delayMinutes: trip.delayMinutes,
        status: trip.status,
        downstreamItems: trip.downstreamItems
      }, token)

      if (impactRes?.data) {
        setImpactData(impactRes.data)
      }

      // 2. Alternatives Search
      const altRes = await findAlternativeFlights({
        origin: trip.origin,
        destination: trip.destination,
        travelDate: trip.travelDate,
        disruptedFlightNumber: trip.flightNumber,
        disruptedAirline: trip.airline,
        delayMinutes: trip.delayMinutes,
        disruptionType: trip.disruptionType
      }, token)

      if (altRes?.data) {
        setAlternativesData(altRes.data)
        const bestAlt = altRes.data.rankedRecommendations?.bestOverallRecovery || altRes.data.alternatives?.[0]
        setSelectedAlternative(bestAlt)

        // Preload proposed itinerary with best alternative
        loadProposedItinerary(trip, bestAlt)
      }

      // 3. Load Contextual Hotel Recommendations
      loadHotelRecommendations(trip, hotelNights, hotelFilters)
    } catch (err) {
      console.error('Error loading impact/alternatives:', err)
    } finally {
      setLoadingImpact(false)
      setLoadingAlternatives(false)
    }
  }

  // Load Hotel Recommendations for Disruption
  const loadHotelRecommendations = async (trip, nights = hotelNights, filters = hotelFilters) => {
    if (!trip) return
    setLoadingHotels(true)
    try {
      const res = await getDisruptionHotelRecommendations({
        trip,
        disruption: trip,
        downstreamItems: trip.downstreamItems,
        nights,
        filters
      }, token)
      if (res?.data) {
        setHotelData(res.data)
      }
    } catch (err) {
      console.error('Error loading hotel recommendations:', err)
    } finally {
      setLoadingHotels(false)
    }
  }

  // Handle Nights Change for Hotels
  const handleNightsChange = (newNights) => {
    const val = parseInt(newNights, 10) || 1
    setHotelNights(val)
    if (selectedTrip) {
      loadHotelRecommendations(selectedTrip, val, hotelFilters)
    }
  }

  // Handle Hotel Filter Change
  const handleHotelFilterChange = (filterKey, value) => {
    const updated = { ...hotelFilters, [filterKey]: value }
    setHotelFilters(updated)
    if (selectedTrip) {
      loadHotelRecommendations(selectedTrip, hotelNights, updated)
    }
  }

  // Trigger Dummy Cancelled Flight and View Available Hotels Demo
  const handleLoadCancelledFlightDemo = (presetOrigin = 'DEL') => {
    const dummyFlight = presetOrigin === 'SXR' ? {
      tripId: 'demo-cancelled-sxr-02',
      alertId: 'alert-sxr-cancelled-02',
      flightNumber: 'AI-826',
      airline: 'Air India',
      origin: 'SXR',
      destination: 'DEL',
      travelDate: new Date().toISOString().split('T')[0],
      status: 'cancelled',
      isDisrupted: true,
      isDismissed: false,
      disruptionType: 'cancellation',
      disruptionReason: 'Severe snowstorm and zero runway visibility grounded departures at Sheikh ul-Alam International Airport, Srinagar (SXR). Passenger stranded.',
      severity: 'CRITICAL',
      source: 'Airport Authority Telemetry (Live Simulation)',
      scheduledDeparture: '16:45',
      scheduledArrival: '18:15',
      estimatedDeparture: 'Cancelled',
      estimatedArrival: 'Cancelled',
      delayMinutes: 0,
      downstreamItems: [
        {
          id: 'downstream-hotel-sxr',
          itemType: 'hotel',
          name: 'The Lalit New Delhi',
          city: 'New Delhi',
          originalSchedule: 'Check-in tonight 19:30',
          revisedSchedule: 'Cannot reach tonight (Stranded in Srinagar)',
          impactLevel: 'CRITICAL',
          reason: 'Flight cancelled; passenger is stranded at Srinagar origin airport.',
          recommendedAction: 'Book nearby emergency accommodation in Srinagar near Dal Lake and request a late check-in hold or date waiver in Delhi.',
          contactPhone: '+91-11-4444-7777',
          contactLink: 'https://thelalit.com',
          knownCost: '$160/night (Deposit at risk)'
        }
      ]
    } : {
      tripId: 'demo-cancelled-del-01',
      alertId: 'alert-del-cancelled-01',
      flightNumber: '6E-204',
      airline: 'IndiGo',
      origin: 'DEL',
      destination: 'DXB',
      travelDate: new Date().toISOString().split('T')[0],
      status: 'cancelled',
      isDisrupted: true,
      isDismissed: false,
      disruptionType: 'cancellation',
      disruptionReason: 'Confirmed flight cancellation due to sudden airspace restrictions and ATC ground stop at Indira Gandhi International Airport (DEL). Passenger stranded before departure.',
      severity: 'CRITICAL',
      source: 'Aviation Telemetry Radar (Live Simulation)',
      scheduledDeparture: '20:30',
      scheduledArrival: '23:05',
      estimatedDeparture: 'Cancelled',
      estimatedArrival: 'Cancelled',
      delayMinutes: 0,
      downstreamItems: [
        {
          id: 'downstream-hotel-del',
          itemType: 'hotel',
          name: 'Grand Hyatt Dubai',
          city: 'Dubai',
          originalSchedule: 'Check-in tonight 23:45',
          revisedSchedule: 'Cannot reach tonight (Stranded in Delhi)',
          impactLevel: 'CRITICAL',
          reason: 'Outbound flight cancelled. Passenger stranded at Delhi Airport; cannot reach booked hotel in Dubai tonight.',
          recommendedAction: 'Book nearby hotel in Delhi Aerocity and request late arrival hold / date waiver for Dubai reservation.',
          contactPhone: '+971-4-317-1234',
          contactLink: 'https://www.hyatt.com',
          knownCost: '$240/night (Deposit at risk if not notified)'
        }
      ]
    };

    // Prepend to monitoredTrips list so it appears in the active feed
    setMonitoredTrips(prev => {
      const filtered = prev.filter(t => t.tripId !== dummyFlight.tripId);
      return [dummyFlight, ...filtered];
    });
    setActiveDisruptionsCount(prev => Math.max(1, prev + 1));
    setSelectedTrip(dummyFlight);

    // Fetch impact, alternatives, and nearby hotels for this flight
    loadImpactAndAlternatives(dummyFlight);

    // Automatically navigate to the Nearby Hotels tab so the user sees the available hotels
    setActiveTab('hotels');
  }

  // Load Proposed Itinerary Recovery
  const loadProposedItinerary = async (trip, alt) => {
    if (!trip || !alt) return
    setLoadingProposal(true)
    try {
      const propRes = await proposeItineraryRecovery({
        originalTrip: trip,
        selectedAlternative: alt,
        downstreamItems: trip.downstreamItems
      }, token)

      if (propRes?.data) {
        setProposedItinerary(propRes.data)
      }
    } catch (err) {
      console.error('Error loading proposed recovery:', err)
    } finally {
      setLoadingProposal(false)
    }
  }

  // Approve Itinerary Update
  const handleApproveItinerary = async () => {
    if (!selectedTrip || !selectedAlternative) return
    setApprovalSubmitting(true)
    try {
      const res = await applyItineraryUpdate({
        tripId: selectedTrip.tripId,
        newFlight: {
          flightNumber: selectedAlternative.flightNumber,
          airline: selectedAlternative.airline,
          departureTime: selectedAlternative.departureTime,
          arrivalTime: selectedAlternative.arrivalTime,
          fareDifference: selectedAlternative.fareDifference,
          previousFlightNumber: selectedTrip.flightNumber
        },
        approvalNote: `User approved itinerary recovery to ${selectedAlternative.airline} ${selectedAlternative.flightNumber} via AeroMate Disruption Manager.`
      }, token)

      if (res?.data?.success) {
        setApprovalSuccess(res.data)
        // Refresh monitoring feed
        fetchMonitoring()
      }
    } catch (err) {
      alert('Error updating itinerary: ' + (err.message || 'Unknown error'))
    } finally {
      setApprovalSubmitting(false)
    }
  }

  // Dismiss Alert
  const handleDismissAlert = async (alertId) => {
    try {
      await dismissDisruptionAlert(alertId, token)
      setDismissedAlertsList(prev => new Set(prev).add(alertId))
      setActiveDisruptionsCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error(e)
    }
  }

  // Rights Calculator handler
  const handleCalculateRights = (e) => {
    e.preventDefault()
    const hours = parseFloat(calc.delayHours)

    if (calc.region === 'EU261') {
      let cashVal = '€250'
      if (hours >= 3) {
        cashVal = parseFloat(calc.distanceKm) > 3500 ? '€600' : parseFloat(calc.distanceKm) > 1500 ? '€400' : '€250'
      } else {
        cashVal = '€0 (Under 3 hours)'
      }
      setEstimate({
        cash: cashVal,
        food: 'Food, refreshments, and 2 free calls/emails required after 2h delay',
        hotel: hours >= 6 ? 'Hotel room + free airport transport required' : 'Not required unless overnight',
        rebooking: calc.isCancelled || hours >= 5 ? 'Choice of full refund or re-routing at earliest opportunity' : 'Standard flight tracking',
        rule: 'EU Regulation 261/2004 Article 7'
      })
    } else if (calc.region === 'DGCA') {
      let cashVal = 'Up to ₹10,000'
      if (calc.isCancelled) cashVal = 'Up to ₹10,000 + 100% refund'
      else if (hours >= 2) cashVal = 'Free meals & refreshments'
      else cashVal = 'No monetary compensation under 2h'

      setEstimate({
        cash: cashVal,
        food: 'Free snacks/meals and water mandatory for delays over 2 hours',
        hotel: hours >= 6 ? 'Hotel accommodation mandatory for night delays (10 PM to 6 AM)' : 'Airport lounge/resting area',
        rebooking: calc.isCancelled ? 'Alternate flight within 2 hours or 100% ticket refund' : 'Next available flight without extra charge',
        rule: 'DGCA Civil Aviation Requirements (CAR) Section 3'
      })
    } else {
      setEstimate({
        cash: calc.isCancelled || hours >= 3 ? '100% Cash Refund (Mandatory under 2024 DOT Rules)' : 'Voucher/Refund if unfulfilled',
        food: 'Vouchers for meals and beverages provided by major US carriers',
        hotel: hours >= 4 ? 'Complimentary hotel stay for overnight cancellations' : 'Varies by airline commitment',
        rebooking: 'Free rebooking on same airline or partner carrier',
        rule: 'US Department of Transportation (DOT) Automatic Refund Rule'
      })
    }
  }

  // Initial load
  useEffect(() => {
    fetchMonitoring()
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-24 pb-20 font-sans text-[#0D0D0D]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>AI Disruption Manager & Whole-Journey Recovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0D0D0D] tracking-tight">
              Disruption Recovery Center
            </h1>
            <p className="text-sm font-medium text-[#52524E] mt-1 max-w-2xl">
              Proactive flight disruption monitoring, multi-airline rebooking alternatives, whole-journey downstream impact analysis (hotels, ground transfers, connecting flights), and user-approved recovery workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleLoadCancelledFlightDemo('DEL')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-sm"
              title="Click to simulate a cancelled flight and immediately view matching nearby demo hotels"
            >
              <AlertOctagon className="w-4 h-4 text-white" />
              <span>Demo: Cancelled Flight & Hotels</span>
            </button>

            <button
              onClick={fetchMonitoring}
              disabled={loadingMonitoring}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAF9F5] hover:border-[#1A1A1A] transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMonitoring ? 'animate-spin text-blue-600' : 'text-[#6B6B6B]'}`} />
              <span>{loadingMonitoring ? 'Checking Telemetry...' : 'Refresh Flight Radar'}</span>
            </button>

            <button
              onClick={() => navigate('/assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Disruption Advisor</span>
            </button>
          </div>
        </div>

        {/* Section 1: Saved Trips Disruption Monitoring Feed */}
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display font-bold text-lg text-[#0D0D0D] flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-600" />
                <span>1. Active Flight Disruption Monitoring Feed</span>
              </h2>
              {activeDisruptionsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                  {activeDisruptionsCount} Disruption Detected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  All Saved Itineraries On-Time
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#8C8C85]">Quick Simulation:</span>
              <button
                onClick={() => handleLoadCancelledFlightDemo('DEL')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition-all flex items-center gap-1.5"
                title="Simulate cancelled flight at Delhi (DEL) and show nearby Aerocity hotels"
              >
                <Building className="w-3 h-3 text-rose-600" />
                <span>Delhi Cancelled (DEL)</span>
              </button>
              <button
                onClick={() => handleLoadCancelledFlightDemo('SXR')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold transition-all flex items-center gap-1.5"
                title="Simulate cancelled flight at Srinagar (SXR) and show nearby Srinagar hotels"
              >
                <Building className="w-3 h-3 text-amber-700" />
                <span>Srinagar Cancelled (SXR)</span>
              </button>
              {lastChecked && (
                <span className="text-[11px] text-[#8C8C85] pl-1">
                  Last checked: {new Date(lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Trip Cards Horizontal Selector */}
          {monitoredTrips.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#8C8C85] bg-[#FAF9F5] rounded-xl border border-dashed border-[#D5D5D0] space-y-3">
              <p>No saved trips found. Search for flights or save an itinerary in My Journeys to enable automated 24/7 disruption monitoring.</p>
              <button
                onClick={() => handleLoadCancelledFlightDemo('DEL')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-xs"
              >
                <Building className="w-3.5 h-3.5 text-white" />
                <span>Load Cancelled Flight & Hotels Demo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {monitoredTrips.map((trip) => {
                const isSelected = selectedTrip?.tripId === trip.tripId
                const isDismissed = dismissedAlertsList.has(trip.alertId) || trip.isDismissed

                return (
                  <div
                    key={trip.tripId}
                    onClick={() => {
                      setSelectedTrip(trip)
                      loadImpactAndAlternatives(trip)
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#FAFAF7] shadow-sm ring-1 ring-[#1A1A1A]'
                        : trip.isDisrupted && !isDismissed
                        ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                        : 'border-[#E5E5E0] bg-white hover:border-[#C5C5BF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-[#0D0D0D]">
                            {trip.flightNumber}
                          </span>
                          <span className="text-xs text-[#6B6B6B]">· {trip.airline}</span>
                        </div>
                        <div className="text-xs text-[#52524E] mt-0.5">
                          {trip.origin} → {trip.destination} · {trip.travelDate}
                        </div>
                      </div>

                      {/* Status Badge */}
                      {trip.isDisrupted && !isDismissed ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {trip.status === 'cancelled' ? 'Cancelled' : `+${trip.delayMinutes}m Delayed`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {trip.status === 'rebooked' ? 'Rebooked ✓' : 'On-Schedule'}
                        </span>
                      )}
                    </div>

                    {/* Disruption detail or schedule */}
                    {trip.isDisrupted && !isDismissed ? (
                      <p className="text-xs text-rose-900 line-clamp-2 leading-relaxed bg-white/80 p-2 rounded-lg border border-rose-200/60 mt-2">
                        <strong>Reason:</strong> {trip.disruptionReason}
                      </p>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-[#6B6B6B] mt-2 pt-2 border-t border-[#E5E5E0]">
                        <span>Dep: {trip.scheduledDeparture}</span>
                        <span>Arr: {trip.scheduledArrival}</span>
                      </div>
                    )}

                    {/* Action footer */}
                    {trip.isDisrupted && !isDismissed && (
                      <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          Action Required <ArrowRight className="w-3 h-3" />
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDismissAlert(trip.alertId)
                          }}
                          className="text-[11px] text-[#8C8C85] hover:text-[#0D0D0D] underline"
                        >
                          Dismiss Alert
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Trip Active Disruption Banner */}
        {selectedTrip && selectedTrip.isDisrupted && !dismissedAlertsList.has(selectedTrip.alertId) && (
          <div className="bg-[#1A1A1A] text-white rounded-2xl p-5 sm:p-7 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white">
                    {selectedTrip.status === 'cancelled' ? 'Confirmed Cancellation' : `Confirmed Delay (${selectedTrip.delayMinutes} mins)`}
                  </span>
                  <span className="text-xs text-white/60">
                    Source: {selectedTrip.source}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                  Disruption on Flight {selectedTrip.flightNumber} ({selectedTrip.origin} → {selectedTrip.destination})
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  {selectedTrip.disruptionReason}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-white/70">
                  <div>
                    Scheduled: <strong className="text-white">{selectedTrip.scheduledDeparture} → {selectedTrip.scheduledArrival}</strong>
                  </div>
                  <div>
                    Estimated: <strong className="text-rose-300">{selectedTrip.estimatedDeparture} → {selectedTrip.estimatedArrival}</strong>
                  </div>
                  <div>
                    Severity Score: <strong className="text-amber-400">{selectedTrip.severity}</strong>
                  </div>
                </div>
              </div>

              {/* Quick Jump Action Buttons */}
              <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('alternatives')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Review Alternative Flights</span>
                </button>

                <button
                  onClick={() => setActiveTab('impact')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Compare Downstream Impact</span>
                </button>

                <button
                  onClick={() => setActiveTab('hotels')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Nearby Hotels ({hotelData?.recommendations?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('recovery')}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#1A1A1A] hover:bg-[#FAF9F5] font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prepare New Itinerary</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Five Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('impact')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'impact'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Whole-Journey Impact Engine</span>
            {impactData?.criticalItemsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {impactData.criticalItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('alternatives')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'alternatives'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Alternative Flight Search</span>
            {alternativesData?.alternatives?.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500 text-white font-bold">
                {alternativesData.alternatives.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hotels')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'hotels'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Nearby Hotels for Your Disruption</span>
            {hotelData?.recommendations?.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {hotelData.recommendations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'recovery'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Proposed Itinerary Recovery</span>
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'rights'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Passenger Rights & Legal Entitlements</span>
          </button>
        </div>

        {/* Tab 1: Whole-Journey Downstream Impact Engine */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            {impactData?.executiveSummary && (
              <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="font-display font-bold text-base text-[#0D0D0D]">
                    AI Whole-Journey Executive Assessment
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#52524E] leading-relaxed">
                  {impactData.executiveSummary}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E5E5E0] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                    <span className="text-[#8C8C85] block">Downstream Items Evaluated</span>
                    <strong className="text-sm text-[#0D0D0D]">{impactData.totalItemsImpacted} Reservations</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-rose-700 block">Critical Risk Conflicts</span>
                    <strong className="text-sm text-rose-900">{impactData.criticalItemsCount} Critical Action Required</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                    <span className="text-[#8C8C85] block">Estimated Downstream Penalty Fees</span>
                    <strong className="text-sm text-[#0D0D0D]">{impactData.estimatedDownstreamFees?.knownFeesEstimate}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Impact Item Cards Grid */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base text-[#0D0D0D] flex items-center justify-between">
                <span>Evaluated Downstream Reservations</span>
                <span className="text-xs text-[#8C8C85] font-normal">
                  Connecting Flights · Hotels · Ground Chauffeurs · Events
                </span>
              </h3>

              {loadingImpact ? (
                <div className="p-12 text-center text-xs text-[#6B6B6B] bg-white rounded-2xl border border-[#E5E5E0]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Evaluating downstream connection buffers and check-in windows...
                </div>
              ) : (
                impactData?.impactItems?.map((item) => {
                  const isCritical = item.impactLevel === 'CRITICAL'
                  const isHigh = item.impactLevel === 'HIGH'
                  const isWarning = item.impactLevel === 'WARNING'

                  return (
                    <div
                      key={item.itemId}
                      className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
                        isCritical
                          ? 'border-rose-300 ring-1 ring-rose-300'
                          : isHigh
                          ? 'border-amber-300'
                          : 'border-[#E5E5E0]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            {item.itemType === 'flight' && <Plane className="w-4 h-4 text-blue-600" />}
                            {item.itemType === 'hotel' && <Building className="w-4 h-4 text-purple-600" />}
                            {item.itemType === 'transport' && <Car className="w-4 h-4 text-emerald-600" />}
                            {item.itemType === 'tour' && <Calendar className="w-4 h-4 text-amber-600" />}

                            <h4 className="font-display font-bold text-base text-[#0D0D0D]">
                              {item.name}
                            </h4>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isHigh
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {item.impactLevel} Risk
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#52524E] pt-1">
                            <div>
                              <span className="text-[#8C8C85]">Original Schedule:</span>{' '}
                              <strong>{item.originalSchedule}</strong>
                            </div>
                            <div>
                              <span className="text-[#8C8C85]">Proposed Revised Schedule:</span>{' '}
                              <strong className={isCritical ? 'text-rose-700' : 'text-[#0D0D0D]'}>
                                {item.revisedSchedule}
                              </strong>
                            </div>
                          </div>

                          <p className="text-xs text-[#52524E] leading-relaxed pt-1">
                            <strong>Reason:</strong> {item.reason}
                          </p>

                          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] text-xs text-[#0D0D0D] mt-2">
                            <strong>Recommended Action:</strong> {item.recommendedAction}
                          </div>
                        </div>

                        {/* Action & Contact Column */}
                        <div className="flex flex-col gap-2 shrink-0 self-start md:self-auto min-w-[200px]">
                          {item.contactLink && (
                            <a
                              href={item.contactLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAF9F5] hover:border-[#1A1A1A] transition-all flex items-center justify-between"
                            >
                              <span>Contact Provider</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            </a>
                          )}

                          {item.contactPhone && (
                            <a
                              href={`tel:${item.contactPhone}`}
                              className="px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAF9F5] transition-all flex items-center justify-between"
                            >
                              <span>{item.contactPhone}</span>
                              <Phone className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            </a>
                          )}

                          {item.itemType === 'hotel' && (
                            <button
                              onClick={() => setActiveTab('hotels')}
                              className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-all flex items-center justify-between"
                            >
                              <span>Explore Nearby Demo Hotels</span>
                              <Building className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                          )}

                          <div className="text-[11px] text-[#8C8C85] p-2 bg-[#FAF9F5] rounded-lg border border-[#E5E5E0]">
                            <strong>Policy Cost:</strong> {item.knownCost}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Alternative Flight Search */}
        {activeTab === 'alternatives' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#0D0D0D]">
                  Alternative Flight Search ({alternativesData?.disruptedFlight?.origin} → {alternativesData?.disruptedFlight?.destination})
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Multi-carrier alternatives evaluated for date {alternativesData?.disruptedFlight?.date}. Ranked by arrival time, cost difference, and minimum connection times.
                </p>
              </div>

              <span className="text-xs text-[#8C8C85] bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#E5E5E0]">
                Original Fare: ${alternativesData?.disruptedFlight?.originalFare || 450}
              </span>
            </div>

            {/* Alternatives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternativesData?.alternatives?.map((alt) => {
                const isSelected = selectedAlternative?.id === alt.id
                const isFreeRebooking = alt.fareDifference === 0

                return (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setSelectedAlternative(alt)
                      loadProposedItinerary(selectedTrip, alt)
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 bg-white shadow-xs relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]'
                        : 'border-[#E5E5E0] hover:border-[#A0A09A]'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-sm text-[#0D0D0D]">
                            {alt.airline} {alt.flightNumber}
                          </span>
                          {alt.stops === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Direct Non-stop
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {alt.stopDetails}
                            </span>
                          )}
                        </div>

                        {isFreeRebooking ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            $0 Rebooking
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            +${alt.fareDifference} Fare Diff
                          </span>
                        )}
                      </div>

                      {/* Flight Timeline */}
                      <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-base font-bold text-[#0D0D0D] block">{alt.departureTime}</span>
                            <span className="text-[#6B6B6B]">{alt.origin}</span>
                          </div>
                          <div className="text-center text-[#8C8C85]">
                            <span>{alt.duration}</span>
                            <div className="w-16 h-0.5 bg-[#D5D5D0] my-1 mx-auto" />
                            <span className="text-[10px]">{alt.stops === 0 ? 'Direct' : alt.connectingAirport}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-bold text-[#0D0D0D] block">
                              {alt.arrivalTime} {alt.isNextDayArrival && <span className="text-xs text-rose-600 font-bold">+1 day</span>}
                            </span>
                            <span className="text-[#6B6B6B]">{alt.destination}</span>
                          </div>
                        </div>
                      </div>

                      {/* Policy & Explanation */}
                      <div className="space-y-1.5 text-xs text-[#52524E]">
                        <div>
                          <strong>Ticket Type:</strong> {alt.rebookingType}
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                          {alt.rebookingExplanation}
                        </p>
                        <div className="pt-1 text-[11px] text-[#8C8C85]">
                          Luggage: {alt.baggageAllowance} · Seats: {alt.seatsAvailable} left
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="mt-4 pt-3 border-t border-[#E5E5E0] flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-600">
                        {isSelected ? '✓ Selected for Itinerary Recovery' : 'Click to select this alternative'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAlternative(alt)
                          loadProposedItinerary(selectedTrip, alt)
                          setActiveTab('recovery')
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-all"
                      >
                        Proceed to Proposal →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Disclaimer Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 leading-relaxed">
              <strong>Airline Rebooking Disclaimer:</strong> {alternativesData?.disclaimer}
            </div>
          </div>
        )}

        {/* Tab 3: Nearby Hotels for Your Disruption */}
        {activeTab === 'hotels' && (
          <div className="space-y-6">
            {/* Header / Context Banner */}
            <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#0D0D0D]">
                      Nearby Hotels for Your Disruption
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      DEMO DATA
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">
                    {hotelData?.searchAirport
                      ? `Matching hotels near ${hotelData.searchAirport.name} (${hotelData.searchAirport.code}, ${hotelData.searchAirport.city}) based on your disruption.`
                      : 'Contextual accommodation recommendations evaluated for your active flight disruption.'}
                  </p>
                </div>

                {/* Stay Duration Selector */}
                <div className="flex items-center gap-2 bg-[#FAF9F5] p-1.5 rounded-xl border border-[#E5E5E0] shrink-0">
                  <span className="text-xs text-[#8C8C85] pl-2 font-medium">Duration:</span>
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleNightsChange(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hotelNights === n
                          ? 'bg-[#1A1A1A] text-white shadow-xs'
                          : 'text-[#52524E] hover:text-[#0D0D0D] hover:bg-white'
                      }`}
                    >
                      {n} {n === 1 ? 'Night' : 'Nights'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disruption Context Callout */}
              {hotelData && (
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] text-xs text-[#52524E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Recommendation Trigger:</strong> {hotelData.recommendationReason || 'Flight status evaluated for accommodation need.'}
                    </span>
                  </div>
                  {hotelData.searchAirport && (
                    <span className="text-[11px] font-mono text-[#8C8C85] bg-white px-2.5 py-1 rounded-md border border-[#E5E5E0] self-start sm:self-auto">
                      Airport: {hotelData.searchAirport.code} · {hotelData.searchAirport.city}
                    </span>
                  )}
                </div>
              )}

              {/* Existing Reservation Conflict Callout */}
              {hotelData?.existingReservation && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    hotelData.existingReservation.userActionNeeded
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-blue-50 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Existing Hotel Reservation Notice</span>
                  </div>
                  <p>{hotelData.existingReservation.recommendation}</p>
                  <div className="mt-2 text-[11px] text-[#52524E]">
                    Current booking: <strong>{hotelData.existingReservation.hotelName}</strong> ({hotelData.existingReservation.city}) · Status: {hotelData.existingReservation.status}
                  </div>
                </div>
              )}

              {/* Working Filters & Sort Bar */}
              {hotelData?.accommodationNeeded && hotelData?.hasMockHotels && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E5E0]">
                  {/* Sort Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[#8C8C85] mr-1">Sort by:</span>
                    <button
                      onClick={() => handleHotelFilterChange('sortBy', 'distance')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hotelFilters.sortBy === 'distance'
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#FAF9F5] text-[#52524E] border border-[#E5E5E0] hover:border-[#1A1A1A]'
                      }`}
                    >
                      Closest to Airport
                    </button>
                    <button
                      onClick={() => handleHotelFilterChange('sortBy', 'price_low')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hotelFilters.sortBy === 'price_low'
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#FAF9F5] text-[#52524E] border border-[#E5E5E0] hover:border-[#1A1A1A]'
                      }`}
                    >
                      Lowest Price
                    </button>
                    <button
                      onClick={() => handleHotelFilterChange('sortBy', 'rating')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hotelFilters.sortBy === 'rating'
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#FAF9F5] text-[#52524E] border border-[#E5E5E0] hover:border-[#1A1A1A]'
                      }`}
                    >
                      Highest Rating
                    </button>
                  </div>

                  {/* Airport Shuttle Filter */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#52524E] bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-[#E5E5E0] hover:border-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={hotelFilters.hasShuttle}
                      onChange={(e) => handleHotelFilterChange('hasShuttle', e.target.checked)}
                      className="rounded border-[#D5D5D0] text-[#1A1A1A] focus:ring-0"
                    />
                    <span>Airport Shuttle Included</span>
                  </label>
                </div>
              )}
            </div>

            {/* Content States */}
            {loadingHotels ? (
              <div className="p-12 text-center text-xs text-[#6B6B6B] bg-white rounded-2xl border border-[#E5E5E0]">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Matching nearby mock hotel records for this disruption location...
              </div>
            ) : !hotelData?.accommodationNeeded ? (
              /* Case 1: Accommodation Not Needed (Minor daytime delay) */
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E5E0] space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-base text-[#0D0D0D]">
                  No Overnight Accommodation Required
                </h4>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
                  {hotelData?.recommendationReason || 'Your flight disruption does not require an overnight stay or long transit layover.'}
                </p>
                <div className="text-[11px] text-[#8C8C85]">
                  Hotel recommendations are triggered only for cancellations, diversions, missed connections, or severe overnight delays.
                </div>
              </div>
            ) : !hotelData?.hasMockHotels ? (
              /* Case 2: Location has no demo records */
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D5D5D0] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF9F5] text-[#8C8C85] flex items-center justify-center mx-auto border border-[#E5E5E0]">
                  <Building className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-base text-[#0D0D0D]">
                  No Demo Hotel Listings Configured
                </h4>
                <p className="text-xs text-[#6B6B6B] max-w-lg mx-auto leading-relaxed">
                  {hotelData?.emptyStateMessage || 'No demo hotel listings are configured for this location yet.'}
                </p>
                <div className="text-[11px] text-[#8C8C85]">
                  Configured demo airport locations: DEL (Delhi), SXR (Srinagar), BOM (Mumbai), JED (Jeddah), RUH (Riyadh), DXB (Dubai), LHR (London Heathrow).
                </div>
              </div>
            ) : hotelData?.recommendations?.length === 0 ? (
              /* Case 3: Filters produced 0 records */
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E5E0] space-y-2">
                <h4 className="font-display font-bold text-sm text-[#0D0D0D]">
                  No hotels matched your selected filters
                </h4>
                <p className="text-xs text-[#6B6B6B]">
                  Try unchecking the "Airport Shuttle Included" filter to view other nearby options.
                </p>
                <button
                  onClick={() => handleHotelFilterChange('hasShuttle', false)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E5E5E0] text-xs font-semibold text-[#1A1A1A]"
                >
                  Reset Shuttle Filter
                </button>
              </div>
            ) : (
              /* Case 4: Hotel Cards Grid */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotelData.recommendations.map((hotel) => {
                    const isSelected = selectedHotel?.id === hotel.id

                    return (
                      <div
                        key={hotel.id}
                        onClick={() => setSelectedHotel(hotel)}
                        className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#1A1A1A] bg-[#FAFAF7] shadow-sm ring-2 ring-[#1A1A1A]'
                            : 'border-[#E5E5E0] bg-white hover:border-[#C5C5BF]'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Badges & Rating */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              DEMO DATA
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-[#0D0D0D] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E5E5E0]">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{hotel.rating}</span>
                              <span className="text-[10px] text-[#8C8C85] font-normal">
                                ({hotel.reviewCount})
                              </span>
                            </div>
                          </div>

                          {/* Hotel Name & Location */}
                          <div>
                            <h4 className="font-display font-bold text-base text-[#0D0D0D] leading-snug">
                              {hotel.name}
                            </h4>
                            <p className="text-xs text-[#6B6B6B] mt-0.5 line-clamp-1">
                              {hotel.address}
                            </p>
                          </div>

                          {/* Proximity & Transfer Time */}
                          <div className="flex items-center gap-3 text-xs text-[#52524E] bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E5E5E0]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-semibold">{hotel.distanceKm} km</span>
                              <span className="text-[#8C8C85]">to {hotel.airportCode}</span>
                            </div>
                            <span className="text-[#D5D5D0]">·</span>
                            <div className="flex items-center gap-1 text-[#52524E]">
                              <Clock className="w-3.5 h-3.5 text-[#8C8C85] shrink-0" />
                              <span>{hotel.estimatedTransferTime}</span>
                            </div>
                          </div>

                          {/* Amenities Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {hotel.amenities?.map((amenity, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                  amenity.toLowerCase().includes('shuttle')
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
                                    : 'bg-[#FAF9F5] text-[#52524E] border-[#E5E5E0]'
                                }`}
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>

                          {/* Availability & Cancellation */}
                          <div className="space-y-1.5 pt-2 border-t border-[#E5E5E0] text-[11px]">
                            <div className="flex items-center gap-1.5 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="line-clamp-1">{hotel.availabilityStatus}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#6B6B6B]">
                              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#8C8C85]" />
                              <span className="line-clamp-1">{hotel.cancellationPolicy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Actions Footer */}
                        <div className="mt-4 pt-3 border-t border-[#E5E5E0] space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="text-lg font-display font-bold text-[#0D0D0D]">
                                {hotel.currency} {hotel.totalEstimate}
                              </div>
                              <span className="text-[10px] text-[#8C8C85] block">
                                {hotelData.requestedNights} {hotelData.requestedNights === 1 ? 'night' : 'nights'} total (est.)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-[#52524E]">
                                {hotel.currency} {hotel.nightlyRate}
                              </span>
                              <span className="text-[10px] text-[#8C8C85] block">
                                / night demo
                              </span>
                            </div>
                          </div>

                          {/* Selection Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedHotel(hotel)
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#1A1A1A] text-white shadow-xs'
                                : 'bg-[#FAF9F5] border border-[#D5D5D0] text-[#1A1A1A] hover:bg-white hover:border-[#1A1A1A]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Selected Option for Stay</span>
                              </>
                            ) : (
                              <span>Select This Option</span>
                            )}
                          </button>

                          {/* Safe Link / Live Booking Disabled Row */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            {hotel.safeSearchUrl ? (
                              <a
                                href={hotel.safeSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                <span>Search on Google Hotels</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[#8C8C85]">Safe search link</span>
                            )}
                            <span className="text-[#8C8C85] cursor-not-allowed italic" title="AeroMate does not process commercial hotel bookings or financial transactions">
                              Live booking disabled
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Transparency & Disclaimer Box */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] text-xs text-[#52524E] space-y-1">
                  <div className="font-semibold text-[#0D0D0D] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    <span>Demo Data & Independent Accommodation Policy</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#6B6B6B]">
                    AeroMate uses sample demonstration hotel datasets to model disruption relief near airports without requiring paid commercial APIs. Prices, ratings, policies, and availability are illustrative estimates and do not represent verified live reservations. AeroMate never charges payment cards, alters external bookings, or executes automatic hotel contracts.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Proposed Itinerary Recovery (Before & After) */}
        {activeTab === 'recovery' && (
          <div className="space-y-6">
            {/* Approval Success Alert */}
            {approvalSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Itinerary Update Approved & Applied Successfully!</span>
                </div>
                <p className="text-xs leading-relaxed">
                  {approvalSuccess.message} AeroMate has updated your internal saved itinerary. Audit trail record logged: <code>{approvalSuccess.auditEvent?.id}</code>.
                </p>
                <div className="text-[11px] text-emerald-800/80 pt-1">
                  <strong>Important Notice:</strong> External bookings (hotels, chauffeur pickup) remain unchanged in third-party systems. Please use the contact buttons in the Whole-Journey Impact tab to inform property desks and chauffeurs of your new arrival time.
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#0D0D0D]">
                    Proposed Itinerary Recovery Plan
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Review the before-and-after schedule reconciliation before committing changes to your saved itinerary.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Requires Explicit User Approval
                </span>
              </div>

              {/* Before and After Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* BEFORE CARD */}
                <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      Original Disrupted Itinerary
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                      Disrupted
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#8C8C85] block">Flight:</span>
                      <strong className="text-sm text-[#0D0D0D]">
                        {proposedItinerary?.beforeItinerary?.flight?.airline} {proposedItinerary?.beforeItinerary?.flight?.flightNumber}
                      </strong>
                      <div className="text-[#6B6B6B]">
                        Dep: {proposedItinerary?.beforeItinerary?.flight?.departure} · Arr: {proposedItinerary?.beforeItinerary?.flight?.arrival}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60">
                      <span className="text-[#8C8C85] block">Downstream Hotel:</span>
                      <strong className="text-[#0D0D0D]">
                        {proposedItinerary?.beforeItinerary?.downstream?.hotel?.name || 'Saved Hotel'}
                      </strong>
                      <div className="text-rose-700">
                        {proposedItinerary?.beforeItinerary?.downstream?.hotel?.status || 'At Risk of No-Show'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60">
                      <span className="text-[#8C8C85] block">Airport Chauffeur Transfer:</span>
                      <strong className="text-[#0D0D0D]">
                        {proposedItinerary?.beforeItinerary?.downstream?.transfer?.provider || 'Airport Transfer'}
                      </strong>
                      <div className="text-rose-700">
                        {proposedItinerary?.beforeItinerary?.downstream?.transfer?.status || 'Driver Grace Period Expired'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Proposed Revised Itinerary
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      Recovered
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#8C8C85] block">New Flight:</span>
                      <strong className="text-sm text-emerald-900">
                        {proposedItinerary?.afterItinerary?.flight?.airline} {proposedItinerary?.afterItinerary?.flight?.flightNumber}
                      </strong>
                      <div className="text-emerald-800 font-semibold">
                        Dep: {proposedItinerary?.afterItinerary?.flight?.departure} · Arr: {proposedItinerary?.afterItinerary?.flight?.arrival}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-[#8C8C85] block">Downstream Hotel:</span>
                      <strong className="text-[#0D0D0D]">
                        {proposedItinerary?.afterItinerary?.downstream?.hotel?.name || 'Saved Hotel'}
                      </strong>
                      <div className="text-emerald-800">
                        {proposedItinerary?.afterItinerary?.downstream?.hotel?.actionNeeded || 'Late Arrival Notice Prepared'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-[#8C8C85] block">Airport Chauffeur Transfer:</span>
                      <strong className="text-[#0D0D0D]">
                        {proposedItinerary?.afterItinerary?.downstream?.transfer?.provider || 'Airport Transfer'}
                      </strong>
                      <div className="text-emerald-800">
                        {proposedItinerary?.afterItinerary?.downstream?.transfer?.actionNeeded || 'Reschedule pickup to new landing time'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost & Policy Reconciliation Summary */}
              <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] space-y-2 text-xs">
                <h4 className="font-bold text-[#0D0D0D]">Financial & Fare Difference Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[#8C8C85]">Original Ticket Price:</span>{' '}
                    <strong>${proposedItinerary?.costBreakdown?.originalFare || 450}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C8C85]">New Flight Fare:</span>{' '}
                    <strong>${proposedItinerary?.costBreakdown?.newFare || 480}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C8C85]">Total Fare Difference:</span>{' '}
                    <strong className="text-blue-700">
                      +${proposedItinerary?.costBreakdown?.fareDifference || 30}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-[#6B6B6B] pt-1">
                  <strong>Notice on Unknown Costs:</strong> {proposedItinerary?.costBreakdown?.unknownCostsNotice}
                </div>
              </div>

              {/* User Approval Action Bar */}
              <div className="pt-4 border-t border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#52524E]">
                  AeroMate will update your saved itinerary with the new flight and create an audit log. Existing external reservations are never modified without provider authorization.
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setActiveTab('alternatives')}
                    className="px-4 py-2.5 rounded-xl border border-[#D5D5D0] text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAF9F5] transition-all"
                  >
                    Pick Different Flight
                  </button>

                  <button
                    onClick={handleApproveItinerary}
                    disabled={approvalSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {approvalSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Approve Itinerary Update</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Rights & Legal Compensation Calculator */}
        {activeTab === 'rights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-[#0D0D0D]">
                    Instant Rights & Legal Delay Compensation Calculator
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Determine legally mandated cash payouts, hotel entitlements, and rebooking rights under EU261, DGCA India, and US DOT.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCalculateRights} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#52524E] mb-1">
                    Regulatory Framework
                  </label>
                  <select
                    value={calc.region}
                    onChange={(e) => setCalc({ ...calc, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                  >
                    <option value="EU261">EU Regulation 261/2004 (Europe / UK)</option>
                    <option value="DGCA">DGCA CAR Section 3 (India)</option>
                    <option value="USDOT">US DOT Automatic Refund Rule (USA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#52524E] mb-1">
                    Delay Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={calc.delayHours}
                    onChange={(e) => setCalc({ ...calc, delayHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#52524E] mb-1">
                    Flight Distance (Km)
                  </label>
                  <input
                    type="number"
                    value={calc.distanceKm}
                    onChange={(e) => setCalc({ ...calc, distanceKm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D5D0] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs"
                  >
                    Recalculate Compensation
                  </button>
                </div>
              </form>

              {/* Calculator Output Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C85] block mb-1">
                    Mandatory Cash Payout
                  </span>
                  <div className="text-2xl font-display font-extrabold text-[#0D0D0D]">
                    {estimate.cash}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] mt-1 block">
                    Under {estimate.rule}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C85] block mb-1">
                    Duty of Care: Meals & Drinks
                  </span>
                  <p className="text-xs text-[#52524E] leading-relaxed">
                    {estimate.food}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C85] block mb-1">
                    Hotel Accommodation
                  </span>
                  <p className="text-xs text-[#52524E] leading-relaxed">
                    {estimate.hotel}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E5E0]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C85] block mb-1">
                    Re-routing / Full Refund
                  </span>
                  <p className="text-xs text-[#52524E] leading-relaxed">
                    {estimate.rebooking}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
