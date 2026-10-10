import { CheckCircle2, Clock, AlertTriangle, XCircle, Plane } from 'lucide-react'

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   Icon: Clock },
  active:    { label: 'In Flight', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  Icon: Plane },
  delayed:   { label: 'Delayed',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  Icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    Icon: XCircle },
  landed:    { label: 'Landed',    bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  Icon: CheckCircle2 },
}

export default function StatusBadge({ status = 'scheduled', delayMinutes }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.scheduled
  const { label, bg, text, border, Icon } = cfg

  return (
    <span className={`status-badge border ${bg} ${text} ${border}`}>
      <Icon className="w-3 h-3" />
      {label}
      {status === 'delayed' && delayMinutes > 0 && (
        <span className="ml-0.5 opacity-80">+{delayMinutes}m</span>
      )}
    </span>
  )
}
