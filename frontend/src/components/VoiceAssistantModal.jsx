import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, X, ArrowRight,
  Loader2, Globe, Bot, Navigation
} from 'lucide-react'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startListening,
  speakText,
  stopSpeaking,
  parseVoiceAction
} from '../services/voiceService'
import { sendChatMessage } from '../services/api'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' }
]

export default function VoiceAssistantModal({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState('en')
  const [statusMessage, setStatusMessage] = useState('Tap to speak')
  const [textInput, setTextInput] = useState('')
  const recognitionRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setTranscript('')
      setInterimText('')
      setResponse('')
      handleStartListening()
    } else {
      handleStopListening()
      stopSpeaking()
      setIsSpeaking(false)
    }

    return () => {
      handleStopListening()
      stopSpeaking()
    }
  }, [isOpen])

  const handleStartListening = () => {
    stopSpeaking()
    setIsSpeaking(false)
    setResponse('')
    setTranscript('')
    setInterimText('')
    setStatusMessage('Listening… speak now')
    setIsListening(true)

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (e) {}
    }

    const rec = startListening({
      langCode: language,
      onResult: ({ final, interim }) => {
        if (interim) setInterimText(interim)
        if (final) {
          setTranscript(final)
          setInterimText('')
          setIsListening(false)
          handleProcessVoiceInput(final)
        }
      },
      onError: (err) => {
        console.warn('Voice recognition error:', err)
        setIsListening(false)
        const errorType = err?.error || err?.message || ''
        if (errorType === 'not-allowed' || errorType === 'permission-denied') {
          setStatusMessage('Microphone access blocked. Allow mic in browser or type below.')
        } else if (errorType === 'no-speech') {
          setStatusMessage('No speech detected. Tap mic and speak or type below.')
        } else if (errorType === 'network') {
          setStatusMessage('Speech network error. Tap mic again or type below.')
        } else {
          setStatusMessage('Could not hear clearly. Tap mic or type below.')
        }
      },
      onEnd: () => {
        setIsListening(false)
      }
    })

    recognitionRef.current = rec
  }

  const handleStopListening = () => {
    setIsListening(false)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
      recognitionRef.current = null
    }
  }

  const handleProcessVoiceInput = async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return

    // 1. Check for quick voice navigation commands
    const action = parseVoiceAction(spokenText)
    if (action && action.type === 'navigate') {
      setStatusMessage(action.label)
      speakText(`${action.label}`, language, () => {
        setIsSpeaking(false)
      })
      setIsSpeaking(true)
      setTimeout(() => {
        onClose()
        navigate(action.path)
      }, 1000)
      return
    }

    // 2. Query AI Concierge for flight or passenger rights answers
    setLoading(true)
    setStatusMessage('Thinking…')

    try {
      const res = await sendChatMessage({
        message: spokenText,
        language,
        history: []
      })

      const reply = res.data?.reply || res.reply || 'Here is the flight guidance.'
      setResponse(reply)
      setStatusMessage('Answer ready')

      // Speak answer out loud
      setIsSpeaking(true)
      speakText(reply, language, () => {
        setIsSpeaking(false)
      })
    } catch (err) {
      const errMsg = 'I had trouble getting that info. Please try again.'
      setResponse(errMsg)
      setStatusMessage('Error')
      speakText(errMsg, language)
    } finally {
      setLoading(false)
    }
  }

  const toggleSpeechPlayback = () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else if (response) {
      setIsSpeaking(true)
      speakText(response, language, () => {
        setIsSpeaking(false)
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E0] relative space-y-6 my-auto animate-scale-up">
        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeaking()
            handleStopListening()
            onClose()
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-[#6B6B6B] hover:text-[#0D0D0D] hover:bg-[#FAFAF7] transition-all"
          aria-label="Close voice assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#0D0D0D] leading-none">
                AeroMate Voice
              </h2>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">Hands-free flight assistant</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-[#FAFAF7] px-2.5 py-1 rounded-full border border-[#E5E5E0]">
            <Globe className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
                stopSpeaking()
              }}
              className="bg-transparent text-xs font-semibold text-[#0D0D0D] focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Mic Visualizer */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
          <div className="relative">
            {/* Animated sound ripples */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-blue-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={() => {
                if (isListening) {
                  handleStopListening()
                } else {
                  handleStartListening()
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 shadow-lg ${
                isListening
                  ? 'bg-blue-600 text-white scale-105 shadow-blue-500/40'
                  : 'bg-[#1A1A1A] text-white hover:bg-black active:scale-95'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
              {statusMessage}
            </p>
            {isListening && (
              <p className="text-[11px] text-[#6B6B6B]">
                Say "Search flights", "Open wallet", or ask any travel question
              </p>
            )}
          </div>
        </div>

        {/* Spoken Text Display */}
        {(transcript || interimText) && (
          <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] text-xs">
            <span className="text-[10px] text-[#8C8C85] font-semibold block uppercase">You said:</span>
            <p className="text-[#0D0D0D] font-medium mt-0.5">
              "{transcript || interimText}"
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#52524E]">
            <Loader2 className="w-4 h-4 animate-spin text-[#246BFD]" />
            <span>Finding answers…</span>
          </div>
        )}

        {/* AI Answer & Speech Controls */}
        {response && !loading && (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#246BFD]" /> AeroMate Concierge
              </span>
              <button
                onClick={toggleSpeechPlayback}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-800 hover:text-blue-950 px-2 py-1 rounded-md bg-white/80 border border-blue-200"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-rose-600" /> Stop Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-blue-600" /> Read Out Loud
                  </>
                )}
              </button>
            </div>
            <p className="text-blue-950 leading-relaxed font-normal whitespace-pre-line max-h-48 overflow-y-auto pr-1">
              {response.replace(/\*\*/g, '')}
            </p>
          </div>
        )}

        {/* Manual Query Input (Fallback if Mic is blocked or unclear) */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!textInput.trim()) return
            const val = textInput.trim()
            setTextInput('')
            setTranscript(val)
            handleProcessVoiceInput(val)
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type a question / command here…"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#FAFAF7] text-xs text-[#0D0D0D] placeholder-[#8C8C85] focus:outline-none focus:ring-1 focus:ring-[#246BFD] focus:bg-white"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </form>

        {/* Quick Voice Command Hints */}
        <div className="pt-2 border-t border-[#E5E5E0] flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          <span className="text-[#8C8C85]">Try saying:</span>
          {['Search flights', 'Open wallet', 'Saved journeys', '4 hr delay rights'].map((hint, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(hint)
                handleProcessVoiceInput(hint)
              }}
              className="px-2.5 py-1 rounded-full bg-[#FAFAF7] hover:bg-[#EAEAE5] border border-[#E5E5E0] text-[#1A1A1A] font-medium transition-colors"
            >
              "{hint}"
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
