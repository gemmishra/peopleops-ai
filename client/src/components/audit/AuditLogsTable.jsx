import { formatDateTime, formatLabel } from '../../utils/formatters.js'
import { AuditDetailsPreview } from './AuditDetailsPreview.jsx'
import { AuditStatusBadge } from './AuditStatusBadge.jsx'

export function AuditLogsTable({ logs }) {
  return (
    <div className="table-responsive">
      <table className="table enterprise-table audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Status</th>
            <th>Entity</th>
            <th>Actor</th>
            <th>IP address</th>
            <th>Safe details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="date-cell">{formatDateTime(log.createdAt)}</td>
              <td>
                <span className="audit-action-label">
                  {formatLabel(log.action)}
                </span>
              </td>
              <td>
                <AuditStatusBadge status={log.status} />
              </td>
              <td>
                <div className="audit-entity-cell">
                  <strong>{log.entityType || 'System'}</strong>
                  <span>{log.entityId || 'No entity ID'}</span>
                </div>
              </td>
              <td>
                {log.user ? (
                  <div className="audit-actor-cell">
                    <strong>{log.user.name}</strong>
                    <span>{log.user.email}</span>
                  </div>
                ) : (
                  <span className="muted-text">System</span>
                )}
              </td>
              <td className="audit-ip-cell">{log.ipAddress || 'N/A'}</td>
              <td>
                <AuditDetailsPreview details={log.details} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
