import { Link } from 'react-router-dom'
import { BatchStatusBadge } from '../payroll/BatchStatusBadge.jsx'
import {
  formatCurrency,
  formatDateTime,
} from '../../utils/formatters.js'

export function RecentBatchesTable({ batches }) {
  return (
    <div className="table-responsive">
      <table className="table enterprise-table dashboard-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Status</th>
            <th className="text-end">Net pay</th>
            <th>Processed</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td>
                <div className="file-cell">
                  <strong>{batch.originalFileName}</strong>
                  <span>
                    {batch.validRows} valid | {batch.invalidRows} invalid
                  </span>
                </div>
              </td>
              <td>
                <BatchStatusBadge status={batch.status} />
              </td>
              <td className="text-end money-cell">
                {formatCurrency(batch.aggregateTotals.netPay)}
              </td>
              <td className="date-cell">
                {formatDateTime(batch.processedAt || batch.createdAt)}
              </td>
              <td className="text-end">
                <Link
                  className="table-action-link"
                  to={`/payroll-batches/${batch.id}`}
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
