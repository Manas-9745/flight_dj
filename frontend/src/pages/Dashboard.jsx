import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Search, Zap, Globe2, Shield, MessageSquare, ArrowRight, MapPin } from 'lucide-react'

const DEMO_FLIGHTS = [
  { code: 'BA142', label: 'British Airways · LHR→JFK', badge: 'Delayed 210m', badgeColor: 'text-amber-400' },
  { code: 'AI645', label: 'Air India · BOM→DEL', badge: 'On Time', badgeColor: 'text-emerald-400' },
]

const FEATURES = [
  { icon: Search, title: 'Flight Search', desc: 'Find available flights with real-time pricing from Amadeus.' },
  { icon: MapPin, title: 'Live Radar', desc: 'Track aircraft coordinates with live ADS-B telemetry on interactive map.' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Get disruption guidance, passenger rights, and advice in your language.' },
  { icon: Shield, title: 'Saved Trips', desc: 'Save your journeys and get personalized alerts.' },
]

export default function Dashboard() {
  const [flightInput, setFlightInput] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    const val = flightInput.trim().toUpperCase()
    if (val) navigate(`/flight/${val}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium">
          <Zap className="w-4 h-4" />
          AI-Powered Aviation Companion · PS-01
        </div>

        <h1 className="text-5xl sm:text-6xl font-display font-bold text-white leading-tight">
          Your flight,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            always on track
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Search flights, track live aircraft positions, and get AI-powered disruption guidance — all in one place.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={flightInput}
                onChange={e => setFlightInput(e.target.value)}
                placeholder="Enter flight number (e.g. BA142, AI645)"
                className="input-field pl-11"
                id="hero-flight-search"
              />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Search className="w-4 h-4" />
              Track
            </button>
          </div>
        </form>

        {/* Demo flight chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="text-slate-500">Try:</span>
          {DEMO_FLIGHTS.map(f => (
            <button
              key={f.code}
              onClick={() => navigate(`/flight/${f.code}`)}
              className="flex items-center gap-2 glass hover:bg-white/8 rounded-full px-4 py-1.5 transition-all"
            >
              <span className="font-mono text-sky-400 font-semibold">{f.code}</span>
              <span className="text-slate-400 text-xs">{f.label}</span>
              <span className={`text-xs font-medium ${f.badgeColor}`}>{f.badge}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="animate-slide-up">
        <h2 className="text-2xl font-display font-bold text-white text-center mb-8">
          Everything you need, in one cockpit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-hover rounded-2xl p-6 group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-all">
                <Icon className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
        <div
          className="glass-hover rounded-2xl p-6 flex items-center justify-between group cursor-pointer"
          onClick={() => navigate('/search')}
        >
          <div>
            <div className="font-display font-bold text-white text-lg mb-1">Search Flights</div>
            <div className="text-slate-400 text-sm">Find & compare available routes and pricing.</div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
        </div>
        <div
          className="glass-hover rounded-2xl p-6 flex items-center justify-between group cursor-pointer"
          onClick={() => navigate('/assistant')}
        >
          <div>
            <div className="font-display font-bold text-white text-lg mb-1">AI Travel Assistant</div>
            <div className="text-slate-400 text-sm">Get disruption guidance and passenger rights info.</div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </section>
    </div>
  )
}
