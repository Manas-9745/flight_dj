import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Globe, Plane, Zap } from 'lucide-react'
import { sendChatMessage } from '../services/api'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
]

const QUICK_PROMPTS = [
  'What are my rights if my flight is delayed?',
  'How do I get a refund for a cancelled flight?',
  'Can I get lounge access during my delay?',
  'What should I do about my connecting flight?',
]

export default function ChatWidget({ flightContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `✈️ Hello! I'm **AeroMate**, your AI travel companion.\n\nI can help you understand flight updates, explain your passenger rights, and guide you through delays or cancellations.\n\nAsk me anything about your journey!`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      setMessages(prev => [...prev, { role: 'assistant', content: res.data?.reply || 'I couldn\'t process that. Please try again.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unable to reach the AI assistant right now. Please check your backend connection.' }])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = (content) => {
    // Simple bold markdown support
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
  }

  return (
    <div className="card flex flex-col h-[600px] p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <Bot className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="font-display font-semibold text-white text-sm">AeroMate AI</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code} style={{ background: '#0c1425' }}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === 'assistant'
                ? 'bg-sky-500/20 border border-sky-500/30 text-sky-400'
                : 'bg-slate-700 border border-slate-600 text-slate-300'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-white/5 border border-white/8 text-slate-200'
                : 'bg-sky-500/15 border border-sky-500/20 text-sky-100 rounded-tr-sm'
            }`}
              dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p)}
              className="text-xs text-sky-400 border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/15 rounded-full px-3 py-1.5 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-white/8 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about your flight, rights, or next steps..."
          className="input-field flex-1 text-sm py-2.5"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
