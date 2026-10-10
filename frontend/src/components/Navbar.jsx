import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { getAlerts } from '../services/api'

export default function Navbar({ user, onLogout }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    getAlerts().then(res => {
      if (res?.alerts) setAlerts(res.alerts)
    }).catch(() => {})
  }, [])

  const navLinks = [
    { name: 'Live Alerts', path: '/alerts' },
    { name: 'Disruptions', path: '/disruption' },
    { name: 'Airport Guide', path: '/navigation' },
    { name: 'Search & Flights', path: '/search' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Global Map', path: '/map' },
    { name: 'My Journeys', path: '/trips' },
    { name: 'Baggage', path: '/baggage' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0]/90 backdrop-blur-md border-b border-[#E5E5E0] transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">

          {/* Brand — Refined, Clean Wordmark */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-600 transition-colors">
              ✈
            </div>
            <div className="flex items-baseline">
              <span className="font-display font-bold text-xl sm:text-2xl text-[#0D0D0D] tracking-tight leading-none">
                AeroMate
              </span>
              <span className="text-blue-600 font-semibold text-xs ml-0.5">®</span>
            </div>
          </Link>

          {/* Desktop Nav — Clean, Minimal */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-300 ${
                  isActive(link.path)
                    ? 'text-[#0D0D0D] font-semibold border-b-2 border-[#1A1A1A] pb-1'
                    : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side — Notifications, Auth & Mobile Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationCenter alerts={alerts} />
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs font-medium text-[#6B6B6B]">{user.email || 'Passenger'}</span>
                <button
                  onClick={onLogout}
                  className="text-xs font-semibold text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex btn-primary text-xs py-2 px-4"
              >
                Sign in
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-black transition-all duration-300"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-[#F5F5F0] z-40 animate-fade-in overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-12">
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-lg sm:text-xl font-semibold py-2 transition-all duration-200 ${
                    isActive(link.path) ? 'text-[#0D0D0D] font-bold' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="mt-12 pt-8 border-t border-[#E5E5E0] flex flex-wrap gap-4">
              {user ? (
                <button onClick={() => { onLogout(); setMobileMenuOpen(false) }} className="btn-primary">
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary">
                    Sign in
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-secondary">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
