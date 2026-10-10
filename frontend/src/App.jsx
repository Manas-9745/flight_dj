import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import FlightDetails from './pages/FlightDetails'
import AssistantPage from './pages/AssistantPage'
import TripsPage from './pages/TripsPage'
import DisruptionCenter from './pages/DisruptionCenter'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

export default function App() {
  const [user, setUser] = useState(null)
  const token = 'demo-token'

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-aeromate-bg text-aeromate-ink flex flex-col font-sans">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/flight/:flightNumber" element={<FlightDetails token={token} />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/trips" element={<TripsPage token={token} />} />
            <Route path="/disruption" element={<DisruptionCenter />} />
            <Route path="/login" element={<LoginPage onLogin={setUser} />} />
            <Route path="/signup" element={<SignupPage onSignup={setUser} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
