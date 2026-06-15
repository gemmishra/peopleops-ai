import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api/audit.js'
import { AuditLogsTable } from '../components/audit/AuditLogsTable.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import { getApiErrorMessage } from '../utils/formatters.js'

const emptyFilters = {
  action: '',
  status: '',
  from: '',
  to: '',
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [data, setData] = useState({
    auditLogs: [],
    pagination: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    getAuditLogs({
      page,
      limit: 20,
      ...filters,
    })
      .then((response) => {
        if (isCurrent) {
          setData(response)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(error, 'Unable to load audit logs.'),
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
  }, [filters, page, refreshKey])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const applyFilters = (event) => {
    event.preventDefault()

    if (
      draftFilters.from &&
      draftFilters.to &&
      draftFilters.from > draftFilters.to
    ) {
      setErrorMessage('"From" date must be on or before "To" date.')
      return
    }

    setErrorMessage('')
    setIsLoading(true)
    setPage(1)
    setFilters(draftFilters)
  }

  const clearFilters = () => {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setErrorMessage('')
    setIsLoading(true)
    setPage(1)
  }

  const retry = () => {
    setErrorMessage('')
    setIsLoading(true)
    setRefreshKey((current) => current + 1)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">System activity</span>
          <h1>Audit logs</h1>
          <p>
            Review sanitized authentication, payroll upload, and operational
            events across the PeopleOps AI workspace.
          </p>
        </div>
        <span className="audit-safety-badge">
          <span className="security-dot" />
          Sensitive values excluded
        </span>
      </div>

      <section className="content-card">
        <form className="audit-filter-bar" onSubmit={applyFilters}>
          <label className="audit-action-filter">
            <span>Action</span>
            <input
              className="form-control"
              name="action"
              onChange={handleFilterChange}
              placeholder="e.g. PAYROLL_UPLOAD"
              type="text"
              value={draftFilters.action}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              className="form-select"
              name="status"
              onChange={handleFilterChange}
              value={draftFilters.status}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>
          <label>
            <span>From</span>
            <input
              className="form-control"
              name="from"
              onChange={handleFilterChange}
              type="date"
              value={draftFilters.from}
            />
          </label>
          <label>
            <span>To</span>
            <input
              className="form-control"
              name="to"
              onChange={handleFilterChange}
              type="date"
              value={draftFilters.to}
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Apply filters
          </button>
          {(hasFilters || Object.values(draftFilters).some(Boolean)) && (
            <button
              className="btn btn-outline-secondary"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          )}
        </form>

        <div className="audit-register-heading">
          <div>
            <span className="eyebrow">Event register</span>
            <h2>Recent system activity</h2>
          </div>
          <span className="record-count">
            {data.pagination?.total || 0} events
          </span>
        </div>

        {isLoading ? (
          <div className="section-loader" role="status">
            <span className="spinner-border spinner-border-sm" />
            Loading audit history...
          </div>
        ) : errorMessage ? (
          <ErrorState
            title="Audit history unavailable"
            message={errorMessage}
            onRetry={retry}
          />
        ) : data.auditLogs.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No matching audit events' : 'No audit logs yet'}
            description={
              hasFilters
                ? 'No events match the selected action, status, or date range.'
                : 'Login and payroll upload activity will appear here after the system is used.'
            }
            symbol="A"
          />
        ) : (
          <>
            <AuditLogsTable logs={data.auditLogs} />
            {data.pagination && (
              <div className="pagination-bar">
                <span>
                  Page {data.pagination.page} of{' '}
                  {Math.max(data.pagination.totalPages, 1)} |{' '}
                  {data.pagination.total} events
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
