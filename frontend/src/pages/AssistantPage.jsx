import ChatWidget from '../components/ChatWidget'
import { Bot, Sparkles, Shield, Globe, Award, HelpCircle } from 'lucide-react'

export default function AssistantPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Passenger Intelligence
          </div>
          <h1 className="text-3xl font-display font-extrabold text-aeromate-text tracking-tight flex items-center gap-3">
            AeroMate Travel Concierge
          </h1>
          <p className="text-sm font-medium text-aeromate-muted mt-1">
            Multilingual disruption guidance, delay compensation calculations, and passenger rights.
          </p>
        </div>
      </div>

      {/* Feature / Capability Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card p-4 border border-slate-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-aeromate-blue font-bold flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-aeromate-text text-sm">6 Languages Supported</div>
            <div className="text-xs text-aeromate-muted">English, Hindi (हिंदी), Spanish, French, German, Japanese</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-slate-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-aeromate-text text-sm">Global Regulatory Standards</div>
            <div className="text-xs text-aeromate-muted">DGCA India, EU261 Europe, US DOT & UK CAA rules</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-slate-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-aeromate-text text-sm">Strict Grounding</div>
            <div className="text-xs text-aeromate-muted">Factual response guarantee anchored to actual flight telemetry</div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <ChatWidget flightContext={null} className="h-[620px]" />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="surface-card p-5 border border-slate-200 shadow-subtle space-y-3">
            <h3 className="font-display font-bold text-aeromate-text text-base flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-aeromate-blue" />
              Popular Passenger Questions
            </h3>
            <p className="text-xs text-aeromate-muted leading-relaxed">
              Click any question below to ask the AI assistant directly:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer font-medium text-slate-700">
                💡 "What meals or lounge access am I entitled to if my flight is delayed 4 hours in India?"
              </div>
              <div className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer font-medium text-slate-700">
                💡 "Can I get €600 cash compensation under EU261 for a missed connecting flight in Frankfurt?"
              </div>
              <div className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer font-medium text-slate-700">
                💡 "Hindi me batao: Agar flight cancel ho jaye toh kitna refund milta hai?"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

