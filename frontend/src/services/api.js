import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// ── Flights ──────────────────────────────────────────────────────────────────

export const searchFlights = ({ origin, destination, date, adults = 1 }) =>
  api.get('/flights/search', { params: { origin, destination, date, adults } }).then(r => r.data)

export const getFlightStatus = (flightNumber) =>
  api.get(`/flights/${flightNumber}/status`).then(r => r.data)

export const getFlightPosition = (flightNumber) =>
  api.get(`/flights/${flightNumber}/position`).then(r => r.data)

// ── AI Assistant ─────────────────────────────────────────────────────────────

export const sendChatMessage = ({ message, flightContext, language, history }) =>
  api.post('/assistant/chat', { message, flightContext, language, history }).then(r => r.data)

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
