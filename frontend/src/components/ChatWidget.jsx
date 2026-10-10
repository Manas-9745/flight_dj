import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Globe, Sparkles } from 'lucide-react'
import { sendChatMessage } from '../services/api'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
]

const QUICK_PROMPTS = [
  'What are my rights if my flight is delayed?',
  'How do I get a refund for a cancelled flight?',
  'Can I get meal vouchers or lounge access?',
  'What should I do about my connecting flight?',
]

export default function ChatWidget({ flightContext, className = '' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `✈️ Hello! I'm **AeroMate AI**, your dedicated travel concierge.\n\nI can help you understand real-time flight updates, calculate disruption compensation under DGCA / EU261 regulations, and guide your journey in multiple languages.\n\nHow can I help you today?`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return
    setInput('')

    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const res = await sendChatMessage({
        message: userMessage,
        flightContext: flightContext || null,
        language,
        history,
      })
      const replyText = res.data?.reply || res.reply || 'I processed your request. How else can I assist?'
      setMessages(prev => [...prev, { role: 'assistant', content: replyText }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I couldn\'t connect to the AI engine right now. Please verify backend service availability or try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-aeromate-text">$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className={`surface-card p-0 flex flex-col h-[580px] border border-slate-200 shadow-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aeromate-paleBlue border border-aeromate-blue/20 flex items-center justify-center text-aeromate-blue shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-aeromate-text text-sm flex items-center gap-2">
              AeroMate AI Concierge
              <span className="text-[10px] bg-blue-100 text-aeromate-blue font-bold px-2 py-0.5 rounded-full border border-blue-200">
                Live Assistant
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected · Gemini 2.5 Engine
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-aeromate-blue shadow-sm"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flight Context Chip if available */}
      {flightContext && (
        <div className="bg-amber-50/80 border-b border-amber-200 px-5 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Context Active: <strong>{flightContext.flightNumber || 'AI645'}</strong> ({flightContext.origin || 'BOM'} → {flightContext.destination || 'DEL'})
          </span>
          <span className="text-[11px] text-amber-700 font-semibold bg-white/80 px-2 py-0.5 rounded border border-amber-300">
            Tailored Q&A
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4 bg-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${msg.role === 'assistant'
                ? 'bg-aeromate-paleBlue border border-blue-200 text-aeromate-blue'
                : 'bg-aeromate-text text-white'
              }`}>
              {msg.role === 'assistant' ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
            </div>

            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'assistant'
                ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
                : 'bg-aeromate-blue text-white font-medium shadow-md shadow-aeromate-blue/20 rounded-tr-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-aeromate-paleBlue border border-blue-200 flex items-center justify-center text-aeromate-blue">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-aeromate-muted text-sm shadow-sm">
              <Loader2 className="w-4 h-4 text-aeromate-blue animate-spin" />
              <span>Analyzing passenger rights & regulations...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p)}
              className="text-xs text-aeromate-blue border border-blue-200 bg-aeromate-paleBlue/60 hover:bg-blue-100 rounded-full px-3 py-1 font-medium transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about refunds, delay rules, lounge access, or baggage..."
          className="input-field flex-1 text-sm py-2.5 bg-white border-slate-200"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

