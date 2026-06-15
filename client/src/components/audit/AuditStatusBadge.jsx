import { formatLabel } from '../../utils/formatters.js'

export function AuditStatusBadge({ status }) {
  const normalizedStatus =
    status === 'success' || status === 'failure' ? status : 'neutral'

  return (
    <span className={`audit-status-badge audit-${normalizedStatus}`}>
      {formatLabel(status || 'unknown')}
    </span>
  )
}
