import React from 'react'
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  if (!isOnline) {
    return (
      <aside aria-label="Offline Mode Status" className="bg-[#1A1A1A] text-white px-4 py-2.5 border-b border-[#2A2A2A] transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="font-medium text-[#E5E5E0]">
              <span className="font-bold text-white">Offline Mode:</span> You are viewing cached app shell. Live flight telemetry, AI queries, and booking updates resume once reconnected.
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-wider bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 font-semibold shrink-0">
            Offline
          </span>
        </div>
      </aside>
    )
  }

  // Brief green banner when reconnected
  return (
    <aside aria-label="Connection Status" className="bg-emerald-950/90 text-emerald-100 px-4 py-2 border-b border-emerald-800/40 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="font-medium">
            Connection restored. AeroMate live feeds and assistant active.
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold shrink-0">
          Online
        </span>
      </div>
    </aside>
  )
}
