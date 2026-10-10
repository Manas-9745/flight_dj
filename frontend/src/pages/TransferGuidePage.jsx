import { useState } from 'react'
import {
  ArrowLeftRight, Plane, Building2, ShieldCheck, MapPin,
  Clock, AlertTriangle, Sparkles, CheckCircle2, ChevronRight,
  HelpCircle, Copy, Check
} from 'lucide-react'
import { getTransferGuide } from '../services/api'

const PRESET_JOURNEYS = [
  {
    label: 'London → Amsterdam → New York',
    inbound: { flightNumber: 'BA430', airline: 'British Airways', origin: 'LHR', arrival: { iata: 'AMS', terminal: '3', gate: 'D12' }, international: true },
    outbound: { flightNumber: 'KL641', airline: 'KLM', departure: { iata: 'AMS', terminal: '3', gate: 'E18' }, destination: 'JFK' },
  },
  {
    label: 'Mumbai → Doha → London Heathrow',
    inbound: { flightNumber: 'QR557', airline: 'Qatar Airways', origin: 'BOM', arrival: { iata: 'DOH', terminal: '1', gate: 'B4' }, international: true },
    outbound: { flightNumber: 'QR003', airline: 'Qatar Airways', departure: { iata: 'DOH', terminal: '1', gate: 'C22' }, destination: 'LHR' },
  },
  {
    label: 'Tokyo → Los Angeles → Chicago',
    inbound: { flightNumber: 'NH006', airline: 'All Nippon Airways', origin: 'HND', arrival: { iata: 'LAX', terminal: 'B (TBIT)', gate: '134' }, international: true },
    outbound: { flightNumber: 'UA1120', airline: 'United Airlines', departure: { iata: 'LAX', terminal: '7', gate: '71A' }, destination: 'ORD' },
  }
]

export default function TransferGuidePage() {
  const [inbound, setInbound] = useState(PRESET_JOURNEYS[0].inbound)
  const [outbound, setOutbound] = useState(PRESET_JOURNEYS[0].outbound)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handlePresetSelect = (preset) => {
    setInbound(preset.inbound)
    setOutbound(preset.outbound)
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await getTransferGuide({
        inboundFlight: inbound,
        outboundFlight: outbound,
        language
      })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.guide) return
    navigator.clipboard.writeText(result.guide)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-navy-700">Smart AI Airport Transfer Guide</h1>
          <span className="badge-live">COGNITIVE ROUTING</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Precision terminal transit, passport control logistics, and verified connection procedures
        </p>
      </div>

      {/* Preset Journey Quick Select */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-medium">Quick Scenarios:</span>
        {PRESET_JOURNEYS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePresetSelect(p)}
            className="px-3 py-1.5 rounded-xl border border-surface-200 bg-white hover:bg-brand-50 hover:border-brand-200 text-navy-700 font-medium transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Configuration Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leg 1: Inbound */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-navy-700 border-b border-surface-200 pb-2">
              <Plane className="w-4 h-4 text-brand-500" /> Leg 1: Inbound Arrival
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={inbound.flightNumber}
                  onChange={e => setInbound({ ...inbound, flightNumber: e.target.value.toUpperCase() })}
                  className="input-field uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Airline</label>
                <input
                  type="text"
                  value={inbound.airline}
                  onChange={e => setInbound({ ...inbound, airline: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Origin (IATA)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={inbound.origin}
                  onChange={e => setInbound({ ...inbound, origin: e.target.value.toUpperCase() })}
                  className="input-field uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Transit Airport (IATA)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={inbound.arrival?.iata || ''}
                  onChange={e => setInbound({ ...inbound, arrival: { ...inbound.arrival, iata: e.target.value.toUpperCase() } })}
                  className="input-field uppercase font-mono font-bold text-brand-600"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Arrival Terminal</label>
                <input
                  type="text"
                  value={inbound.arrival?.terminal || ''}
                  onChange={e => setInbound({ ...inbound, arrival: { ...inbound.arrival, terminal: e.target.value } })}
                  className="input-field"
                  placeholder="e.g. 3 or TBIT"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Arrival Gate</label>
                <input
                  type="text"
                  value={inbound.arrival?.gate || ''}
                  onChange={e => setInbound({ ...inbound, arrival: { ...inbound.arrival, gate: e.target.value } })}
                  className="input-field"
                  placeholder="e.g. D12"
                />
              </div>
            </div>
          </div>

          {/* Leg 2: Outbound */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-navy-700 border-b border-surface-200 pb-2">
              <Plane className="w-4 h-4 text-teal-500" /> Leg 2: Outbound Connection
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={outbound.flightNumber}
                  onChange={e => setOutbound({ ...outbound, flightNumber: e.target.value.toUpperCase() })}
                  className="input-field uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Airline</label>
                <input
                  type="text"
                  value={outbound.airline}
                  onChange={e => setOutbound({ ...outbound, airline: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Connecting Airport</label>
                <input
                  type="text"
                  maxLength={3}
                  value={outbound.departure?.iata || inbound.arrival?.iata || ''}
                  onChange={e => setOutbound({ ...outbound, departure: { ...outbound.departure, iata: e.target.value.toUpperCase() } })}
                  className="input-field uppercase font-mono font-bold text-teal-600"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Final Destination</label>
                <input
                  type="text"
                  maxLength={3}
                  value={outbound.destination || ''}
                  onChange={e => setOutbound({ ...outbound, destination: e.target.value.toUpperCase() })}
                  className="input-field uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Departure Terminal</label>
                <input
                  type="text"
                  value={outbound.departure?.terminal || ''}
                  onChange={e => setOutbound({ ...outbound, departure: { ...outbound.departure, terminal: e.target.value } })}
                  className="input-field"
                  placeholder="e.g. 3 or 7"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Departure Gate</label>
                <input
                  type="text"
                  value={outbound.departure?.gate || ''}
                  onChange={e => setOutbound({ ...outbound, departure: { ...outbound.departure, gate: e.target.value } })}
                  className="input-field"
                  placeholder="e.g. E18"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Settings & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 font-medium">Response Language:</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-surface-50 border border-surface-200 rounded-xl px-3 py-1.5 text-xs text-navy-700 font-medium focus:outline-none"
            >
              <option value="en">English (US/UK)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="ar">العربية (Arabic)</option>
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
                Synthesizing Transfer Path...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Step-by-Step Guide
              </>
            )}
          </button>
        </div>
      </form>

      {/* Transfer Guide Output */}
      {result && (
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-700 text-lg">
                  Transit Protocol: {inbound.arrival?.iata || 'Hub'}
                </h3>
                <span className="text-xs text-slate-400">
                  Model: {result.modelUsed} · {result.isAiGenerated ? 'OpenAI GPT-4o-mini' : 'AeroMate Rule Engine'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Guide'}
            </button>
          </div>

          {/* Formatted Guide Body */}
          <div className="prose prose-slate max-w-none text-sm text-navy-700 leading-relaxed space-y-3 whitespace-pre-line bg-surface-50/50 p-5 rounded-xl border border-surface-200">
            {result.guide}
          </div>

          {/* Essential Travel Tips Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">AeroMate Airside Advisory</p>
              <p className="text-amber-800 leading-relaxed">
                Gate assignments and terminal transit shuttles are subject to immediate air traffic management changes. Always cross-check the overhead flight information display screens (FIDS) immediately upon deplaning.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
