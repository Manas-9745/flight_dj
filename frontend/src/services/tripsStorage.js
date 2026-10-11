/**
 * Local fallback and offline sync store for Saved Journeys (Trips).
 * Guarantees that saved flights appear immediately on device even with network latency or offline mode.
 */

function getKey(userId) {
  const cleanId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest'
  return `aeromate_saved_trips_${cleanId}`
}

export function getLocalTrips(userId) {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.warn('Error reading local trips:', e)
    return []
  }
}

export function saveLocalTrip(trip, userId) {
  if (typeof window === 'undefined') return
  try {
    const key = getKey(userId)
    const current = getLocalTrips(userId)
    
    // Normalize properties
    const flightNum = (trip.flight_number || trip.flightNumber || '').toUpperCase()
    const orig = (trip.origin || '').toUpperCase()
    const dest = (trip.destination || '').toUpperCase()
    const travelDate = trip.travel_date || trip.travelDate || new Date().toISOString().split('T')[0]

    // Format consistent with API data structure
    const formattedTrip = {
      id: trip.id || `local-trip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId || 'guest',
      flight_number: flightNum,
      airline: trip.airline || 'Airlines',
      origin: orig,
      destination: dest,
      travel_date: travelDate,
      status: trip.status || 'scheduled',
      metadata: trip.metadata || {},
      created_at: trip.created_at || new Date().toISOString()
    }

    // Deduplicate against existing by flight number and travel date
    const filtered = current.filter(t => {
      const match = (t.flight_number || t.flightNumber) === flightNum &&
                    (t.travel_date || t.travelDate) === travelDate
      return !match
    })

    const updated = [formattedTrip, ...filtered]
    localStorage.setItem(key, JSON.stringify(updated))
    return formattedTrip
  } catch (e) {
    console.warn('Error saving local trip:', e)
  }
}

export function deleteLocalTrip(tripId, userId) {
  if (typeof window === 'undefined') return
  try {
    const key = getKey(userId)
    const current = getLocalTrips(userId)
    const updated = current.filter(t => t.id !== tripId)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (e) {
    console.warn('Error deleting local trip:', e)
  }
}
