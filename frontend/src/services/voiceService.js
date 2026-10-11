/**
 * Voice Service for AeroMate
 * Provides Web Speech Recognition (Speech-to-Text) and Speech Synthesis (Text-to-Speech)
 * with multi-language support and automated voice commands.
 */

const LANG_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
}

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false
  return !!window.speechSynthesis
}

/**
 * Clean markdown and symbols for natural voice narration
 */
export function cleanTextForSpeech(text) {
  if (!text) return ''
  return text
    .replace(/[*_#`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Text-to-Speech reader
 */
export function speakText(text, langCode = 'en', onEnd = null) {
  if (!isSpeechSynthesisSupported()) return false

  try {
    window.speechSynthesis.cancel() // Stop any previous speech
    const clean = cleanTextForSpeech(text)
    if (!clean) return false

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = LANG_MAP[langCode] || 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    if (onEnd) {
      utterance.onend = onEnd
      utterance.onerror = onEnd
    }

    window.speechSynthesis.speak(utterance)
    return true
  } catch (err) {
    console.warn('Speech synthesis error:', err)
    return false
  }
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Start listening for voice input
 */
export function startListening({ langCode = 'en', onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error('Voice recognition is not supported on this browser.'))
    return null
  }

  try {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRec()
    recognition.lang = LANG_MAP[langCode] || 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }

      if (onResult) {
        onResult({ final: final.trim(), interim: interim.trim() })
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      if (onError) onError(event)
    }

    recognition.onend = () => {
      if (onEnd) onEnd()
    }

    recognition.start()
    return recognition
  } catch (err) {
    if (onError) onError(err)
    return null
  }
}

/**
 * Parse high-level voice navigation commands to eliminate manual typing and clicking
 */
export function parseVoiceAction(transcript) {
  if (!transcript || typeof transcript !== 'string') return null
  const text = transcript.toLowerCase().trim()

  if (text.includes('search flight') || text.includes('find flight') || text.includes('book flight') || text.includes('go to search')) {
    return { type: 'navigate', path: '/search', label: 'Opening Flight Search' }
  }

  if (text.includes('my journey') || text.includes('saved journey') || text.includes('saved flight') || text.includes('my flight') || text.includes('my trips')) {
    return { type: 'navigate', path: '/trips', label: 'Opening Saved Journeys' }
  }

  if (text.includes('wallet') || text.includes('my documents') || text.includes('boarding pass') || text.includes('passport')) {
    return { type: 'navigate', path: '/wallet', label: 'Opening Travel Wallet' }
  }

  if (text.includes('disruption') || text.includes('cancelled') || text.includes('delay recovery') || text.includes('claim')) {
    return { type: 'navigate', path: '/disruption', label: 'Opening Disruption Center' }
  }

  if (text.includes('airport navigation') || text.includes('airport guide') || text.includes('terminal guide') || text.includes('gate directions')) {
    return { type: 'navigate', path: '/navigation', label: 'Opening Airport Guide' }
  }

  if (text.includes('live alert') || text.includes('crisis') || text.includes('advisories') || text.includes('notam')) {
    return { type: 'navigate', path: '/alerts', label: 'Opening Live Alerts' }
  }

  if (text.includes('radar') || text.includes('map') || text.includes('global map')) {
    return { type: 'navigate', path: '/map', label: 'Opening Flight Radar Map' }
  }

  return null
}
