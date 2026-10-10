import { useState } from 'react'
import {
  Clock, AlertTriangle, TrendingUp, CheckCircle, HelpCircle,
  Sparkles, DollarSign, ArrowRight, ShieldCheck, Calendar
} from 'lucide-react'
import { getHoldConsequences } from '../services/api'

export default function HoldCheckPage() {
  const [currentTrip, setCurrentTrip] = useState({
    flightNumber: 'BA142',
    route: 'LHR → JFK',
    currentPrice: '650',
    currency: 'USD',
    fareType: 'Economy Standard',
    holdDuration: '24 hours'
  })

  const [proposedChange, setProposedChange] = useState({
    action: 'Hold reservation before purchase',
    reason: 'Waiting for visa approval / meeting confirmation',
    daysUntilDeparture: '14'
  })

  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await getHoldConsequences({
        currentTrip,
        proposedChange,
        language
      })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-navy-700">Hold-Trip Consequences Checker</h1>
          <span className="badge-live">FARE VOLATILITY</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Evaluate price surge risks, bucket seat expiration, and 24-hour statutory cancellation options before waiting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-5">
            <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Current Flight & Proposed Decision
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Flight Number & Route</label>
                <input
                  type="text"
                  value={`${currentTrip.flightNumber} · ${currentTrip.route}`}
                  onChange={e => setCurrentTrip({ ...currentTrip, route: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Current Fare Quoted</label>
                <div className="flex items-center gap-2">
                  <select
                    value={currentTrip.currency}
                    onChange={e => setCurrentTrip({ ...currentTrip, currency: e.target.value })}
                    className="bg-surface-50 border border-surface-200 rounded-xl px-2 py-2 text-xs text-navy-700"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                  <input
                    type="number"
                    value={currentTrip.currentPrice}
                    onChange={e => setCurrentTrip({ ...currentTrip, currentPrice: e.target.value })}
                    className="input-field flex-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Fare Class</label>
                <select
                  value={currentTrip.fareType}
                  onChange={e => setCurrentTrip({ ...currentTrip, fareType: e.target.value })}
                  className="input-field"
                >
                  <option value="Economy Basic (No changes)">Economy Basic (Restricted)</option>
                  <option value="Economy Standard">Economy Standard</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business Flexible">Business Flexible</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Planned Hold / Wait Duration</label>
                <select
                  value={currentTrip.holdDuration}
                  onChange={e => setCurrentTrip({ ...currentTrip, holdDuration: e.target.value })}
                  className="input-field"
                >
                  <option value="12 hours">12 Hours (Today)</option>
                  <option value="24 hours">24 Hours (Next Day)</option>
                  <option value="48 hours">48 Hours (2 Days)</option>
                  <option value="7 days">1 Week</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Days Until Flight Departure</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={proposedChange.daysUntilDeparture}
                  onChange={e => setProposedChange({ ...proposedChange, daysUntilDeparture: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Reason for Postponing</label>
                <input
                  type="text"
                  value={proposedChange.reason}
                  onChange={e => setProposedChange({ ...proposedChange, reason: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Awaiting visa, comparing hotels"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Language:</span>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-surface-50 border border-surface-200 rounded-xl px-2.5 py-1 text-xs text-navy-700"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs flex items-center gap-2 py-2.5 px-5"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Evaluating Fare Volatility...' : 'Check Hold Consequences'}
              </button>
            </div>
          </form>

          {/* Result Output */}
          {result && (
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-navy-700 text-sm">
                      Hold Decision Advisory · {currentTrip.route}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Evaluated by {result.modelUsed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs text-navy-700 leading-relaxed whitespace-pre-line bg-surface-50/50 p-4 rounded-xl border border-surface-200">
                {result.consequences}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Key Aviation Rules Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-card space-y-3">
            <h4 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> 24-Hour Law Secrets
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>US DOT 24-Hour Rule:</strong> Airlines operating flights to/from the United States must allow cancellation without penalty for 24 hours after booking if booked at least 7 days before departure.
              </p>
              <p>
                <strong>Airline Price Locks:</strong> Airlines like Lufthansa, British Airways, and United offer nominal fee "Price Freeze" holds (e.g. $10–$25 for 72 hours) that guarantee your fare bucket.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Fare Bucket Risk Alert
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Airline revenue management engines automatically close discounted fare classes (e.g. O, Q, N buckets) as departure approaches or search volume spikes. Holding without locking can lead to sudden 20–40% price leaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
