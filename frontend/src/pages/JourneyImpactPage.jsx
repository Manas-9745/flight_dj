import { useState } from 'react'
import {
  Zap, AlertTriangle, Clock, ArrowRight, ShieldAlert,
  CheckCircle, Plus, Trash2, Sparkles, HelpCircle, FileText
} from 'lucide-react'
import { getJourneyImpact } from '../services/api'

const PRESET_DISRUPTIONS = [
  {
    label: 'BA142: 210-min Delay with tight connection at JFK',
    disruption: { flightNumber: 'BA142', status: 'delayed', delayMinutes: 210, reason: 'Air Traffic Flow Management & Aircraft Late Inbound' },
    segments: [
      { flightNumber: 'BA142', origin: 'LHR', destination: 'JFK', departure: '10:30', arrival: '13:45' },
      { flightNumber: 'AA3401', origin: 'JFK', destination: 'BOS', departure: '15:30', arrival: '16:45' },
      { flightNumber: 'B6122', origin: 'BOS', destination: 'PWM', departure: '18:15', arrival: '19:10' }
    ]
  },
  {
    label: 'LH404: Severe Weather Delay into Frankfurt',
    disruption: { flightNumber: 'LH404', status: 'delayed', delayMinutes: 85, reason: 'Thunderstorms and holding pattern' },
    segments: [
      { flightNumber: 'LH404', origin: 'JFK', destination: 'FRA', departure: '17:50', arrival: '07:20' },
      { flightNumber: 'LH1152', origin: 'FRA', destination: 'BER', departure: '08:45', arrival: '09:50' }
    ]
  },
  {
    label: 'AI645: Flight Cancelled due to technical maintenance',
    disruption: { flightNumber: 'AI645', status: 'cancelled', delayMinutes: 0, reason: 'Hydraulic system inspection' },
    segments: [
      { flightNumber: 'AI645', origin: 'BOM', destination: 'DEL', departure: '19:00', arrival: '21:15' },
      { flightNumber: 'AI111', origin: 'DEL', destination: 'LHR', departure: '02:45', arrival: '07:30' }
    ]
  }
]

export default function JourneyImpactPage() {
  const [segments, setSegments] = useState(PRESET_DISRUPTIONS[0].segments)
  const [disruption, setDisruption] = useState(PRESET_DISRUPTIONS[0].disruption)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handlePreset = (p) => {
    setSegments(p.segments)
    setDisruption(p.disruption)
    setResult(null)
  }

  const addSegment = () => {
    setSegments([
      ...segments,
      { flightNumber: '', origin: '', destination: '', departure: '', arrival: '' }
    ])
  }

  const removeSegment = (idx) => {
    if (segments.length <= 1) return
    setSegments(segments.filter((_, i) => i !== idx))
  }

  const updateSegment = (idx, field, val) => {
    const updated = [...segments]
    updated[idx] = { ...updated[idx], [field]: val }
    setSegments(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await getJourneyImpact({
        segments,
        disruption,
        language
      })
      setResult(res.data)
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
          <h1 className="text-2xl font-display font-bold text-navy-700">Journey Impact Engine</h1>
          <span className="badge-live">CASCADE ANALYZER</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Predict domino-effect delays across multi-segment itineraries, missed connection liabilities, and rebooking remedies
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-medium">Scenarios:</span>
        {PRESET_DISRUPTIONS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePreset(p)}
            className="px-3 py-1.5 rounded-xl border border-surface-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-navy-700 font-medium transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Form configuration */}
      <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-6">
        {/* Disrupted Flight Settings */}
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-navy-700">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Disrupted Primary Leg
            </div>
            <span className="text-xs text-amber-800 font-medium">Originating Incident</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Flight Number</label>
              <input
                type="text"
                value={disruption.flightNumber}
                onChange={e => setDisruption({ ...disruption, flightNumber: e.target.value.toUpperCase() })}
                className="input-field uppercase font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Status Event</label>
              <select
                value={disruption.status}
                onChange={e => setDisruption({ ...disruption, status: e.target.value })}
                className="input-field font-medium"
              >
                <option value="delayed">Delayed Departure</option>
                <option value="cancelled">Cancelled</option>
                <option value="diverted">Diverted En Route</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Delay Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="1440"
                value={disruption.delayMinutes}
                onChange={e => setDisruption({ ...disruption, delayMinutes: parseInt(e.target.value) || 0 })}
                className="input-field"
                disabled={disruption.status === 'cancelled'}
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Reported Reason</label>
              <input
                type="text"
                value={disruption.reason || ''}
                onChange={e => setDisruption({ ...disruption, reason: e.target.value })}
                placeholder="e.g. Weather, Tech, Crew"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Multi-Leg Itinerary Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-navy-700">Journey Flight Segments ({segments.length} Legs)</h3>
            <button
              type="button"
              onClick={addSegment}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Connecting Leg
            </button>
          </div>

          <div className="space-y-2">
            {segments.map((seg, idx) => (
              <div key={idx} className="p-3 bg-surface-50 border border-surface-200 rounded-xl grid grid-cols-2 sm:grid-cols-6 gap-2 items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Flight</span>
                  <input
                    type="text"
                    value={seg.flightNumber}
                    onChange={e => updateSegment(idx, 'flightNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. BA142"
                    className="input-field uppercase font-mono py-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">From (IATA)</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={seg.origin}
                    onChange={e => updateSegment(idx, 'origin', e.target.value.toUpperCase())}
                    placeholder="LHR"
                    className="input-field uppercase font-mono py-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">To (IATA)</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={seg.destination}
                    onChange={e => updateSegment(idx, 'destination', e.target.value.toUpperCase())}
                    placeholder="JFK"
                    className="input-field uppercase font-mono py-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Dep Time</span>
                  <input
                    type="text"
                    value={seg.departure || ''}
                    onChange={e => updateSegment(idx, 'departure', e.target.value)}
                    placeholder="10:30"
                    className="input-field py-1 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Arr Time</span>
                  <input
                    type="text"
                    value={seg.arrival || ''}
                    onChange={e => updateSegment(idx, 'arrival', e.target.value)}
                    placeholder="13:45"
                    className="input-field py-1 text-xs"
                  />
                </div>
                <div className="flex items-center justify-end pt-3 sm:pt-0">
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-surface-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Output Language:</span>
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
            className="btn-primary flex items-center justify-center gap-2 py-2.5 px-6"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Calculating Delay Cascade...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Journey Impact
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Result */}
      {result && (
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-5 animate-fade-in">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-surface-200 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                result.severity === 'HIGH'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : result.severity === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-700 text-lg">
                  Disruption Risk Assessment: <span className={
                    result.severity === 'HIGH' ? 'text-red-600' : result.severity === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                  }>{result.severity || 'EVALUATED'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Engine: {result.modelUsed} ({result.isAiGenerated ? 'OpenAI GPT-4o-mini' : 'AeroMate Rule Engine'})
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Markdown Content */}
          <div className="prose prose-slate max-w-none text-sm text-navy-700 leading-relaxed whitespace-pre-line bg-surface-50/50 p-5 rounded-xl border border-surface-200">
            {result.analysis}
          </div>
        </div>
      )}
    </div>
  )
}
