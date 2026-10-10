import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Search, Map, MessageSquare, Bookmark, LogIn, Menu, X, LogOut, User } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: Plane },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { to: '/trips', label: 'My Trips', icon: Bookmark },
]

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center group-hover:bg-sky-500/30 transition-all">
              <Plane className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">Aero<span className="text-sky-400">Mate</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {user.email || 'Demo User'}
                </span>
                <button onClick={onLogout} className="btn-ghost text-sm flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                <Link to="/signup" className="btn-primary text-sm">Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden glass border-t border-white/8 px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(to)
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/8 flex gap-2">
            <Link to="/login" onClick={() => setOpen(false)} className="flex-1 btn-ghost text-sm text-center">Log in</Link>
            <Link to="/signup" onClick={() => setOpen(false)} className="flex-1 btn-primary text-sm text-center">Sign up</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
