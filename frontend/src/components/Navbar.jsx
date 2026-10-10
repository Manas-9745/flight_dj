import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar({ user, onLogout }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Solutions', path: '/search' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Disruptions', path: '/disruption' },
    { name: 'My Trips', path: '/trips' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">

          {/* Brand — Bold Wordmark like Hyer */}
          <Link to="/" className="flex items-center gap-1 group">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-aeromate-ink tracking-tight leading-none">
              AeroMate
            </span>
            <span className="text-aeromate-ink font-display text-lg align-super leading-none -ml-0.5 mt-0.5">®</span>
          </Link>

          {/* Desktop Nav — Clean, Minimal */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-300 ${
                  isActive(link.path)
                    ? 'text-aeromate-ink font-semibold'
                    : 'text-aeromate-muted hover:text-aeromate-ink'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side — Hamburger Circle */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs font-medium text-aeromate-muted">{user.email || 'Passenger'}</span>
                <button
                  onClick={onLogout}
                  className="text-xs font-semibold text-aeromate-muted hover:text-aeromate-ink transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex text-sm font-medium text-aeromate-muted hover:text-aeromate-ink transition-colors"
              >
                Sign in
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 rounded-full bg-aeromate-ink text-white flex items-center justify-center hover:bg-black transition-all duration-300 hover:scale-105"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white z-40 animate-fade-in">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-12">
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-4xl sm:text-5xl font-display font-bold py-3 transition-all duration-300 ${
                    isActive(link.path) ? 'text-aeromate-ink' : 'text-aeromate-muted hover:text-aeromate-ink'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="mt-16 pt-8 border-t border-aeromate-border flex flex-wrap gap-4">
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
