import { CheckCircle2, Clock, AlertTriangle, PlaneTakeoff } from 'lucide-react'

export default function StatusBadge({ status = 'scheduled', delayMinutes = 0 }) {
  const normStatus = (status || 'scheduled').toLowerCase()

  if (normStatus === 'cancelled') {
    return (
      <span className="status-badge bg-[#FAFAF7] text-[#0D0D0D] border border-[#E5E5E0]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#52524E]" />
        <span>Cancelled</span>
      </span>
    )
  }

  if (normStatus === 'delayed' || delayMinutes > 0) {
    return (
      <span className="status-badge bg-[#FAFAF7] text-[#0D0D0D] border border-[#E5E5E0]">
        <Clock className="w-3.5 h-3.5 text-[#52524E]" />
        <span>Delayed {delayMinutes > 0 ? `(${delayMinutes}m)` : ''}</span>
      </span>
    )
  }

  if (normStatus === 'in-flight' || normStatus === 'active') {
    return (
      <span className="status-badge bg-[#FAFAF7] text-[#0D0D0D] border border-[#E5E5E0]">
        <PlaneTakeoff className="w-3.5 h-3.5 text-[#246BFD]" />
        <span>In Flight</span>
      </span>
    )
  }

  return (
    <span className="status-badge bg-[#FAFAF7] text-[#0D0D0D] border border-[#E5E5E0]">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>On Time</span>
    </span>
  )
}
