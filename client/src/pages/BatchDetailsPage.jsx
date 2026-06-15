import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generatePayrollAiReview } from '../api/ai.js'
import {
  getBatchEmployees,
  getPayrollBatch,
} from '../api/payroll.js'
import { BatchStatusBadge } from '../components/payroll/BatchStatusBadge.jsx'
import { PayrollTable } from '../components/payroll/PayrollTable.jsx'
import { RecommendationsPanel } from '../components/payroll/RecommendationsPanel.jsx'
import { SummaryPanel } from '../components/payroll/SummaryPanel.jsx'
import { ValidationErrorsTable } from '../components/payroll/ValidationErrorsTable.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import {
  formatCurrency,
  formatDateTime,
  getApiErrorMessage,
} from '../utils/formatters.js'

export function BatchDetailsPage() {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [employeeData, setEmployeeData] = useState({
    employees: [],
    pagination: null,
  })
  const [filters, setFilters] = useState({ riskLevel: '', search: '' })
  const [searchDraft, setSearchDraft] = useState('')
  const [employeePage, setEmployeePage] = useState(1)
  const [isBatchLoading, setIsBatchLoading] = useState(true)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true)
  const [batchError, setBatchError] = useState('')
  const [employeesError, setEmployeesError] = useState('')
  const [batchRefreshKey, setBatchRefreshKey] = useState(0)
  const [employeeRefreshKey, setEmployeeRefreshKey] = useState(0)
  const [aiReview, setAiReview] = useState(null)
  const [isAiReviewLoading, setIsAiReviewLoading] = useState(false)
  const [aiReviewError, setAiReviewError] = useState('')

  useEffect(() => {
    let isCurrent = true

    getPayrollBatch(batchId)
      .then((response) => {
        if (isCurrent) {
          setBatch(response)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setBatchError(
            getApiErrorMessage(error, 'Unable to load this payroll batch.'),
          )
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsBatchLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [batchId, batchRefreshKey])

  useEffect(() => {
    let isCurrent = true

    getBatchEmployees(batchId, {
      page: employeePage,
      limit: 20,
      riskLevel: filters.riskLevel,
      search: filters.search,
    })
      .then((response) => {
        if (isCurrent) {
          setEmployeeData(response)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setEmployeesError(
            getApiErrorMessage(
              error,
              'Unable to load employee payroll records.',
            ),
          )
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsEmployeesLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [batchId, employeePage, employeeRefreshKey, filters])

  const retryBatch = () => {
    setBatchError('')
    setIsBatchLoading(true)
    setBatchRefreshKey((current) => current + 1)
  }

  const retryEmployees = () => {
    setEmployeesError('')
    setIsEmployeesLoading(true)
    setEmployeeRefreshKey((current) => current + 1)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setEmployeesError('')
    setIsEmployeesLoading(true)
    setEmployeePage(1)
    setFilters((current) => ({
      ...current,
      search: searchDraft.trim(),
    }))
  }

  const handleGenerateAiReview = async () => {
    setAiReviewError('')
    setIsAiReviewLoading(true)

    try {
      setAiReview(await generatePayrollAiReview(batchId))
    } catch (error) {
      setAiReviewError(
        getApiErrorMessage(error, 'Unable to generate the AI payroll review.'),
      )
    } finally {
      setIsAiReviewLoading(false)
    }
  }

  if (isBatchLoading) {
    return (
      <div className="section-loader page-loader" role="status">
        <span className="spinner-border spinner-border-sm" />
        Loading payroll batch...
      </div>
    )
  }

  if (batchError || !batch) {
    return (
      <div className="page-container">
        <ErrorState message={batchError} onRetry={retryBatch} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="details-breadcrumb">
        <Link to="/payroll-batches">Payroll batches</Link>
        <span>/</span>
        <span>{batch.originalFileName}</span>
      </div>

      <div className="page-heading batch-heading">
        <div>
          <span className="eyebrow">Batch review</span>
          <h1>{batch.originalFileName}</h1>
          <p>
            Processed {formatDateTime(batch.processedAt || batch.createdAt)} |
            Batch ID {batch.id}
          </p>
        </div>
        <div className="batch-heading-actions">
          <BatchStatusBadge status={batch.status} />
          <button
            className="btn btn-primary"
            disabled={isAiReviewLoading}
            onClick={handleGenerateAiReview}
            type="button"
          >
            {isAiReviewLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                Generating review...
              </>
            ) : aiReview ? (
              'Regenerate AI Review'
            ) : (
              'Generate AI Review'
            )}
          </button>
        </div>
      </div>

      <section className="metric-grid batch-metrics">
        <article>
          <span>Total net pay</span>
          <strong>{formatCurrency(batch.aggregateTotals.netPay)}</strong>
        </article>
        <article>
          <span>Total gross pay</span>
          <strong>{formatCurrency(batch.aggregateTotals.grossPay)}</strong>
        </article>
        <article>
          <span>Valid rows</span>
          <strong>{batch.validRows}</strong>
        </article>
        <article>
          <span>Invalid rows</span>
          <strong>{batch.invalidRows}</strong>
        </article>
        <article className="risk-metric">
          <span>Risk distribution</span>
          <div className="mini-risk-counts">
            <span className="risk-low">L {batch.riskCounts.low}</span>
            <span className="risk-medium">M {batch.riskCounts.medium}</span>
            <span className="risk-high">H {batch.riskCounts.high}</span>
          </div>
        </article>
      </section>

      <div className="review-grid">
        <SummaryPanel summary={batch.summary} />
        <RecommendationsPanel recommendations={batch.recommendations} />
      </div>

      <section className="content-card details-section ai-review-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Gemini assistant</span>
            <h2>AI payroll review</h2>
          </div>
          {aiReview && (
            <span className="record-count">
              {aiReview.selectedEmployeeCount} risk records reviewed
            </span>
          )}
        </div>

        <p className="ai-safety-note">
          AI review is generated from stored payroll results. It does not
          calculate or modify payroll.
        </p>

        {aiReviewError ? (
          <ErrorState
            title="AI review unavailable"
            message={aiReviewError}
            onRetry={handleGenerateAiReview}
          />
        ) : aiReview ? (
          <div className="ai-review-content">
            <div className="ai-review-meta">
              <span>{aiReview.provider}</span>
              <span>{aiReview.model}</span>
            </div>
            <div className="ai-review-text">{aiReview.review}</div>
          </div>
        ) : (
          <div className="ai-review-empty">
            Generate an HR-facing review of the stored batch summary and up to
            ten medium- or high-risk employee records.
          </div>
        )}
      </section>

      <section className="content-card details-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Source validation</span>
            <h2>Validation errors</h2>
          </div>
          <span className="record-count">
            {batch.validationErrors.length} errors
          </span>
        </div>
        <ValidationErrorsTable errors={batch.validationErrors} />
      </section>

      <section className="content-card details-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Processed payroll</span>
            <h2>Employee results</h2>
          </div>
          <span className="record-count">
            {employeeData.pagination?.total || 0} records
          </span>
        </div>

        <form className="employee-filters" onSubmit={handleSearch}>
          <label>
            <span>Risk level</span>
            <select
              className="form-select"
              onChange={(event) => {
                setEmployeesError('')
                setIsEmployeesLoading(true)
                setEmployeePage(1)
                setFilters((current) => ({
                  ...current,
                  riskLevel: event.target.value,
                }))
              }}
              value={filters.riskLevel}
            >
              <option value="">All risk levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="search-filter">
            <span>Employee or department</span>
            <div className="input-group">
              <input
                className="form-control"
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search ID, name, or department"
                type="search"
                value={searchDraft}
              />
              <button className="btn btn-outline-primary" type="submit">
                Search
              </button>
            </div>
          </label>
          {(filters.search || filters.riskLevel) && (
            <button
              className="btn btn-link clear-filters"
              onClick={() => {
                setSearchDraft('')
                setEmployeesError('')
                setIsEmployeesLoading(true)
                setEmployeePage(1)
                setFilters({ riskLevel: '', search: '' })
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </form>

        {isEmployeesLoading ? (
          <div className="section-loader" role="status">
            <span className="spinner-border spinner-border-sm" />
            Loading employee payroll...
          </div>
        ) : employeesError ? (
          <ErrorState message={employeesError} onRetry={retryEmployees} />
        ) : (
          <>
            <PayrollTable employees={employeeData.employees} />
            {employeeData.pagination && (
              <div className="pagination-bar">
                <span>
                  Page {employeeData.pagination.page} of{' '}
                  {Math.max(employeeData.pagination.totalPages, 1)}
                </span>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={!employeeData.pagination.hasPreviousPage}
                    onClick={() => {
                      setIsEmployeesLoading(true)
                      setEmployeePage((current) => current - 1)
                    }}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={!employeeData.pagination.hasNextPage}
                    onClick={() => {
                      setIsEmployeesLoading(true)
                      setEmployeePage((current) => current + 1)
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
