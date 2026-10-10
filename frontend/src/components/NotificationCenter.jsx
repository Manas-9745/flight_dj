import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Settings, ShieldAlert, AlertTriangle, Info, Flame, Ban, CloudRain, ExternalLink } from 'lucide-react'

export default function NotificationCenter({ alerts = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aeromate_read_alerts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'critical' | 'prefs'
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushStatus, setPushStatus] = useState('default') // 'default' | 'granted' | 'denied'
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('aeromate_alert_prefs')
      return saved ? JSON.parse(saved) : {
        criticalOnly: false,
        regions: ['all'],
        categories: ['conflict', 'airspace', 'weather', 'airport_closure', 'strike']
      }
    } catch {
      return { criticalOnly: false, regions: ['all'], categories: ['conflict', 'airspace', 'weather', 'airport_closure', 'strike'] }
    }
  })

  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission)
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  // Close dropdown on outside click (supporting touch on mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const markAsRead = (id) => {
    const updated = Array.from(new Set([...readIds, id]))
    setReadIds(updated)
    localStorage.setItem('aeromate_read_alerts', JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    const allIds = alerts.map(a => a.id)
    setReadIds(allIds)
    localStorage.setItem('aeromate_read_alerts', JSON.stringify(allIds))
  }

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission)
      if (permission === 'granted') {
        setPushEnabled(true)
        new Notification('AeroMate Aviation Crisis Radar Active', {
          body: 'You will receive verified safety alerts regarding your flights.',
          icon: '/favicon.svg'
        })
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
    }
  }

  const unreadAlerts = alerts.filter(a => !readIds.includes(a.id))
  const unreadCount = unreadAlerts.length

  // Filter alerts based on activeTab and preferences
  const displayedAlerts = alerts.filter(alert => {
    if (activeTab === 'unread') return !readIds.includes(alert.id)
    if (activeTab === 'critical') return alert.severity === 'CRITICAL'
    return true
  })

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAF7] text-[#0D0D0D] border border-[#E5E5E0]">Notice</span>
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAF7] text-[#52524E] border border-[#E5E5E0]">Advisory</span>
      case 'ADVISORY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAF7] text-[#52524E] border border-[#E5E5E0]">Update</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAF7] text-[#6B6B6B] border border-[#E5E5E0]">Info</span>
    }
  }

  const handleAlertClick = (alert) => {
    markAsRead(alert.id)
    setIsOpen(false)
    navigate('/alerts', { state: { selectedAlertId: alert.id } })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white hover:bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] flex items-center justify-center transition-all duration-200 shadow-subtle active:scale-95"
        aria-label="Aviation Safety Advisories"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#1A1A1A] text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer / Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl border border-[#E5E5E0] shadow-xl z-50 overflow-hidden text-[#0D0D0D]">
          {/* Header */}
          <div className="p-4 border-b border-[#E5E5E0] bg-[#FAFAF7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#246BFD]" />
              <h3 className="font-semibold text-sm text-[#0D0D0D]">Airspace Advisories</h3>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 min-h-[36px] flex items-center gap-1 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Subheader Filter Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-white text-xs px-2 pt-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 pb-2 font-semibold text-center border-b-2 transition-all ${
                activeTab === 'all' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 pb-2 font-semibold text-center border-b-2 transition-all ${
                activeTab === 'unread' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`flex-1 pb-2 font-semibold text-center border-b-2 transition-all ${
                activeTab === 'critical' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setActiveTab('prefs')}
              className={`px-3 pb-2 font-semibold text-center border-b-2 transition-all ${
                activeTab === 'prefs' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
              }`}
              title="Notification Preferences"
            >
              <Settings className="w-3.5 h-3.5 mx-auto" />
            </button>
          </div>

          {/* Tab Content: Preferences */}
          {activeTab === 'prefs' ? (
            <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Browser Push Notifications</h4>
                <p className="text-slate-500 mb-2">
                  Receive instant alerts about verified airspace closures and severe route hazards.
                </p>
                {pushStatus === 'granted' ? (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 font-semibold">
                    <CheckCheck className="w-4 h-4 text-emerald-600" /> Push notifications enabled
                  </div>
                ) : (
                  <button
                    onClick={requestPushPermission}
                    className="btn-primary text-xs py-2 px-4 w-full"
                  >
                    Enable Browser Push Alerts
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Severity Filter</h4>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.criticalOnly}
                    onChange={(e) => {
                      const updated = { ...preferences, criticalOnly: e.target.checked }
                      setPreferences(updated)
                      localStorage.setItem('aeromate_alert_prefs', JSON.stringify(updated))
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Notify only for CRITICAL / Emergency notices</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Preferences are safely saved locally on your device.
              </div>
            </div>
          ) : (
            /* Tab Content: Alerts List */
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {displayedAlerts.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <Info className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No notifications match this filter.</p>
                </div>
              ) : (
                displayedAlerts.map((alert) => {
                  const isRead = readIds.includes(alert.id)
                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors space-y-1.5 ${
                        !isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {alert.affectedRegion}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(alert.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className={`text-xs leading-snug line-clamp-2 ${!isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {alert.headline}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Source: {alert.source.name}</span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Footer View All Link */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/alerts')
              }}
              className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors"
            >
              Open Full Crisis & Alert Center →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
