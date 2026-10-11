import { useState } from 'react'
import ChatWidget from '../components/ChatWidget'
import { HelpCircle } from 'lucide-react'

export default function AssistantPage() {
  const [externalPrompt, setExternalPrompt] = useState(null)

  const handleSelectInquiry = (promptText) => {
    setExternalPrompt(promptText)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6 font-sans">
      {/* Page Title & Intro */}
      <div className="border-b border-[#E5E5E0] pb-4">
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-[#0D0D0D] tracking-tight">
          AI Assistant
        </h1>
        <p className="text-sm text-[#52524E] mt-1">
          Instant answers on delay compensation, passenger rights, and flight updates.
        </p>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ChatWidget flightContext={null} className="h-[620px]" externalPrompt={externalPrompt} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="surface-card p-5 border border-[#E5E5E0] shadow-subtle space-y-3">
            <h3 className="font-display font-semibold text-[#0D0D0D] text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Common Questions
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Tap any inquiry to ask immediately:
            </p>

            <div className="space-y-2.5 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleSelectInquiry("What meals or lounge access am I entitled to for a 4-hour delay in India under DGCA regulations?")}
                className="w-full text-left p-3 rounded-xl bg-[#FAFAF7] hover:bg-white active:bg-slate-100 border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D] active:scale-[0.99] touch-manipulation"
              >
                "What meals or lounge access am I entitled to for a 4-hour delay?"
              </button>
              <button
                type="button"
                onClick={() => handleSelectInquiry("Can I claim compensation under EU261 for a missed connecting flight?")}
                className="w-full text-left p-3 rounded-xl bg-[#FAFAF7] hover:bg-white active:bg-slate-100 border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D] active:scale-[0.99] touch-manipulation"
              >
                "Can I claim compensation under EU261 for a missed connection?"
              </button>
              <button
                type="button"
                onClick={() => handleSelectInquiry("Hindi me batao: Agar flight cancel ho jaye toh kitna refund milta hai?")}
                className="w-full text-left p-3 rounded-xl bg-[#FAFAF7] hover:bg-white active:bg-slate-100 border border-[#E5E5E0] hover:border-[#1A1A1A] transition-all cursor-pointer font-medium text-[#0D0D0D] active:scale-[0.99] touch-manipulation"
              >
                "Hindi me batao: Agar flight cancel ho jaye toh kitna refund milta hai?"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
