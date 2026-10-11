import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, X, Sparkles, AlertTriangle, ShieldCheck, ArrowRight,
  ExternalLink, Bookmark, CheckCircle2, Flame, Info, Clock, Luggage
} from 'lucide-react'

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹'
}

export default function FlightComparisonTable({
  offers = [],
  currency = 'USD',
  onSaveTrip,
  savedIds = []
}) {
  const navigate = useNavigate()
  const [selectedForDetails, setSelectedForDetails] = useState(null)

  if (!offers || offers.length === 0) {
    return null
  }

  // Find minimum price and duration for highlighting
  const minPrice = Math.min(...offers.map(o => o.pricing?.total || 99999))
  const minDuration = Math.min(...offers.map(o => o.durationMinutes || 99999))

  return (
    <div className="surface-card p-6 border border-slate-200 shadow-card space-y-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Interactive Flight Comparison Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare verified fares, duration, baggage inclusions, and airspace risk side-by-side.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Comparing {offers.length} verified offers
        </span>
      </div>

      {/* Responsive Horizontal Scrolling Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3.5 whitespace-nowrap">Airline & Flight</th>
              <th className="p-3.5 whitespace-nowrap">Schedule & Route</th>
              <th className="p-3.5 whitespace-nowrap">Duration & Stops</th>
              <th className="p-3.5 whitespace-nowrap">Total Fare ({currency})</th>
              <th className="p-3.5 whitespace-nowrap">Baggage</th>
              <th className="p-3.5 whitespace-nowrap">AI Recommendation</th>
              <th className="p-3.5 whitespace-nowrap">Airspace Safety</th>
              <th className="p-3.5 whitespace-nowrap">Flexibility</th>
              <th className="p-3.5 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offers.map((offer) => {
              const isBestPrice = offer.pricing?.total === minPrice
              const isBestDuration = offer.durationMinutes === minDuration
              const isSaved = savedIds.includes(offer.id)

              return (
                <tr
                  key={offer.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Airline & Flight */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center font-mono text-xs">
                        {offer.airlineCode || 'FL'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{offer.airline}</div>
                        <div className="text-[11px] font-mono text-slate-400">{offer.flightNumber}</div>
                      </div>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">
                      {new Date(offer.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-1 text-slate-300">→</span>
                      {new Date(offer.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 font-bold">
                      {offer.origin} to {offer.destination}
                    </div>
                  </td>

                  {/* Duration & Stops */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className={`font-semibold ${isBestDuration ? 'text-blue-700 font-bold' : 'text-slate-800'}`}>
                      {offer.duration} {isBestDuration && <span className="text-[10px] text-blue-600">(Fastest)</span>}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {offer.stops === 0 ? (
                        <span className="text-emerald-600 font-bold">Non-stop</span>
                      ) : (
                        <span>{offer.stops} stop ({offer.layovers?.[0]?.airport || 'Transfer'})</span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className={`font-extrabold font-display text-base ${isBestPrice ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {CURRENCY_SYMBOLS[(offer.pricing?.currency || currency)?.toUpperCase()] || '$'}{offer.pricing?.total?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Base: {CURRENCY_SYMBOLS[(offer.pricing?.currency || currency)?.toUpperCase()] || '$'}{offer.pricing?.base?.toLocaleString()} + Tax
                    </div>
                  </td>

                  {/* Baggage */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Luggage className="w-3.5 h-3.5 text-slate-500" />
                      <span>{offer.baggage?.includedCheckedCount > 0 ? `${offer.baggage.includedCheckedCount} checked bag` : 'Cabin bag only'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {offer.baggage?.cabinBag?.split(' ')[0]} cabin bag incl.
                    </div>
                  </td>

                  {/* AI Recommendations */}
                  <td className="p-3.5 whitespace-nowrap">
                    {offer.recommendations && offer.recommendations.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {offer.recommendations.map((rec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#FAFAF7] text-[#52524E] border-[#E5E5E0] inline-block"
                            title={rec.reason}
                          >
                            {rec.type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#8C8C85] text-[11px]">Standard</span>
                    )}
                  </td>

                  {/* Aviation Risk & Airspace */}
                  <td className="p-3.5 whitespace-nowrap">
                    {offer.aviationRisk?.impactLevel === 'Confirmed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAFAF7] text-[#1A1A1A] border border-[#E5E5E0] inline-block">
                        Advisory Active
                      </span>
                    ) : offer.aviationRisk?.impactLevel === 'Potential Risk' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAFAF7] text-[#52524E] border border-[#E5E5E0] inline-block">
                        Corridor Note
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAFAF7] text-[#6B6B6B] border border-[#E5E5E0] inline-block">
                        Clear Route
                      </span>
                    )}
                  </td>

                  {/* Flexibility */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="text-slate-700">
                      {offer.conditions?.refundable ? (
                        <span className="text-emerald-600 font-bold">Refundable</span>
                      ) : (
                        <span className="text-slate-400">Non-refundable</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {offer.conditions?.changeFee}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSaveTrip && onSaveTrip(offer)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={isSaved ? 'Saved to My Journey' : 'Save to My Journey'}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/flight/${offer.flightNumber}`)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Comparison Matrix Legend / Disclaimer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>
          * Fares include estimated taxes and fees.
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lowest Price Highlight
          </span>
          <span className="flex items-center gap-1 font-semibold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Fastest Route Highlight
          </span>
        </div>
      </div>
    </div>
  )
}
