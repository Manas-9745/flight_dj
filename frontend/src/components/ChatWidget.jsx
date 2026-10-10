
import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Loader2,
  Globe,
  Sparkles
} from 'lucide-react'

// Clean base URL to prevent /api/api double prefixing
const rawApiBase = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = rawApiBase.replace(/\/api\/?$/, '')

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' }
]

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese'
}

const QUICK_PROMPTS = [
  'What are my rights if my flight is delayed?',
  'How do I get a refund for a cancelled flight?',
  'Can I get meal vouchers or lounge access?',
  'What should I do about my connecting flight?'
]

export default function ChatWidget({
  flightContext,
  className = ''
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am **AeroMate AI**, powered by ARINA AI.\n\n' +
        'I can help you understand flight disruptions, passenger rights, ' +
        'refunds, baggage, and travel planning in multiple languages.\n\n' +
        'How can I help you today?'
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userMessage = (text ?? input).trim()

    if (!userMessage || loading) return

    setInput('')

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userMessage
      }
    ])

    setLoading(true)

    try {
      const flightDetails = flightContext
        ? `\n\nFlight context: ${JSON.stringify(flightContext)}`
        : ''

      const chatUrl = API_BASE_URL
        ? `${API_BASE_URL}/api/arina/chat`
        : '/api/arina/chat'

      const response = await fetch(
        chatUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message:
              `Please respond in ${LANGUAGE_NAMES[language] || 'English'}. ` +
              'You are AeroMate AI, a helpful aviation and travel assistant. ' +
              'Be clear and practical. Do not invent flight status, ' +
              'legal entitlements, or compensation rules. Explain when ' +
              'details need verification. ' +
              userMessage +
              flightDetails,
            model: 'gpt-5-mini'
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed (${response.status})`
        )
      }

      const replyText =
        typeof data.reply === 'string' && data.reply.trim()
          ? data.reply
          : 'I could not generate a response. Please try again.'

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: replyText
        }
      ])
    } catch (error) {
      console.error('ARINA AI chat error:', error)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            `Sorry, I couldn't reach ARINA AI. ${error.message || 'Please check your connection and try again.'}`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Escape model-generated text before rendering it as HTML.
  // Only the supported bold Markdown syntax is converted to HTML.
  const renderMessage = (content = '') => {
    const escapeHtml = (value) =>
      value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char])

    return escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div
      className={`surface-card p-0 flex flex-col h-[580px] border border-[#E5E5E0] shadow-subtle overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFAF7] border-b border-[#E5E5E0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E5E0] flex items-center justify-center text-[#1A1A1A] shadow-sm">
            <Bot className="w-4 h-4" />
          </div>

          <div>
            <div className="font-display font-semibold text-[#0D0D0D] text-sm flex items-center gap-2">
              AeroMate Concierge
              <span className="text-[10px] bg-white text-[#52524E] font-medium px-2 py-0.5 rounded-full border border-[#E5E5E0]">
                ARINA AI
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#52524E] font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              AI travel assistant
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#52524E]" />

          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-white border border-[#E5E5E0] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#246BFD] shadow-sm"
            aria-label="Response language"
          >
            {LANGUAGES.map(item => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flight context */}
      {flightContext && (
        <div className="bg-[#FAFAF7] border-b border-[#E5E5E0] px-5 py-2 flex items-center justify-between text-xs text-[#1A1A1A] font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#246BFD]" />
            Flight Context:{' '}
            <strong>{flightContext.flightNumber || 'Unknown'}</strong>
            {' '}({flightContext.origin || 'Origin'} →{' '}
            {flightContext.destination || 'Destination'})
          </span>

          <span className="text-[11px] text-[#52524E] font-medium bg-white px-2 py-0.5 rounded border border-[#E5E5E0]">
            Tailored Q&A
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4 bg-white"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
          >
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${msg.role === 'assistant'
                  ? 'bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A]'
                  : 'bg-[#1A1A1A] text-white'
                }`}
            >
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4" />
                : <User className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${msg.role === 'assistant'
                  ? 'bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A]'
                  : 'bg-[#1A1A1A] text-white font-medium rounded-tr-sm'
                }`}
              dangerouslySetInnerHTML={{
                __html: renderMessage(msg.content)
              }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-[#FAFAF7] border border-[#E5E5E0] flex items-center justify-center text-[#1A1A1A]">
              <Bot className="w-4 h-4" />
            </div>

            <div className="bg-[#FAFAF7] border border-[#E5E5E0] rounded-2xl px-4 py-3 flex items-center gap-2.5 text-[#52524E] text-sm">
              <Loader2 className="w-4 h-4 text-[#246BFD] animate-spin" />
              <span>ARINA AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="px-5 py-2.5 bg-[#FAFAF7] border-t border-[#E5E5E0] flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="text-xs text-[#1A1A1A] border border-[#E5E5E0] bg-white hover:bg-[#FAFAF7] rounded-full px-3 py-1 font-medium transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="p-4 bg-[#FAFAF7] border-t border-[#E5E5E0] flex gap-3"
        onSubmit={event => {
          event.preventDefault()
          sendMessage()
        }}
      >
        <input
          type="text"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="Ask about refunds, delays, lounge access, or baggage..."
          className="flex-1 min-w-0 text-sm py-2 px-3.5 bg-white border border-[#E5E5E0] rounded-xl text-[#0D0D0D] focus:outline-none focus:border-[#246BFD]"
          disabled={loading}
          aria-label="Your message"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2 flex items-center justify-center disabled:opacity-50"
          aria-label="Send message"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
