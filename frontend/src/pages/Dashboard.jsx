import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Plane, Bot, Shield, Sparkles, Flame, AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const [flightInput, setFlightInput] = useState('')
  const navigate = useNavigate()

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    const val = flightInput.trim().toUpperCase()
    if (val) navigate(`/flight/${val}`)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* ===== HERO SECTION — Clean, Balanced Aviation Showcase ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F5F0] via-[#E8EDF5] to-[#D9E4F0] pt-28 pb-16">

        {/* Decorative soft blurs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-[100px] pointer-events-none" />

        {/* Main Hero Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 sm:px-8 lg:px-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/10 backdrop-blur-sm text-xs font-semibold text-aeromate-ink mb-6 shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Generation Flight Intelligence & Travel Concierge</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-aeromate-ink tracking-tight leading-[1.1] max-w-4xl">
            AeroMate
            <span className="block text-aeromate-muted text-2xl sm:text-4xl lg:text-5xl font-semibold mt-2">
              Beyond Flight.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-aeromate-muted leading-relaxed max-w-2xl mt-5">
            Real-time radar tracking, AI disruption guidance, and passenger rights protection across global airlines.
          </p>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => navigate('/search')}
              className="btn-primary text-sm px-6 py-3"
            >
              Search Flights <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className="btn-secondary text-sm px-6 py-3"
            >
              Ask AI Concierge
            </button>
          </div>
        </div>

        {/* Hero Airplane Image */}
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-12 mt-8 lg:mt-10 animate-float">
          <img
            src="/hero-jet.jpg"
            alt="Premium private jet in flight"
            className="w-full max-w-4xl mx-auto object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))' }}
          />
        </div>

        {/* Live Crisis & Airspace Safety Ticker */}
        <div className="relative z-20 max-w-[1200px] mx-auto w-full px-6 sm:px-8 lg:px-12 mt-6">
          <div
            onClick={() => navigate('/alerts')}
            className="surface-card bg-white/90 backdrop-blur-md p-4 sm:p-5 border border-rose-200/80 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute"></span>
                <Flame className="w-5 h-5 text-rose-600 relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    Live Airspace Alert
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Middle East & Eastern Europe FIRs Active</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                  Heightened vigilance bulletins active for FIR Tehran & Baghdad · Ukraine civil airspace closed
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform whitespace-nowrap self-end sm:self-auto">
              <span>View Global Crisis Radar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* AI Disruption Recovery Alert Banner */}
          <div
            onClick={() => navigate('/disruption')}
            className="surface-card bg-white/90 backdrop-blur-md p-4 sm:p-5 border border-amber-300 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group mt-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    AI Journey Disruption Manager
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Automatic Flight & Downstream Monitoring</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                  Proactive rebooking alternatives, missed connection protection, and hotel impact recovery
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform whitespace-nowrap self-end sm:self-auto">
              <span>Open Recovery Center</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FLIGHT TRACKER SECTION ===== */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-aeromate-muted">
              Live Tracking
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-aeromate-ink tracking-tight leading-[1.1]">
              Track any flight,
              <br />
              <span className="text-aeromate-muted">anywhere.</span>
            </h2>
            <p className="text-base text-aeromate-muted leading-relaxed max-w-lg mx-auto">
              Enter your flight number for instant real-time status, gate info, delay predictions, and AI-powered disruption guidance.
            </p>
          </div>

          {/* Search Bar — Minimal & Elegant */}
          <form
            onSubmit={handleTrackSubmit}
            className="max-w-2xl mx-auto flex items-center gap-3 bg-aeromate-cream border border-aeromate-border rounded-full p-2 shadow-subtle hover:shadow-card transition-shadow duration-300"
          >
            <div className="flex-1 flex items-center gap-3 pl-4">
              <Search className="w-5 h-5 text-aeromate-muted flex-shrink-0" />
              <input
                type="text"
                value={flightInput}
                onChange={e => setFlightInput(e.target.value)}
                placeholder="Enter flight number (e.g. AI645, BA142)"
                className="w-full bg-transparent border-0 outline-none text-aeromate-ink placeholder-aeromate-muted/50 text-sm font-medium"
                id="hero-flight-input"
              />
            </div>
            <button type="submit" className="btn-primary py-3 px-6 whitespace-nowrap">
              Track Flight
            </button>
          </form>

          {/* Demo Flight Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="text-xs text-aeromate-muted font-medium">Try:</span>
            {['AI645', 'BA142', '6E204'].map(code => (
              <button
                key={code}
                onClick={() => navigate(`/flight/${code}`)}
                className="px-4 py-2 rounded-full border border-aeromate-border bg-white text-sm font-semibold text-aeromate-ink hover:border-aeromate-ink hover:shadow-pill transition-all duration-300"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAPABILITIES GRID ===== */}
      <section className="bg-aeromate-bg py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-aeromate-muted">
              Our Solutions
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-aeromate-ink tracking-tight">
              Everything you need
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Plane,
                title: 'Live Flight Tracking',
                desc: 'Real-time status, gate changes, delay alerts, and ADS-B radar telemetry for any commercial flight worldwide.',
              },
              {
                icon: Bot,
                title: 'AI Concierge',
                desc: 'GPT-4o powered assistant with multilingual support. Ask about delays, rebooking, compensation, and more.',
              },
              {
                icon: Shield,
                title: 'Passenger Rights',
                desc: 'Instant guidance on DGCA, EU261, and US DOT regulations. Know your compensation and refund eligibility.',
              },
              {
                icon: Sparkles,
                title: 'Smart Disruptions',
                desc: 'Automated disruption analysis with severity scoring, weather impact assessment, and recommended actions.',
              },
            ].map((cap, i) => (
              <div
                key={i}
                className="surface-card-hover group cursor-pointer p-8 space-y-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-aeromate-cream border border-aeromate-border flex items-center justify-center group-hover:bg-aeromate-ink group-hover:border-aeromate-ink transition-all duration-300">
                  <cap.icon className="w-5 h-5 text-aeromate-ink group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display font-bold text-lg text-aeromate-ink">{cap.title}</h3>
                <p className="text-sm text-aeromate-muted leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PASSENGER RIGHTS SECTION ===== */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-aeromate-muted">
                Global Coverage
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-aeromate-ink tracking-tight leading-[1.1]">
                Know your rights,
                <br />
                <span className="text-aeromate-muted">globally.</span>
              </h2>
              <p className="text-base text-aeromate-muted leading-relaxed max-w-lg">
                From DGCA India to EU261 Europe and US DOT — our AI assistant provides verified, regulation-specific guidance for every disruption.
              </p>
              <button
                onClick={() => navigate('/assistant')}
                className="btn-primary mt-4"
              >
                Ask about your rights <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { code: 'DGCA', region: 'India', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', desc: 'Delays >2-4h: free meals. Cancellation: ₹10,000 compensation + alternative flight.' },
                { code: 'EU261', region: 'Europe', color: 'bg-blue-50 text-blue-800 border-blue-200', desc: 'Up to €600 compensation for delays >3h. Hotel for overnight delays.' },
                { code: 'US DOT', region: 'United States', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', desc: 'Automatic cash refunds for significant delays. Baggage fee refunds.' },
                { code: 'CAAC', region: 'China', color: 'bg-amber-50 text-amber-800 border-amber-200', desc: 'Free meals and accommodation for delays. Cash compensation for carriers at fault.' },
              ].map((reg) => (
                <div key={reg.code} className="surface-card p-5 space-y-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${reg.color}`}>
                    {reg.code}
                  </div>
                  <h3 className="font-display font-bold text-aeromate-ink text-sm">{reg.region}</h3>
                  <p className="text-xs text-aeromate-muted leading-relaxed">{reg.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER SECTION ===== */}
      <section className="bg-aeromate-ink py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-8">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.1]">
            Ready to fly smarter?
          </h2>
          <p className="text-base sm:text-lg text-white/60 max-w-lg mx-auto">
            Start tracking flights, get real-time disruption alerts, and let our AI handle your passenger rights.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/search')}
              className="bg-white text-aeromate-ink font-semibold px-8 py-3.5 rounded-full transition-all duration-300 hover:bg-aeromate-cream hover:shadow-floating text-sm inline-flex items-center gap-2"
            >
              Search Flights <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className="bg-white/10 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-full transition-all duration-300 hover:bg-white/20 text-sm inline-flex items-center gap-2"
            >
              Talk to AI Assistant
            </button>
          </div>
        </div>
      </section>

      {/* ===== MINIMAL FOOTER ===== */}
      <footer className="bg-aeromate-ink border-t border-white/10 py-8">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg text-white/80">AeroMate®</span>
          <p className="text-xs text-white/40">
            © 2026 AeroMate. Flights, tracking and personalised experiences.
          </p>
        </div>
      </footer>
    </div>
  )
}
