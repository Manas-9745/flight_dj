import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Plane, Bot, Shield, Sparkles } from 'lucide-react'

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

      {/* ===== HERO SECTION — Hyer-style Full Viewport ===== */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F5F5F0] via-[#E8EDF5] to-[#D9E4F0]">

        {/* Decorative soft blurs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-[100px] pointer-events-none" />

        {/* Main Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-[1400px] mx-auto w-full px-6 sm:px-8 lg:px-12 pt-28 sm:pt-32">

          {/* Left — Giant Typography */}
          <div className="flex-1 space-y-6 lg:space-y-8 animate-fade-in">
            <h1 className="font-display font-extrabold text-[clamp(4rem,12vw,9rem)] leading-[0.9] tracking-[-0.03em] text-aeromate-ink">
              Aero
              <br />
              Mate
            </h1>
          </div>

          {/* Right — Tagline */}
          <div className="flex-shrink-0 lg:max-w-md mt-8 lg:mt-0 space-y-4 animate-slide-up">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-aeromate-ink leading-[1.1]">
              Beyond
              <br />
              Flight.
            </h2>
            <p className="text-base text-aeromate-muted leading-relaxed max-w-sm">
              Real-time tracking, AI disruption guidance, and personalised aviation experiences.
            </p>
          </div>
        </div>

        {/* Hero Airplane Image — Full Width Dramatic */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 -mb-8 lg:-mb-16 animate-float">
          <img
            src="/hero-jet.jpg"
            alt="Premium private jet in flight"
            className="w-full max-w-5xl mx-auto object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.15))' }}
          />
        </div>

        {/* Bottom Bar — Subtitle + CTA Pills */}
        <div className="relative z-20 max-w-[1400px] mx-auto w-full px-6 sm:px-8 lg:px-12 pb-8 sm:pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <p className="text-sm sm:text-base text-aeromate-muted font-medium">
              Flights, tracking and personalised experiences.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/search')}
                className="btn-primary text-sm"
              >
                AeroMate® Search
              </button>
              <button
                onClick={() => navigate('/assistant')}
                className="btn-primary text-sm"
              >
                AeroMate® AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FLIGHT TRACKER SECTION ===== */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-aeromate-muted">
              Live Tracking
            </span>
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-aeromate-ink tracking-tight leading-[1.05]">
              Track any flight,
              <br />
              <span className="text-aeromate-muted">anywhere.</span>
            </h2>
            <p className="text-base sm:text-lg text-aeromate-muted leading-relaxed max-w-lg mx-auto">
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
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-aeromate-ink tracking-tight">
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
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-aeromate-ink tracking-tight leading-[1.1]">
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
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
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
