import axios from 'axios'

/**
 * Resolve API Base URL:
 * - If VITE_API_BASE_URL is set (e.g., http://10.42.113.149:5000 in LAN mode or https://api.domain.com in production), use it.
 * - Otherwise in browser development, default to '/api' which Vite proxies to backend:5000.
 */
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/$/, '')
    // If client is loading from a mobile phone (LAN IP), auto-map localhost to host IP so phone doesn't fail
    if (typeof window !== 'undefined' && window.location?.hostname &&
        window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      clean = clean.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname)
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`
  }
  return '/api'
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
})

// Request & Response Interceptors for debugging network & mobile CORS issues
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      console.warn(`[AeroMate API Network Error]: Cannot reach backend at ${api.defaults.baseURL}. Ensure your backend server is running and accessible on your Wi-Fi network.`)
    }
    return Promise.reject(error)
  }
)

// ── Flights ───────────────────────────────────────────────────────────────────

export const searchAirports = (q) =>
  api.get('/flights/airports', { params: { q } }).then(r => r.data)

export const searchFlights = ({ origin, destination, date, returnDate, adults = 1, children = 0, cabinClass = 'ECONOMY', currency = 'USD' }) =>
  api.get('/flights/search', {
    params: { origin, destination, date, returnDate: returnDate || undefined, adults, children, cabinClass, currency }
  }).then(r => r.data)

export const getFlightStatus = (flightNumber) =>
  api.get(`/flights/${flightNumber}/status`).then(r => r.data)

export const getFlightPosition = (flightNumber) =>
  api.get(`/flights/${flightNumber}/position`).then(r => r.data)

// ── Stats & Live Map ──────────────────────────────────────────────────────────

export const getStats = () =>
  api.get('/flights/stats').then(r => r.data)

export const getLiveFlights = (bbox = null) => {
  const params = bbox ? {
    minLat: bbox.minLat, minLon: bbox.minLon,
    maxLat: bbox.maxLat, maxLon: bbox.maxLon
  } : {}
  return api.get('/flights/live', { params }).then(r => r.data)
}

// ── AI Assistant ──────────────────────────────────────────────────────────────

export const sendChatMessage = ({ message, flightContext, language, history }) =>
  api.post('/assistant/chat', { message, flightContext, language, history }).then(r => r.data)

export const getTransferGuide = ({ inboundFlight, outboundFlight, language }) =>
  api.post('/assistant/transfer', { inboundFlight, outboundFlight, language }).then(r => r.data)

export const getJourneyImpact = ({ segments, disruption, language }) =>
  api.post('/assistant/impact', { segments, disruption, language }).then(r => r.data)

export const getBaggageGuidance = ({ flightNumber, airline, status, segments, language }) =>
  api.post('/assistant/baggage', { flightNumber, airline, status, segments, language }).then(r => r.data)

export const getHoldConsequences = ({ currentTrip, proposedChange, language }) =>
  api.post('/assistant/hold-check', { currentTrip, proposedChange, language }).then(r => r.data)

// ── Trips (Authenticated) ────────────────────────────────────────────────────

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token || 'demo-token'}` } })

export const getTrips = (token) =>
  api.get('/trips', authHeader(token)).then(r => r.data)

export const saveTrip = (tripData, token) =>
  api.post('/trips', tripData, authHeader(token)).then(r => r.data)

export const deleteTrip = (id, token) =>
  api.delete(`/trips/${id}`, authHeader(token)).then(r => r.data)

// ── Live Crisis & Aviation Alerts (Feature 11) ────────────────────────────────

export const getAlerts = (params = {}) =>
  api.get('/alerts', { params }).then(r => r.data)

export const getAlertsStatus = () =>
  api.get('/alerts/status').then(r => r.data)

export const getAlertById = (id) =>
  api.get(`/alerts/${id}`).then(r => r.data)

export const checkRouteImpact = ({ flightNumber, origin, destination, connectingAirports, date }) =>
  api.post('/alerts/impact', { flightNumber, origin, destination, connectingAirports, date }).then(r => r.data)

export const getAlertAiSummary = (id) =>
  api.post(`/alerts/${id}/ai-summary`).then(r => r.data)

// ── Airport Navigation & Check-in Assistant ───────────────────────────────────

export const getAirportNavigationGuide = (params) =>
  api.post('/assistant/navigation/guide', params).then(r => r.data)

export const getTerminalRegistry = () =>
  api.get('/assistant/navigation/terminals').then(r => r.data)

// ── AI Disruption Manager & Whole-Journey Recovery ─────────────────────────────

export const getDisruptionMonitoring = (token) =>
  api.get('/disruptions/monitoring', authHeader(token)).then(r => r.data)

export const findAlternativeFlights = (params, token) =>
  api.post('/disruptions/alternatives', params, authHeader(token)).then(r => r.data)

export const getDisruptionImpact = (params, token) =>
  api.post('/disruptions/impact', params, authHeader(token)).then(r => r.data)

export const proposeItineraryRecovery = (params, token) =>
  api.post('/disruptions/propose', params, authHeader(token)).then(r => r.data)

export const applyItineraryUpdate = (params, token) =>
  api.post('/disruptions/apply', params, authHeader(token)).then(r => r.data)

export const dismissDisruptionAlert = (alertId, token) =>
  api.post('/disruptions/dismiss', { alertId }, authHeader(token)).then(r => r.data)

export const getDisruptionHotelRecommendations = (params, token) =>
  api.post('/disruptions/hotels', params, authHeader(token)).then(r => r.data)

// ── Quick-Dial Assistance Pad (Quick Help) ───────────────────────────────────

export const getQuickHelpCommands = () =>
  api.get('/quick-help/commands').then(r => r.data)

export const resolveQuickHelpCommand = (params) =>
  api.post('/quick-help/resolve', params).then(r => r.data)

export const getQuickHelpLogs = () =>
  api.get('/quick-help/logs').then(r => r.data)

export const logQuickHelpExecution = (params) =>
  api.post('/quick-help/log', params).then(r => r.data)

// ── Health ────────────────────────────────────────────────────────────────────

export const getHealth = () =>
  api.get('/health').then(r => r.data)


