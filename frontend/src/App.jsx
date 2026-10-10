import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import OfflineBanner from './components/OfflineBanner'
import InstallPrompt from './components/InstallPrompt'

// Pages
import Dashboard      from './pages/Dashboard'
import GlobalMapPage  from './pages/GlobalMapPage'
import SearchPage     from './pages/SearchPage'
import FlightDetails  from './pages/FlightDetails'
import AssistantPage  from './pages/AssistantPage'
import TripsPage      from './pages/TripsPage'
import DisruptionCenter from './pages/DisruptionCenter'
import JourneyImpact  from './pages/JourneyImpactPage'
import TransferGuide  from './pages/TransferGuidePage'
import BaggagePage    from './pages/BaggagePage'
import HoldCheckPage  from './pages/HoldCheckPage'
import WalletPage     from './pages/WalletPage'
import SettingsPage   from './pages/SettingsPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'
import LiveAlertsPage from './pages/LiveAlertsPage'
import AirportNavigationPage from './pages/AirportNavigationPage'
import QuickHelpPage from './pages/QuickHelpPage'

import { createClient } from '@supabase/supabase-js'

// Supabase client (graceful fallback if not configured)
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = (url && key && !url.includes('your-') && !url.includes('undefined'))
  ? createClient(url, key)
  : null

export { supabase }

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aeromate_auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const safetyTimer = setTimeout(() => setAuthLoading(false), 500)

    if (!supabase) {
      clearTimeout(safetyTimer)
      setAuthLoading(false)
      return
    }

    // Get initial Supabase session safely
    supabase.auth.getSession()
      .then(({ data }) => {
        clearTimeout(safetyTimer)
        if (data?.session?.user) {
          const supaUser = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
            access_token: data.session.access_token
          }
          setUser(supaUser)
          localStorage.setItem('aeromate_auth_user', JSON.stringify(supaUser))
        }
        setAuthLoading(false)
      })
      .catch(() => {
        clearTimeout(safetyTimer)
        setAuthLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const supaUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          access_token: session.access_token
        }
        setUser(supaUser)
        localStorage.setItem('aeromate_auth_user', JSON.stringify(supaUser))
      } else if (!session) {
        // Only clear if Supabase was the authority
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogin = (u) => {
    setUser(u)
    try {
      localStorage.setItem('aeromate_auth_user', JSON.stringify(u))
    } catch (e) {
      console.warn('LocalStorage save error:', e)
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('Supabase logout error:', e)
      }
    }
    try {
      localStorage.removeItem('aeromate_auth_user')
    } catch (e) {
      // ignore
    }
    setUser(null)
  }

  // Token is strictly tied to the logged-in user. If not logged in, token is null.
  const token = user?.access_token || (user?.email ? ('usr_' + btoa(user.email.toLowerCase().trim())) : null)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center animate-pulse shadow-md">
            <span className="text-white text-lg font-display">✈</span>
          </div>
          <p className="text-sm text-[#6B6B6B] font-medium font-sans">Loading AeroMate®…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F5F5F0] text-[#0D0D0D] flex flex-col font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        <OfflineBanner />
        <main className="flex-1">
          <Routes>
            <Route path="/"          element={<Dashboard token={token} />} />
            <Route path="/quick-help" element={<QuickHelpPage token={token} />} />
            <Route path="/quick-dial" element={<QuickHelpPage token={token} />} />
            <Route path="/map"       element={<GlobalMapPage />} />
            <Route path="/search"    element={<SearchPage />} />
            <Route path="/flight/:flightNumber" element={<FlightDetails token={token} />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/disruption" element={<DisruptionCenter token={token} />} />
            <Route path="/alerts"    element={<LiveAlertsPage token={token} />} />
            <Route path="/navigation" element={<AirportNavigationPage token={token} />} />
            <Route path="/airport-navigation" element={<AirportNavigationPage token={token} />} />
            <Route path="/trips"     element={<TripsPage user={user} token={token} />} />
            <Route path="/impact"    element={<JourneyImpact />} />
            <Route path="/transfer"  element={<TransferGuide />} />
            <Route path="/baggage"   element={<BaggagePage />} />
            <Route path="/hold"      element={<HoldCheckPage />} />
            <Route path="/wallet"    element={<WalletPage user={user} token={token} />} />
            <Route path="/settings"  element={<SettingsPage user={user} />} />
            <Route path="/login"     element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/signup"    element={<SignupPage onSignup={handleLogin} />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <InstallPrompt />
      </div>
    </BrowserRouter>
  )
}
