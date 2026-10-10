import ChatWidget from '../components/ChatWidget'
import { Bot, Zap } from 'lucide-react'

export default function AssistantPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1 flex items-center gap-3">
          <Bot className="w-8 h-8 text-sky-400" />
          AI Travel Assistant
        </h1>
        <p className="text-slate-400">
          Get multilingual disruption guidance, passenger rights information, and personalized travel advice.
        </p>
      </div>

      {/* Capabilities row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { emoji: '🌍', label: 'Multilingual', sub: 'EN · HI · ES · FR · DE · JA' },
          { emoji: '⚖️', label: 'Passenger Rights', sub: 'EU261 · DGCA · US DOT' },
          { emoji: '🔒', label: 'Verified Data', sub: 'No hallucinated flight info' },
        ].map(({ emoji, label, sub }) => (
          <div key={label} className="glass rounded-2xl py-4 px-2">
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-white font-semibold text-sm">{label}</div>
            <div className="text-slate-500 text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <ChatWidget flightContext={null} />
    </div>
  )
}
