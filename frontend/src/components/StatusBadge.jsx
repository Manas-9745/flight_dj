import { CheckCircle2, Clock, AlertTriangle, XCircle, Info } from 'lucide-react'

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', Icon: Clock },
  active:    { label: 'In Flight',  color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', Icon: CheckCircle2 },
  delayed:   { label: 'Delayed',   color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', Icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10 border-red-400/20', Icon: XCircle },
  landed:    { label: 'Landed',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', Icon: CheckCircle2 },
}

export default function StatusBadge({ status = 'scheduled', delayMinutes }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.scheduled
  const { label, color, Icon } = config

  return (
    <span className={`status-badge border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
      {status === 'delayed' && delayMinutes > 0 && (
        <span className="ml-1 opacity-80">+{delayMinutes}m</span>
      )}
    </span>
  )
}
