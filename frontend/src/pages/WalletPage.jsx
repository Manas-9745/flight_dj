import { useState, useEffect } from 'react'
import {
  Archive, Wifi, WifiOff, RefreshCw, Download, FileText,
  Plane, Calendar, MapPin, CheckCircle2, AlertCircle, Plus, Trash2, Printer
} from 'lucide-react'
import { getTrips } from '../services/api'

export default function WalletPage({ token }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem('aeromate_wallet_sync_time'))
  const [manualTrip, setManualTrip] = useState({ flightNumber: '', airline: '', origin: '', destination: '', travelDate: '', terminal: '', gate: '', pnr: '' })
  const [showAddManual, setShowAddManual] = useState(false)

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync trips from server & cache in localStorage
  const syncWallet = async () => {
    setLoading(true)
    try {
      if (online) {
        const res = await getTrips(token)
        const serverTrips = res.data || []
        setTrips(serverTrips)
        localStorage.setItem('aeromate_offline_wallet', JSON.stringify(serverTrips))
        const now = new Date().toLocaleString()
        setLastSynced(now)
        localStorage.setItem('aeromate_wallet_sync_time', now)
      } else {
        // Load from cache
        const cached = localStorage.getItem('aeromate_offline_wallet')
        if (cached) setTrips(JSON.parse(cached))
      }
    } catch {
      const cached = localStorage.getItem('aeromate_offline_wallet')
      if (cached) setTrips(JSON.parse(cached))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load from cache or server
    const cached = localStorage.getItem('aeromate_offline_wallet')
    if (cached) {
      try { setTrips(JSON.parse(cached)) } catch {}
    }
    syncWallet()
  }, [token])

  const handleAddManualTrip = (e) => {
    e.preventDefault()
    if (!manualTrip.flightNumber || !manualTrip.origin || !manualTrip.destination) return
    const newEntry = {
      id: `manual_${Date.now()}`,
      flightNumber: manualTrip.flightNumber.toUpperCase(),
      airline: manualTrip.airline || 'AeroMate Scheduled',
      origin: manualTrip.origin.toUpperCase(),
      destination: manualTrip.destination.toUpperCase(),
      travelDate: manualTrip.travelDate || new Date().toISOString().split('T')[0],
      status: 'confirmed',
      metadata: {
        terminal: manualTrip.terminal || '—',
        gate: manualTrip.gate || '—',
        pnr: manualTrip.pnr || 'AEROPASS'
      }
    }
    const updated = [newEntry, ...trips]
    setTrips(updated)
    localStorage.setItem('aeromate_offline_wallet', JSON.stringify(updated))
    setManualTrip({ flightNumber: '', airline: '', origin: '', destination: '', travelDate: '', terminal: '', gate: '', pnr: '' })
    setShowAddManual(false)
  }

  const handleDeleteWalletTrip = (id) => {
    const updated = trips.filter(t => t.id !== id)
    setTrips(updated)
    localStorage.setItem('aeromate_offline_wallet', JSON.stringify(updated))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-navy-700">Offline Travel Wallet</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              online ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {online ? <Wifi className="w-3 h-3 text-teal-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
              {online ? 'Online (Synced)' : 'Offline Mode (Cached)'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Access boarding credentials, gate references, and terminal notes at 35,000 feet without Wi-Fi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={syncWallet}
            disabled={loading}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync Wallet'}
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF Pass
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-surface-100/70 border border-surface-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Local Snapshot Storage: <strong>{trips.length} Journey Passes Available Offline</strong></span>
        </div>
        <div>Last Synced: {lastSynced || 'Never'}</div>
      </div>

      {/* Add Manual Boarding Pass Trigger */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddManual(!showAddManual)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Save Emergency Offline Boarding Card
        </button>
      </div>

      {showAddManual && (
        <form onSubmit={handleAddManualTrip} className="bg-white border border-surface-200 rounded-2xl p-5 shadow-card space-y-3 text-xs animate-fade-in">
          <h3 className="font-display font-bold text-sm text-navy-700">Add Flight to Offline Cache</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-slate-500 block mb-1">Flight Number</label>
              <input
                type="text"
                placeholder="e.g. BA142"
                value={manualTrip.flightNumber}
                onChange={e => setManualTrip({ ...manualTrip, flightNumber: e.target.value })}
                className="input-field uppercase font-mono py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Airline</label>
              <input
                type="text"
                placeholder="British Airways"
                value={manualTrip.airline}
                onChange={e => setManualTrip({ ...manualTrip, airline: e.target.value })}
                className="input-field py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Origin (IATA)</label>
              <input
                type="text"
                maxLength={3}
                placeholder="LHR"
                value={manualTrip.origin}
                onChange={e => setManualTrip({ ...manualTrip, origin: e.target.value })}
                className="input-field uppercase font-mono py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Destination (IATA)</label>
              <input
                type="text"
                maxLength={3}
                placeholder="JFK"
                value={manualTrip.destination}
                onChange={e => setManualTrip({ ...manualTrip, destination: e.target.value })}
                className="input-field uppercase font-mono py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Terminal</label>
              <input
                type="text"
                placeholder="Terminal 5"
                value={manualTrip.terminal}
                onChange={e => setManualTrip({ ...manualTrip, terminal: e.target.value })}
                className="input-field py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Gate</label>
              <input
                type="text"
                placeholder="B34"
                value={manualTrip.gate}
                onChange={e => setManualTrip({ ...manualTrip, gate: e.target.value })}
                className="input-field py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Booking Ref / PNR</label>
              <input
                type="text"
                placeholder="X98Y1Z"
                value={manualTrip.pnr}
                onChange={e => setManualTrip({ ...manualTrip, pnr: e.target.value })}
                className="input-field uppercase font-mono py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Date</label>
              <input
                type="date"
                value={manualTrip.travelDate}
                onChange={e => setManualTrip({ ...manualTrip, travelDate: e.target.value })}
                className="input-field py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddManual(false)}
              className="btn-secondary py-1 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-1 px-4"
            >
              Save to Offline Wallet
            </button>
          </div>
        </form>
      )}

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {trips.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-surface-300 rounded-2xl p-12 text-center space-y-3">
            <Archive className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-display font-semibold text-navy-700">No Offline Passes Saved</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Save your trips while connected to the internet, and they will immediately be cached right here for offline viewing.
            </p>
          </div>
        ) : (
          trips.map(trip => (
            <div key={trip.id} className="bg-white border border-surface-200 rounded-2xl p-5 shadow-card space-y-4 hover:shadow-card-hover transition-all">
              {/* Card Top */}
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-navy-700 text-base">{trip.flightNumber}</span>
                    <span className="text-xs text-slate-400 block">{trip.airline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge-live text-[10px]">OFFLINE READY</span>
                  <button
                    onClick={() => handleDeleteWalletTrip(trip.id)}
                    className="text-slate-300 hover:text-red-500 p-1"
                    title="Remove from Wallet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-2xl font-display font-bold text-navy-700">{trip.origin}</div>
                  <div className="text-[11px] text-slate-400">Departure Airport</div>
                </div>
                <div className="text-slate-300 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-mono">NONSTOP</span>
                  <div className="w-16 h-[2px] bg-surface-200 my-1 relative">
                    <Plane className="w-3 h-3 text-brand-500 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-navy-700">{trip.destination}</div>
                  <div className="text-[11px] text-slate-400">Destination Airport</div>
                </div>
              </div>

              {/* Boarding Info Box */}
              <div className="grid grid-cols-3 gap-2 bg-surface-50 p-3 rounded-xl border border-surface-200 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Terminal</div>
                  <div className="font-bold text-navy-700">{trip.metadata?.terminal || 'T3'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Gate</div>
                  <div className="font-bold text-navy-700">{trip.metadata?.gate || 'B12'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Booking Ref</div>
                  <div className="font-mono font-bold text-brand-600">{trip.metadata?.pnr || 'AERO72'}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date: {trip.travelDate}
                </span>
                <span className="text-teal-600 font-medium">Verified Local Copy</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
