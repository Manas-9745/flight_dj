import { useState, useEffect } from 'react'
import {
  Settings, Globe, Shield, Database, MapPin, Gauge,
  CheckCircle2, AlertCircle, RefreshCw, Key, UserCheck, Trash2
} from 'lucide-react'

export default function SettingsPage({ user }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('aeromate_language') || 'en')
  const [altUnit, setAltUnit] = useState(() => localStorage.getItem('aeromate_unit_alt') || 'feet')
  const [speedUnit, setSpeedUnit] = useState(() => localStorage.getItem('aeromate_unit_speed') || 'knots')
  const [savedMsg, setSavedMsg] = useState(false)

  const hasMapbox = !!import.meta.env.VITE_MAPBOX_TOKEN
  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your-')

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('aeromate_language', language)
    localStorage.setItem('aeromate_unit_alt', altUnit)
    localStorage.setItem('aeromate_unit_speed', speedUnit)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const handleClearCache = () => {
    if (window.confirm('Clear all local offline flight snapshots, bag tags, and preferences?')) {
      localStorage.removeItem('aeromate_offline_wallet')
      localStorage.removeItem('aeromate_wallet_sync_time')
      localStorage.removeItem('aeromate_baggage_tags')
      alert('Local storage cleared successfully.')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-700">Application Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure copilot language preferences, telemetry units, and integration credentials
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language & Localization Card */}
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-500" /> Language & AI Multilingual Copilot
          </h3>
          <p className="text-xs text-slate-500">
            Select your preferred language. All AI flight assistance, transfer guides, and delay analyses will automatically reply in this language.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">Copilot Interface Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="input-field"
              >
                <option value="en">English (US/UK)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="ja">日本語 (Japanese)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Telemetry Units */}
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-teal-600" /> Telemetry & Aviation Units
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-navy-700 block mb-1">Altitude Measurement</label>
              <select
                value={altUnit}
                onChange={e => setAltUnit(e.target.value)}
                className="input-field"
              >
                <option value="feet">Feet (ft) — Standard Aviation</option>
                <option value="meters">Meters (m) — Metric Flight Levels</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-navy-700 block mb-1">Ground Speed Unit</label>
              <select
                value={speedUnit}
                onChange={e => setSpeedUnit(e.target.value)}
                className="input-field"
              >
                <option value="knots">Knots (kts) — Standard Airspeed</option>
                <option value="kmh">Kilometers per Hour (km/h)</option>
                <option value="mph">Miles per Hour (mph)</option>
              </select>
            </div>
          </div>
        </div>

        {/* System & Integrations Status */}
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" /> External API & Credential Health
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-navy-700 block">Mapbox Satellite & Light Vector Tiles</span>
                <span className="text-slate-400">Environment key: VITE_MAPBOX_TOKEN</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                hasMapbox ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-surface-200 text-slate-600'
              }`}>
                {hasMapbox ? 'Connected' : 'Fallback Canvas Active'}
              </span>
            </div>

            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-navy-700 block">Supabase Authentication & Cloud Trips</span>
                <span className="text-slate-400">Environment key: VITE_SUPABASE_URL</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                hasSupabase ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-brand-50 text-brand-700 border border-brand-200'
              }`}>
                {hasSupabase ? 'Supabase Connected' : 'Local Demo Session Active'}
              </span>
            </div>

            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-navy-700 block">Current User State</span>
                <span className="text-slate-400">{user?.email || 'Demo Traveler'}</span>
              </div>
              <span className="text-teal-600 font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClearCache}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Offline Cache & Reset
          </button>

          <button
            type="submit"
            className="btn-primary py-2.5 px-6 text-xs"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}
