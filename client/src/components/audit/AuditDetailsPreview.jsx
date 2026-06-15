import { useMemo, useState } from 'react'
import {
  formatAuditValue,
  sanitizeAuditDetails,
} from '../../utils/auditSanitizer.js'
import { formatLabel } from '../../utils/formatters.js'

export function AuditDetailsPreview({ details }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const entries = useMemo(
    () => Object.entries(sanitizeAuditDetails(details || {})),
    [details],
  )

  if (entries.length === 0) {
    return <span className="muted-text">No additional details</span>
  }

  const visibleEntries = isExpanded ? entries : entries.slice(0, 2)

  return (
    <div className="audit-details-preview">
      <dl>
        {visibleEntries.map(([key, value]) => (
          <div key={key}>
            <dt>{formatLabel(key)}</dt>
            <dd title={formatAuditValue(value)}>
              {formatAuditValue(value)}
            </dd>
          </div>
        ))}
      </dl>
      {entries.length > 2 && (
        <button
          className="audit-details-toggle"
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? 'Show less' : `Show ${entries.length - 2} more`}
        </button>
      )}
    </div>
  )
}
