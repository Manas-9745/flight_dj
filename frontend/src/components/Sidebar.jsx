import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Globe, Search, Map, Zap, ArrowLeftRight,
  Luggage, Bot, Archive, Settings, ChevronLeft, ChevronRight,
  Plane, LogIn, LogOut, User, Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { group: 'Overview', items: [
    { to: '/',          label: 'Dashboard',        icon: LayoutDashboard },
  ]},
  { group: 'Flights', items: [
    { to: '/map',       label: 'Global Flight Map', icon: Globe },
    { to: '/search',    label: 'Search & Compare',  icon: Search },
    { to: '/trips',     label: 'My Journey',        icon: Map },
  ]},
  { group: 'Tools', items: [
    { to: '/impact',    label: 'Journey Impact',    icon: Zap },
    { to: '/transfer',  label: 'Transfer Guide',    icon: ArrowLeftRight },
    { to: '/baggage',   label: 'Baggage Checker',   icon: Luggage },
    { to: '/hold',      label: 'Hold-Trip Checker', icon: Archive },
  ]},
  { group: 'AI & Wallet', items: [
    { to: '/assistant', label: 'AI Travel Copilot', icon: Bot },
    { to: '/wallet',    label: 'Offline Wallet',    icon: Archive },
  ]},
  { group: 'Account', items: [
    { to: '/settings',  label: 'Settings',          icon: Settings },
  ]},
]

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const NavLink = ({ to, label, icon: Icon }) => {
    const active = isActive(to)
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? label : undefined}
        className={active ? 'nav-item-active' : 'nav-item'}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-5 border-b border-surface-200`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-brand">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-navy-700 text-lg tracking-tight">
              Aero<span className="text-brand-500">Mate</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-brand">
            <Plane className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-surface-100 transition-all ${collapsed ? 'ml-0 mt-0' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_ITEMS.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">{group}</p>
            )}
            <div className="space-y-0.5">
              {items.map(item => <NavLink key={item.to} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-surface-200">
        {user ? (
          <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-navy-700 truncate">{user.email || 'Demo User'}</p>
                <p className="text-[10px] text-slate-400">Authenticated</p>
              </div>
            )}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className={`flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
            {!collapsed ? (
              <>
                <Link to="/login"  className="btn-ghost text-sm text-center w-full">Log in</Link>
                <Link to="/signup" className="btn-primary text-sm text-center w-full">Sign up</Link>
              </>
            ) : (
              <Link to="/login" title="Log in" className="nav-item justify-center">
                <LogIn className="w-4 h-4 text-slate-400" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-surface-200 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-navy-700">Aero<span className="text-brand-500">Mate</span></span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-navy-700 hover:bg-surface-100 transition-all"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-surface-200 shadow-xl animate-slide-in overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
