import { useState, useEffect } from 'react'
import ChatWidget from '../components/ChatWidget'
import { Bot, Zap, Globe, Shield, Sparkles, Plane } from 'lucide-react'
import { getTrips } from '../services/api'

export default function AssistantPage() {
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [trips, setTrips] = useState([])

  useEffect(() => {
    // Attempt to load saved trips for flight context injection
    try {
      const cached = localStorage.getItem('aeromate_offline_wallet')
      if (cached) setTrips(JSON.parse(cached))
    } catch {}
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-navy-700 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Bot className="w-5 h-5" />
              </div>
              AI Travel Copilot
            </h1>
            <span className="badge-live">GPT-4o-MINI</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Multilingual passenger rights advice, EU261 compensation guidance, and connection intelligence
          </p>
        </div>

        {/* Flight Context Selector */}
        {trips.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Plane className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-slate-500">Active Context:</span>
            <select
              value={selectedFlight?.flightNumber || ''}
              onChange={e => {
                const found = trips.find(t => t.flightNumber === e.target.value)
                setSelectedFlight(found || null)
              }}
              className="font-bold text-navy-700 bg-transparent focus:outline-none"
            >
              <option value="">General Travel Advisory</option>
              {trips.map(t => (
                <option key={t.id || t.flightNumber} value={t.flightNumber}>
                  {t.flightNumber} ({t.origin} → {t.destination})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Capability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Globe, color: 'text-teal-600 bg-teal-50 border-teal-200', title: 'Multilingual Support', desc: 'Queries answered in 8 global languages' },
          { icon: Shield, color: 'text-brand-600 bg-brand-50 border-brand-200', title: 'Aviation Rights Audited', desc: 'EU261, US DOT, and DGCA regulations' },
          { icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200', title: 'Hallucination Guarded', desc: 'Strict anti-hallucination guardrails' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="bg-white border border-surface-200 rounded-2xl p-4 shadow-card flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-navy-700">{title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chat Box */}
      <div className="bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden">
        <ChatWidget flightContext={selectedFlight} />
      </div>
    </div>
  )
}
