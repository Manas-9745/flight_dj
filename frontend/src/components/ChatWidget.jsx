import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Globe, RotateCcw } from 'lucide-react'
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
  "What are my rights if my flight is delayed over 3 hours?",
  "How do I get a refund for a cancelled flight?",
  "What should I do about my connecting flight?",
  "Can I get lounge access during my delay?",
]

export default function ChatWidget({ flightContext, defaultLanguage = 'en' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm **AeroMate AI**, your aviation travel companion.\n\nI can help you understand flight updates, explain your passenger rights (EU261, DGCA, US DOT), and guide you through delays or cancellations.\n\nAsk me anything about your journey!`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState(defaultLanguage)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return
    setInput('')
    setError(null)

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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data?.reply || "I couldn't process that. Please try again."
      }])
    } catch {
      setError('Unable to reach the AI assistant. Please check your connection.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connection error — please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = (content) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm **AeroMate AI**, your aviation travel companion.\n\nAsk me anything about your journey!`,
    }])
    setInput('')
    setError(null)
  }

  return (
    <div className="bg-white border border-surface-200 rounded-2xl shadow-card flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-navy-700 text-sm">AeroMate AI</div>
            <div className="flex items-center gap-1.5 text-xs text-teal-500 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Online · {LANGUAGES.find(l => l.code === language)?.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="text-xs border border-surface-200 bg-white rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button onClick={resetChat} title="New conversation" className="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-surface-100 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Flight context banner */}
      {flightContext && (
        <div className="px-5 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center gap-2 text-xs text-brand-700">
          <span className="font-semibold">{flightContext.flightNumber}</span>
          <span className="text-brand-400">·</span>
          <span>{flightContext.airline}</span>
          <span className="text-brand-400">·</span>
          <span className="capitalize">{flightContext.status}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'assistant'
                ? 'bg-brand-50 border border-brand-200'
                : 'bg-navy-700 border border-navy-700'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-brand-500" />
                : <User className="w-4 h-4 text-white" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-surface-50 border border-surface-200 text-navy-700 rounded-tl-sm'
                : 'bg-brand-500 text-white rounded-tr-sm'
            }`}
              dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-500" />
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
              <span className="text-slate-500 text-sm">Thinking…</span>
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
              className="text-xs text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-full px-3 py-1.5 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-surface-200 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about your flight, rights, or next steps…"
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
