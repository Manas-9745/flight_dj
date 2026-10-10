import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plane, Search, Globe, ArrowLeftRight, Zap, Bot, Luggage,
  Archive, TrendingUp, AlertTriangle, Clock, ArrowRight, RefreshCw
} from 'lucide-react'
import { getStats } from '../services/api'

const QUICK_FLIGHTS = [
  { code: 'BA142', label: 'British Airways · LHR→JFK', status: 'delayed', delay: '210m' },
  { code: 'AI645', label: 'Air India · BOM→DEL', status: 'scheduled', delay: null },
]

const FEATURE_CARDS = [
  { to: '/map',      icon: Globe,         title: 'Global Flight Map',  desc: 'Track live aircraft worldwide.',          accent: 'brand' },
  { to: '/search',   icon: Search,        title: 'Search & Compare',   desc: 'Compare flights & fares.',                accent: 'teal' },
  { to: '/impact',   icon: Zap,           title: 'Journey Impact',     desc: 'See how delays affect your trip.',        accent: 'amber' },
  { to: '/transfer', icon: ArrowLeftRight, title: 'Transfer Guide',    desc: 'Step-by-step connection help.',           accent: 'brand' },
  { to: '/baggage',  icon: Luggage,       title: 'Baggage Checker',    desc: 'Baggage guidance & assistance.',          accent: 'teal' },
  { to: '/assistant', icon: Bot,          title: 'AI Copilot',         desc: 'Ask anything in your language.',          accent: 'purple' },
  { to: '/wallet',   icon: Archive,       title: 'Offline Wallet',     desc: 'Your journey, saved offline.',            accent: 'green' },
  { to: '/hold',     icon: Archive,       title: 'Hold Checker',       desc: 'Know the cost of waiting.',               accent: 'red' },
]

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:  'bg-brand-50 border-brand-100 text-brand-600',
    teal:   'bg-teal-50  border-teal-100  text-teal-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
    red:    'bg-red-50   border-red-100   text-red-600',
  }
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-display font-bold text-navy-700">{value}</div>
      <div className="text-sm font-medium text-navy-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ token }) {
  const [flightInput, setFlightInput] = useState('')
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats({
        activeFlights: '10,000+', airlinesMonitored: 1247,
        disruptionsReported: 58, avgDelayMinutes: 22,
        source: 'estimated', lastUpdated: new Date().toISOString()
      }))
      .finally(() => setStatsLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const val = flightInput.trim().toUpperCase()
    if (val) navigate(`/flight/${val}`)
  }

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : n

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-700">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Your aviation journey command center</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Plane} color="brand"
          label="Active Flights"
          value={statsLoading ? '—' : fmt(stats?.activeFlights)}
          sub={stats?.source === 'estimated' ? 'Estimated globally' : 'OpenSky Network'}
        />
        <StatCard
          icon={Globe} color="teal"
          label="Airlines Monitored"
          value={statsLoading ? '—' : fmt(stats?.airlinesMonitored)}
          sub="Worldwide coverage"
        />
        <StatCard
          icon={AlertTriangle} color="amber"
          label="Disruptions Today"
          value={statsLoading ? '—' : fmt(stats?.disruptionsReported)}
          sub="Delays & cancellations"
        />
        <StatCard
          icon={Clock} color="red"
          label="Avg Delay"
          value={statsLoading ? '—' : `${stats?.avgDelayMinutes}m`}
          sub="Industry average"
        />
      </div>

      {/* Hero search */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-6 sm:p-8 text-white shadow-brand">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100">Live Flight Tracker</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1">Track Any Flight</h2>
          <p className="text-blue-200 text-sm mb-5">Real-time status, live radar, and AI-powered disruption guidance.</p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
              <input
                type="text"
                value={flightInput}
                onChange={e => setFlightInput(e.target.value)}
                placeholder="Enter flight number e.g. BA142, AI645"
                className="w-full bg-white/15 border border-white/25 rounded-xl pl-11 pr-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all text-sm"
                id="hero-flight-search"
              />
            </div>
            <button type="submit" className="bg-white text-brand-600 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap text-sm">
              <Search className="w-4 h-4" /> Track
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-blue-300 text-xs">Try:</span>
            {QUICK_FLIGHTS.map(f => (
              <button
                key={f.code}
                onClick={() => navigate(`/flight/${f.code}`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-all"
              >
                <span className="font-mono text-white font-bold text-xs">{f.code}</span>
                <span className="text-blue-200 text-xs">{f.label}</span>
                {f.status === 'delayed' && (
                  <span className="text-amber-300 text-xs font-semibold">{f.delay} delay</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div>
        <h2 className="section-title mb-4">All Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map(({ to, icon: Icon, title, desc, accent }) => {
            const accents = {
              brand:  'bg-brand-50 border-brand-100 text-brand-500 group-hover:bg-brand-100',
              teal:   'bg-teal-50  border-teal-100  text-teal-500  group-hover:bg-teal-100',
              amber:  'bg-amber-50 border-amber-100 text-amber-500 group-hover:bg-amber-100',
              purple: 'bg-purple-50 border-purple-100 text-purple-500 group-hover:bg-purple-100',
              green:  'bg-green-50 border-green-100 text-green-500 group-hover:bg-green-100',
              red:    'bg-red-50   border-red-100   text-red-500   group-hover:bg-red-100',
            }
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="card-hover group text-left"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-3 transition-all ${accents[accent]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display font-semibold text-navy-700 text-sm mb-1">{title}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all mt-3" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer meta */}
      {stats?.lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-3 h-3" />
          Stats updated {new Date(stats.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
