import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Plane } from 'lucide-react'
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
    { name: 'Search & Flights', path: '/search' },
    { name: 'Travel Wallet', path: '/wallet' },
    { name: 'Quick Help', path: '/quick-help' },
    { name: 'Live Alerts', path: '/alerts' },
    { name: 'Disruptions', path: '/disruption' },
    { name: 'Airport Guide', path: '/navigation' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Global Map', path: '/map' },
    { name: 'My Journeys', path: '/trips' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0]/95 backdrop-blur-md border-b border-[#E5E5E0] transition-all duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Brand — Refined, Clean Wordmark (20-22px) */}
          <Link to="/" className="flex items-center gap-2.5 group py-1 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-[#246BFD] transition-colors">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display font-bold text-[20px] sm:text-[22px] text-[#0D0D0D] tracking-tight leading-none">
                AeroMate
              </span>
              <span className="text-[#246BFD] font-bold text-xs ml-0.5">®</span>
            </div>
          </Link>

          {/* Desktop Nav — Centered, Even Gaps, Strictly No Awkward Wrapping */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5.5 2xl:gap-6 flex-1 justify-center px-4 overflow-hidden">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[13.5px] xl:text-[14px] transition-colors py-1 relative whitespace-nowrap font-medium ${
                    active
                      ? 'text-[#0D0D0D] font-semibold'
                      : 'text-[#5C5C57] hover:text-[#0D0D0D]'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#1A1A1A] rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Side — Notifications, Auth & Mobile Menu Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <NotificationCenter alerts={alerts} />
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs font-medium text-[#6B6B6B] truncate max-w-[130px]">{user.email || 'Passenger'}</span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-semibold text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors py-1.5 px-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-semibold bg-[#1A1A1A] hover:bg-black text-white transition-colors shadow-sm"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-black active:scale-95 transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[calc(4.25rem+env(safe-area-inset-top,0px))] bg-[#F5F5F0] z-40 animate-fade-in overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-12">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center min-h-[46px] text-base font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:bg-black/5 ${
                    isActive(link.path) ? 'text-[#0D0D0D] bg-black/5 font-bold' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#E5E5E0] flex flex-wrap gap-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => { onLogout(); setMobileMenuOpen(false) }}
                  className="btn-primary min-h-[44px] w-full sm:w-auto"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary min-h-[44px] flex-1 text-center justify-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary min-h-[44px] flex-1 text-center justify-center"
                  >
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
