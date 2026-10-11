import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Plane, Bookmark, Shield, Settings, LogOut, ChevronDown, Mic, Luggage } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { getAlerts } from '../services/api'

export default function Navbar({ user, onLogout, onOpenVoice }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const profileDropdownRef = useRef(null)

  useEffect(() => {
    getAlerts().then(res => {
      if (res?.alerts) setAlerts(res.alerts)
    }).catch(() => {})
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-close menus on navigation
  useEffect(() => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Main desktop navigation links (Wallet & Journeys moved under Profile Icon)
  const navLinks = [
    { name: 'Search Flights', path: '/search' },
    { name: 'Baggage Tracking', path: '/baggage' },
    { name: 'Quick Help', path: '/quick-help' },
    { name: 'Live Alerts', path: '/alerts' },
    { name: 'Disruptions', path: '/disruption' },
    { name: 'Airport Guide', path: '/navigation' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Global Map', path: '/map' },
  ]

  const isActive = (path) => location.pathname === path

  // Extract only the initial of the user's Gmail/email
  const userInitial = (
    user?.email ? user.email.trim().charAt(0) : (user?.name ? user.name.trim().charAt(0) : 'P')
  ).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0]/95 backdrop-blur-md border-b border-[#E5E5E0] transition-all duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Brand — Refined, Clean Wordmark */}
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

          {/* Right Side — Notifications, Voice Assistant, Profile Icon & Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {onOpenVoice && (
              <button
                type="button"
                onClick={onOpenVoice}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAFAF7] hover:bg-[#EAEAE5] text-[#0D0D0D] flex items-center justify-center border border-[#E5E5E0] transition-colors"
                title="AeroMate Voice Assistant"
                aria-label="AeroMate Voice Assistant"
              >
                <Mic className="w-4 h-4 text-[#246BFD]" />
              </button>
            )}
            <NotificationCenter alerts={alerts} />

            {/* User Profile Avatar with Dropdown */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  id="navbar-profile-button"
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-black/5 transition-all focus:outline-none"
                  aria-label="User Profile Menu"
                  title="Passenger Account"
                >
                  {/* Circular Avatar with ONLY Gmail Initial */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1A1A1A] hover:bg-[#246BFD] text-white flex items-center justify-center font-bold text-sm shadow-sm transition-colors border border-black/10 select-none">
                    {userInitial}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#6B6B6B] transition-transform duration-200 hidden sm:block ${
                      profileMenuOpen ? 'rotate-180 text-[#0D0D0D]' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E5E5E0] py-2 z-50 animate-slide-up font-sans">
                    {/* Header badge (only Gmail initial, no full email) */}
                    <div className="px-4 py-3 border-b border-[#F0F0EB] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0D0D0D] truncate">Passenger Profile</p>
                        <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Authenticated
                        </p>
                      </div>
                    </div>

                    {/* Options: My Journeys & Travel Wallet */}
                    <div className="py-1">
                      <Link
                        to="/trips"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#246BFD] flex items-center justify-center flex-shrink-0">
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0D0D0D]">My Journeys</p>
                          <p className="text-[10px] text-[#6B6B6B]">Saved flights & itineraries</p>
                        </div>
                      </Link>

                      <Link
                        to="/wallet"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0D0D0D]">Travel Wallet</p>
                          <p className="text-[10px] text-[#6B6B6B]">Passports, visas & passes</p>
                        </div>
                      </Link>

                      <Link
                        to="/baggage"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <Luggage className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0D0D0D]">Tracked Baggage</p>
                          <p className="text-[10px] text-[#6B6B6B]">Tags, status & recovery</p>
                        </div>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0D0D0D]">Settings</p>
                          <p className="text-[10px] text-[#6B6B6B]">Account preferences</p>
                        </div>
                      </Link>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-1 mt-1 border-t border-[#F0F0EB]">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          onLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                id="navbar-signin-button"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-semibold bg-[#1A1A1A] hover:bg-black text-white transition-colors shadow-sm"
              >
                Sign in
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
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
            {/* Mobile Profile or Sign In Card at the top of mobile menu */}
            {user ? (
              <div className="mb-4 pb-4 border-b border-[#E5E5E0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0D0D0D]">Passenger Profile</p>
                    <p className="text-xs text-emerald-600 font-medium">Account Active</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { onLogout(); setMobileMenuOpen(false) }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mb-4 pb-4 border-b border-[#E5E5E0] flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary min-h-[42px] flex-1 text-center justify-center text-xs font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary min-h-[42px] flex-1 text-center justify-center text-xs font-semibold"
                >
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile Navigation List */}
            <nav className="space-y-1">
              {/* Highlight Journeys & Wallet in Mobile Menu */}
              {user && (
                <>
                  <Link
                    to="/trips"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 min-h-[46px] text-base font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:bg-black/5 ${
                      isActive('/trips') ? 'text-[#0D0D0D] bg-black/5 font-bold' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 text-[#246BFD]" /> My Journeys
                  </Link>
                  <Link
                    to="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 min-h-[46px] text-base font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:bg-black/5 ${
                      isActive('/wallet') ? 'text-[#0D0D0D] bg-black/5 font-bold' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-600" /> Travel Wallet
                  </Link>
                  <Link
                    to="/baggage"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 min-h-[46px] text-base font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:bg-black/5 ${
                      isActive('/baggage') ? 'text-[#0D0D0D] bg-black/5 font-bold' : 'text-[#6B6B6B] hover:text-[#0D0D0D]'
                    }`}
                  >
                    <Luggage className="w-4 h-4 text-amber-600" /> Baggage Tracking
                  </Link>
                  <div className="my-2 border-b border-[#E5E5E0]" />
                </>
              )}

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
                  Sign Out
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
