import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'

// Pages
import Dashboard      from './pages/Dashboard'
import GlobalMapPage  from './pages/GlobalMapPage'
import SearchPage     from './pages/SearchPage'
import FlightDetails  from './pages/FlightDetails'
import AssistantPage  from './pages/AssistantPage'
import TripsPage      from './pages/TripsPage'
import JourneyImpact  from './pages/JourneyImpactPage'
import TransferGuide  from './pages/TransferGuidePage'
import BaggagePage    from './pages/BaggagePage'
import HoldCheckPage  from './pages/HoldCheckPage'
import WalletPage     from './pages/WalletPage'
import SettingsPage   from './pages/SettingsPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'

import { createClient } from '@supabase/supabase-js'

// Supabase client (graceful fallback if not configured)
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = (url && key && !url.includes('your-') && !url.includes('undefined'))
  ? createClient(url, key)
  : null

export { supabase }

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin  = (u) => setUser(u)
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }

  const token = user?.access_token || 'demo-token'

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse">
            <span className="text-white text-lg">✈</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading AeroMate…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-50 flex">
        <Sidebar user={user} onLogout={handleLogout} />

        {/* Main content area — offset for sidebar */}
        <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/"          element={<Dashboard token={token} />} />
              <Route path="/map"       element={<GlobalMapPage />} />
              <Route path="/search"    element={<SearchPage />} />
              <Route path="/flight/:flightNumber" element={<FlightDetails token={token} />} />
              <Route path="/trips"     element={<TripsPage token={token} />} />
              <Route path="/impact"    element={<JourneyImpact />} />
              <Route path="/transfer"  element={<TransferGuide />} />
              <Route path="/baggage"   element={<BaggagePage />} />
              <Route path="/hold"      element={<HoldCheckPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/wallet"    element={<WalletPage token={token} />} />
              <Route path="/settings"  element={<SettingsPage user={user} />} />
              <Route path="/login"     element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/signup"    element={<SignupPage onSignup={handleLogin} />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
