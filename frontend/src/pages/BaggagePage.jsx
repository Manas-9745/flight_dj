import { useState, useEffect } from 'react'
import {
  Luggage, ShieldAlert, CheckCircle2, Clock, AlertTriangle,
  Sparkles, FileText, Plus, Trash2, PhoneCall, HelpCircle
} from 'lucide-react'
import { getBaggageGuidance } from '../services/api'

export default function BaggagePage() {
  const [flightNumber, setFlightNumber] = useState('BA142')
  const [airline, setAirline] = useState('British Airways')
  const [flightStatus, setFlightStatus] = useState('delayed')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [guidance, setGuidance] = useState(null)

  // User's logged baggage tags (persisted in localStorage)
  const [savedTags, setSavedTags] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aeromate_baggage_tags') || '[]')
    } catch {
      return []
    }
  })

  const [newTag, setNewTag] = useState({ tagNumber: '', bagType: 'Checked Suitcase', color: 'Black Hard Shell', passenger: '' })
  const [showAddTag, setShowAddTag] = useState(false)

  useEffect(() => {
    localStorage.setItem('aeromate_baggage_tags', JSON.stringify(savedTags))
  }, [savedTags])

  const handleAddTag = (e) => {
    e.preventDefault()
    if (!newTag.tagNumber.trim()) return
    setSavedTags([...savedTags, { ...newTag, id: Date.now(), flight: flightNumber }])
    setNewTag({ tagNumber: '', bagType: 'Checked Suitcase', color: 'Black Hard Shell', passenger: '' })
    setShowAddTag(false)
  }

  const handleDeleteTag = (id) => {
    setSavedTags(savedTags.filter(t => t.id !== id))
  }

  const handleFetchGuidance = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await getBaggageGuidance({
        flightNumber,
        airline,
        status: flightStatus,
        language
      })
      setGuidance(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-navy-700">Baggage Live Checker & Protocol</h1>
          <span className="badge-live">TRANSPARENT RECLAIM</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Baggage carousel procedures, checked baggage tag organizer, and missing luggage claim guidelines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Guidance & Protocol Generator */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleFetchGuidance} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
              <Luggage className="w-4 h-4 text-brand-500" /> Flight & Baggage Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={e => setFlightNumber(e.target.value.toUpperCase())}
                  className="input-field uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Operating Airline</label>
                <input
                  type="text"
                  value={airline}
                  onChange={e => setAirline(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Flight Status</label>
                <select
                  value={flightStatus}
                  onChange={e => setFlightStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="scheduled">Scheduled / On Time</option>
                  <option value="active">In Flight</option>
                  <option value="landed">Landed / At Gate</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Language:</span>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-surface-50 border border-surface-200 rounded-xl px-2.5 py-1 text-xs text-navy-700"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs flex items-center gap-2 py-2 px-4"
              >
                {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-teal-300" />}
                {loading ? 'Retrieving Protocols...' : 'Fetch Baggage Protocol'}
              </button>
            </div>
          </form>

          {/* Guidance Output Card */}
          {guidance && (
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                    <Luggage className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-navy-700 text-sm">
                      Baggage Guidance · {flightNumber} ({airline})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Model: {guidance.modelUsed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs text-navy-700 leading-relaxed whitespace-pre-line bg-surface-50/50 p-4 rounded-xl border border-surface-200">
                {guidance.guidance}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: User's Tag Wallet & Emergency Lost Baggage Guide */}
        <div className="space-y-6">
          {/* Tag Wallet */}
          <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-navy-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" /> My Bag Tags ({savedTags.length})
              </h3>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Bag
              </button>
            </div>

            {showAddTag && (
              <form onSubmit={handleAddTag} className="p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2 text-xs animate-fade-in">
                <div>
                  <label className="text-slate-500 block mb-0.5">Bag Tag Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BA 928192"
                    value={newTag.tagNumber}
                    onChange={e => setNewTag({ ...newTag, tagNumber: e.target.value.toUpperCase() })}
                    className="input-field uppercase font-mono py-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Description & Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Navy Samsonite spinner"
                    value={newTag.color}
                    onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                    className="input-field py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Passenger Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={newTag.passenger}
                    onChange={e => setNewTag({ ...newTag, passenger: e.target.value })}
                    className="input-field py-1 text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddTag(false)}
                    className="btn-secondary py-1 px-2.5 text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-1 px-3 text-[11px]"
                  >
                    Save Tag
                  </button>
                </div>
              </form>
            )}

            {/* List of saved tags */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {savedTags.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No baggage tags saved yet. Log tags given at check-in counter.
                </p>
              ) : (
                savedTags.map(tag => (
                  <div key={tag.id} className="p-3 bg-surface-50 border border-surface-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-navy-700">{tag.tagNumber}</div>
                      <div className="text-[11px] text-slate-500">{tag.color} {tag.passenger ? `· ${tag.passenger}` : ''}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick PIR Action Checklist */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Lost Baggage Protocol (PIR)
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              If your luggage is missing upon landing:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-800">
              <li>Do NOT exit the secure baggage hall.</li>
              <li>Locate the Airline Baggage Services Desk.</li>
              <li>Demand a Property Irregularity Report (PIR).</li>
              <li>Keep the 10-character PIR reference code.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
