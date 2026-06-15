import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPayrollBatches } from '../api/payroll.js'
import { BatchStatusBadge } from '../components/payroll/BatchStatusBadge.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import {
  formatCurrency,
  formatDateTime,
  getApiErrorMessage,
} from '../utils/formatters.js'

export function PayrollBatchesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [data, setData] = useState({ batches: [], pagination: null })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    getPayrollBatches({ page, limit: 10, status })
      .then((response) => {
        if (isCurrent) {
          setData(response)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(error, 'Unable to load payroll batches.'),
          )
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [page, refreshKey, status])

  const retry = () => {
    setErrorMessage('')
    setIsLoading(true)
    setRefreshKey((current) => current + 1)
  }

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Payroll history</span>
          <h1>Payroll batches</h1>
          <p>
            Review completed uploads, validation outcomes, net pay, and batch
            risk distribution.
          </p>
        </div>
        <Link className="btn btn-primary" to="/upload-payroll">
          Upload payroll
        </Link>
      </div>

      <section className="content-card">
        <div className="table-toolbar">
          <div>
            <span className="eyebrow">Batch register</span>
            <h2>Recent payroll processing</h2>
          </div>
          <label>
            <span>Status</span>
            <select
              className="form-select"
              onChange={(event) => {
                setErrorMessage('')
                setIsLoading(true)
                setStatus(event.target.value)
                setPage(1)
              }}
              value={status}
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="completed_with_errors">
                Completed with errors
              </option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="section-loader" role="status">
            <span className="spinner-border spinner-border-sm" />
            Loading payroll batches...
          </div>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={retry} />
        ) : data.batches.length === 0 ? (
          <EmptyState
            title="No payroll batches found"
            description={
              status
                ? 'No batches match the selected status.'
                : 'Upload the first payroll CSV to begin the review workflow.'
            }
            symbol="B"
            action={
              !status && (
                <Link className="btn btn-primary" to="/upload-payroll">
                  Upload payroll
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table enterprise-table batch-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Rows</th>
                    <th className="text-end">Net pay</th>
                    <th>Risk distribution</th>
                    <th>Processed</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.batches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <div className="file-cell">
                          <strong>{batch.originalFileName}</strong>
                          <span>{batch.id.slice(-8)}</span>
                        </div>
                      </td>
                      <td>
                        <BatchStatusBadge status={batch.status} />
                      </td>
                      <td>
                        <div className="row-count-cell">
                          <strong>{batch.totalRows}</strong>
                          <span>
                            {batch.validRows} valid | {batch.invalidRows} invalid
                          </span>
                        </div>
                      </td>
                      <td className="text-end money-cell">
                        {formatCurrency(batch.aggregateTotals.netPay)}
                      </td>
                      <td>
                        <div className="mini-risk-counts">
                          <span className="risk-low">
                            L {batch.riskCounts.low}
                          </span>
                          <span className="risk-medium">
                            M {batch.riskCounts.medium}
                          </span>
                          <span className="risk-high">
                            H {batch.riskCounts.high}
                          </span>
                        </div>
                      </td>
                      <td className="date-cell">
                        {formatDateTime(
                          batch.processedAt || batch.createdAt,
                        )}
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

            {data.pagination && (
              <div className="pagination-bar">
                <span>
                  Page {data.pagination.page} of{' '}
                  {Math.max(data.pagination.totalPages, 1)} |{' '}
                  {data.pagination.total} batches
                </span>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={!data.pagination.hasPreviousPage}
                    onClick={() => {
                      setIsLoading(true)
                      setPage((current) => current - 1)
                    }}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={!data.pagination.hasNextPage}
                    onClick={() => {
                      setIsLoading(true)
                      setPage((current) => current + 1)
                    }}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
