import ChatWidget from '../components/ChatWidget'
import { Bot, Sparkles, Shield, Globe, Award, HelpCircle } from 'lucide-react'

export default function AssistantPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E5E0] text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>AI Travel Concierge</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0D0D0D] tracking-tight">
            Travel Concierge
          </h1>
          <p className="text-sm font-medium text-[#6B6B6B] mt-1">
            Multilingual disruption guidance, delay compensation rules, and passenger rights.
          </p>
        </div>
      </div>

      {/* Feature / Capability Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-[#0D0D0D] text-sm">6 Languages Supported</div>
            <div className="text-xs text-[#6B6B6B]">English, Hindi, Spanish, French, German, Japanese</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-[#0D0D0D] text-sm">Regulatory Standards</div>
            <div className="text-xs text-[#6B6B6B]">DGCA India, EU261 Europe, and US DOT rules</div>
          </div>
        </div>

        <div className="surface-card p-4 border border-[#E5E5E0] shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] font-bold flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-[#0D0D0D] text-sm">Verified Telemetry</div>
            <div className="text-xs text-[#6B6B6B]">Responses grounded in real-time flight data</div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <ChatWidget flightContext={null} className="h-[620px]" />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="surface-card p-5 border border-[#E5E5E0] shadow-subtle space-y-3">
            <h3 className="font-display font-bold text-[#0D0D0D] text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Popular Inquiries
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Select an inquiry to ask the assistant:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#FAFAF7] hover:bg-white border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D]">
                "What meals or lounge access am I entitled to for a 4-hour delay in India?"
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAF7] hover:bg-white border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D]">
                "Can I claim €600 compensation under EU261 for a missed connecting flight in Frankfurt?"
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAF7] hover:bg-white border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D]">
                "Hindi me batao: Agar flight cancel ho jaye toh kitna refund milta hai?"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

