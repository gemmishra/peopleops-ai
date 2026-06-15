import { formatLabel } from '../../utils/formatters.js'

export function RiskBadge({ level, score }) {
  const normalizedLevel = level || 'low'

  return (
    <span className={`risk-badge risk-${normalizedLevel}`}>
      {formatLabel(normalizedLevel)}
      {score !== undefined && <strong>{score}</strong>}
    </span>
  )
}
