import { CheckCircle2, Clock, AlertTriangle, PlaneTakeoff } from 'lucide-react'

export default function StatusBadge({ status = 'scheduled', delayMinutes = 0 }) {
  const normStatus = (status || 'scheduled').toLowerCase()

  if (normStatus === 'cancelled') {
    return (
      <span className="status-badge bg-red-100 text-red-700 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        <span>Cancelled</span>
      </span>
    )
  }

  if (normStatus === 'delayed' || delayMinutes > 0) {
    return (
      <span className="status-badge bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Delayed {delayMinutes > 0 ? `(${delayMinutes}m)` : ''}</span>
      </span>
    )
  }

  if (normStatus === 'in-flight' || normStatus === 'active') {
    return (
      <span className="status-badge bg-blue-100 text-aeromate-blue border border-blue-200">
        <PlaneTakeoff className="w-3.5 h-3.5 text-aeromate-blue" />
        <span>In Flight</span>
      </span>
    )
  }

  return (
    <span className="status-badge bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>On Time</span>
    </span>
  )
}
