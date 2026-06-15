import { formatLabel } from '../../utils/formatters.js'

export function BatchStatusBadge({ status }) {
  return (
    <span className={`batch-status-badge status-${status || 'processing'}`}>
      {formatLabel(status || 'processing')}
    </span>
  )
}
