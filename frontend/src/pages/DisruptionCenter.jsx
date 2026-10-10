import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Calculator, ShieldCheck, Sparkles, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export default function DisruptionCenter() {
  const navigate = useNavigate()

  const [calc, setCalc] = useState({
    region: 'EU261', // 'EU261' | 'DGCA' | 'USDOT'
    delayHours: '3',
    isCancelled: false,
    distanceKm: '1500',
  })

  const [estimate, setEstimate] = useState({
    cash: '€400',
    food: 'Full complimentary meals & drinks provided',
    hotel: 'Overnight hotel accommodation if delay extends past midnight',
    rebooking: 'Free alternative flight or 100% full refund within 7 days',
    rule: 'EU Regulation 261/2004 Article 7'
  })

  const handleCalculate = (e) => {
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
        rule: 'EU Regulation 261/2004'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Disruption & Passenger Rights Portal
          </div>
          <h1 className="text-3xl font-display font-extrabold text-aeromate-text tracking-tight">
            Travel Help & Delay Compensation Center
          </h1>
          <p className="text-sm font-medium text-aeromate-muted mt-1">
            Calculate your legal compensation and claim entitlements under global aviation laws.
          </p>
        </div>

        <button
          onClick={() => navigate('/assistant')}
          className="btn-primary text-xs py-2.5 px-5"
        >
          <Sparkles className="w-4 h-4" /> Ask AI Legal Rights
        </button>
      </div>

      {/* Interactive Compensation Calculator */}
      <section className="surface-card p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue font-bold flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-aeromate-text">Instant Rights & Compensation Calculator</h2>
            <p className="text-xs text-aeromate-muted">Determine expected cash payouts, meals, and hotel entitlements.</p>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">
              Aviation Jurisdiction
            </label>
            <select
              value={calc.region}
              onChange={e => setCalc({ ...calc, region: e.target.value })}
              className="input-field text-xs font-bold bg-white"
            >
              <option value="EU261">EU261 (Europe / UK Flights)</option>
              <option value="DGCA">DGCA (India Domestic / Intl)</option>
              <option value="USDOT">US DOT (United States)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">
              Delay Duration
            </label>
            <select
              value={calc.delayHours}
              onChange={e => setCalc({ ...calc, delayHours: e.target.value })}
              className="input-field text-xs font-bold bg-white"
            >
              <option value="1">1 Hour Delay</option>
              <option value="2">2 Hours Delay</option>
              <option value="3">3 Hours Delay</option>
              <option value="4">4+ Hours Delay</option>
              <option value="8">Overnight / Flight Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">
              Flight Distance (approx)
            </label>
            <select
              value={calc.distanceKm}
              onChange={e => setCalc({ ...calc, distanceKm: e.target.value })}
              className="input-field text-xs font-bold bg-white"
            >
              <option value="1000">Short Haul (&lt; 1,500 km)</option>
              <option value="2500">Medium Haul (1,500 - 3,500 km)</option>
              <option value="5000">Long Haul (&gt; 3,500 km)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-md">
              Calculate Payout
            </button>
          </div>
        </form>

        {/* Results Banner */}
        {estimate && (
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-6 rounded-2xl border border-blue-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
              <span className="text-xs font-extrabold text-aeromate-blue uppercase tracking-widest">
                Protected Under {estimate.rule}
              </span>
              <span className="text-xs bg-white text-aeromate-blue font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                Verified Legal Payout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Estimated Cash Payout</span>
                <span className="font-display font-black text-2xl text-emerald-600">{estimate.cash}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Refreshments & Meals</span>
                <span className="font-semibold text-slate-800 leading-snug block">{estimate.food}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Hotel Stay</span>
                <span className="font-semibold text-slate-800 leading-snug block">{estimate.hotel}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Rebooking Rights</span>
                <span className="font-semibold text-slate-800 leading-snug block">{estimate.rebooking}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => navigate('/assistant')}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <span>Draft Claim Letter with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Regulation Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-card p-6 border border-slate-200 shadow-subtle space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            DGCA
          </div>
          <h3 className="font-display font-bold text-aeromate-text text-base">DGCA India Guidelines</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>Delays &gt; 2h (block 1): Free snacks & water.</li>
            <li>Delays &gt; 4h: Free meals + choice of full refund.</li>
            <li>Night delays (10 PM - 6 AM): Mandatory free hotel room.</li>
            <li>Cancellation without 24h notice: Compensation up to ₹10,000.</li>
          </ul>
        </div>

        <div className="surface-card p-6 border border-slate-200 shadow-subtle space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
            EU261
          </div>
          <h3 className="font-display font-bold text-aeromate-text text-base">EU Regulation 261/2004</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>Delays &gt; 3h at arrival: €250 to €600 cash compensation.</li>
            <li>Extraordinary weather excluded, but technical defects ARE covered.</li>
            <li>Right to care: Free food, drinks, and 2 phone calls after 2h.</li>
            <li>Overnight delays: Mandatory hotel + transport.</li>
          </ul>
        </div>

        <div className="surface-card p-6 border border-slate-200 shadow-subtle space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
            US DOT
          </div>
          <h3 className="font-display font-bold text-aeromate-text text-base">US DOT Refund Mandate</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>Automatic 100% cash refund if flight is significantly delayed.</li>
            <li>Domestic delays &gt; 3h / Intl delays &gt; 6h trigger refund right.</li>
            <li>Baggage fee refunds if checked luggage delayed &gt; 12 hours.</li>
            <li>Vouchers cannot replace mandatory cash refunds unless accepted.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
