import { useState } from 'react'
import {
  Globe, Gauge, CheckCircle2, Trash2
} from 'lucide-react'

export default function SettingsPage() {
  const [language, setLanguage] = useState(() => localStorage.getItem('aeromate_language') || 'en')
  const [altUnit, setAltUnit] = useState(() => localStorage.getItem('aeromate_unit_alt') || 'feet')
  const [speedUnit, setSpeedUnit] = useState(() => localStorage.getItem('aeromate_unit_speed') || 'knots')
  const [savedMsg, setSavedMsg] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('aeromate_language', language)
    localStorage.setItem('aeromate_unit_alt', altUnit)
    localStorage.setItem('aeromate_unit_speed', speedUnit)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const handleClearCache = () => {
    if (window.confirm('Clear saved data and reset preferences?')) {
      localStorage.removeItem('aeromate_language')
      localStorage.removeItem('aeromate_unit_alt')
      localStorage.removeItem('aeromate_unit_speed')
      localStorage.removeItem('aeromate_baggage_tags')
      alert('Preferences reset successfully.')
      window.location.reload()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-[#0D0D0D]">Settings</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Manage your language and display units
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Language Selection */}
        <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-sm text-[#0D0D0D] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#246BFD]" /> Language
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Select your preferred language for flight updates and assistance.
          </p>

          <div className="max-w-xs">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="input-field text-xs font-semibold"
            >
              <option value="en">English</option>
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

        {/* Units Selection */}
        <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-sm text-[#0D0D0D] flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-600" /> Measurement Units
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Choose how altitude and airspeed are displayed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-[#0D0D0D] block mb-1">Altitude</label>
              <select
                value={altUnit}
                onChange={e => setAltUnit(e.target.value)}
                className="input-field text-xs font-semibold"
              >
                <option value="feet">Feet (ft)</option>
                <option value="meters">Meters (m)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#0D0D0D] block mb-1">Speed</label>
              <select
                value={speedUnit}
                onChange={e => setSpeedUnit(e.target.value)}
                className="input-field text-xs font-semibold"
              >
                <option value="knots">Knots (kts)</option>
                <option value="kmh">Kilometers per hour (km/h)</option>
                <option value="mph">Miles per hour (mph)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClearCache}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset Preferences
          </button>

          <button
            type="submit"
            className="btn-primary py-2.5 px-6 text-xs"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
