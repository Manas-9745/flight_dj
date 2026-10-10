import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 12000,
})

// ── Flights ───────────────────────────────────────────────────────────────────

export const searchFlights = ({ origin, destination, date, adults = 1 }) =>
  api.get('/flights/search', { params: { origin, destination, date, adults } }).then(r => r.data)

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

// ── Health ────────────────────────────────────────────────────────────────────

export const getHealth = () =>
  api.get('/health').then(r => r.data)
