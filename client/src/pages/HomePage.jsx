import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardOverview } from '../api/dashboard.js'
import { DashboardSection } from '../components/dashboard/DashboardSection.jsx'
import { HighRiskEmployeesTable } from '../components/dashboard/HighRiskEmployeesTable.jsx'
import { RecentBatchesTable } from '../components/dashboard/RecentBatchesTable.jsx'
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart.jsx'
import { SimpleTrendChart } from '../components/dashboard/SimpleTrendChart.jsx'
import { StatCard } from '../components/dashboard/StatCard.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import { BatchStatusBadge } from '../components/payroll/BatchStatusBadge.jsx'
import { useAuth } from '../hooks/useAuth.js'
import {
  formatCurrency,
  getApiErrorMessage,
} from '../utils/formatters.js'

export default function HomePage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    getDashboardOverview()
      .then((response) => {
        if (isCurrent) {
          setOverview(response)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              'Unable to load payroll dashboard analytics.',
            ),
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
  }, [refreshKey])

  const retry = () => {
    setErrorMessage('')
    setIsLoading(true)
    setRefreshKey((current) => current + 1)
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading page-container" role="status">
        <span className="spinner-border text-primary" />
        <div>
          <strong>Loading payroll analytics</strong>
          <span>Reviewing the latest deterministic payroll results...</span>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="page-container">
        <ErrorState
          title="Dashboard analytics unavailable"
          message={errorMessage}
          onRetry={retry}
        />
      </div>
    )
  }

  if (!overview || overview.totalBatches === 0) {
    return (
      <div className="page-container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Analytics dashboard</span>
            <h1>Welcome, {user?.name?.split(' ')[0]}.</h1>
            <p>
              Your secure workspace is ready. Upload payroll to generate the
              first analytics view.
            </p>
          </div>
        </div>
        <section className="content-card dashboard-empty-card">
          <EmptyState
            title="No payroll analytics yet"
            description="Upload the first strict payroll CSV to populate KPIs, risk distribution, trends, and review queues."
            symbol="D"
            action={
              <Link className="btn btn-primary" to="/upload-payroll">
                Upload payroll CSV
              </Link>
            }
          />
        </section>
      </div>
    )
  }

  const latest = overview.latestSummary
  const riskCounts = latest?.riskCounts || {
    low: 0,
    medium: 0,
    high: 0,
  }

  return (
    <div className="page-container dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Analytics dashboard</span>
          <h1>Payroll risk overview</h1>
          <p>
            Current payroll health, explainable risk signals, and recent batch
            movement for {user?.name?.split(' ')[0]}.
          </p>
        </div>
        <Link className="btn btn-primary" to="/upload-payroll">
          Upload new payroll
        </Link>
      </div>

      <section className="dashboard-stat-grid" aria-label="Payroll KPIs">
        <StatCard
          detail="Stored payroll runs"
          label="Total batches"
          tone="blue"
          value={overview.totalBatches}
        />
        <StatCard
          detail={latest?.originalFileName}
          label="Latest batch status"
          tone="slate"
        >
          <BatchStatusBadge status={latest?.status} />
        </StatCard>
        <StatCard
          detail="Latest processed batch"
          label="Latest net pay"
          tone="indigo"
          value={formatCurrency(latest?.aggregateTotals?.netPay)}
        />
        <StatCard
          detail={`${latest?.invalidRows || 0} invalid rows`}
          label="Valid payroll rows"
          tone="green"
          value={latest?.validRows || 0}
        />
        <StatCard
          detail="Requires priority review"
          label="High-risk employees"
          tone="red"
          value={riskCounts.high}
        />
        <StatCard
          detail="Monitor before approval"
          label="Medium-risk employees"
          tone="amber"
          value={riskCounts.medium}
        />
      </section>

      <div className="dashboard-chart-grid">
        <DashboardSection
          eyebrow="Latest batch"
          title="Risk distribution"
        >
          <RiskDistributionChart riskCounts={riskCounts} />
        </DashboardSection>
        <DashboardSection
          eyebrow="Recent movement"
          title="Payroll totals by batch"
        >
          <SimpleTrendChart batches={overview.recentBatches} />
        </DashboardSection>
      </div>

      <div className="dashboard-insight-grid">
        <DashboardSection
          className="dashboard-summary-section"
          eyebrow="Deterministic review"
          title="Latest payroll summary"
          action={
            <Link
              className="table-action-link"
              to={`/payroll-batches/${latest.id}`}
            >
              Open batch
            </Link>
          }
        >
          <p className="dashboard-summary-text">{latest.summary}</p>
          <div className="dashboard-summary-meta">
            <span>
              <strong>{latest.validationErrorCount}</strong>
              validation errors
            </span>
            <span>
              <strong>{latest.totalRows}</strong>
              total rows
            </span>
          </div>
        </DashboardSection>

        <DashboardSection
          className="dashboard-recommendations-section"
          eyebrow="HR actions"
          title="Recommendations"
        >
          <ol className="dashboard-recommendations">
            {latest.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ol>
        </DashboardSection>
      </div>

      <DashboardSection
        className="dashboard-table-section"
        eyebrow="Review queue"
        title="High-risk employees"
        action={
          <Link
            className="table-action-link"
            to={`/payroll-batches/${latest.id}`}
          >
            Review latest batch
          </Link>
        }
      >
        {overview.highRiskEmployees.length > 0 ? (
          <HighRiskEmployeesTable employees={overview.highRiskEmployees} />
        ) : (
          <EmptyState
            title="No high-risk employees"
            description="The latest payroll batch contains no employees at the high-risk threshold."
            symbol="OK"
          />
        )}
      </DashboardSection>

      <DashboardSection
        className="dashboard-table-section"
        eyebrow="Payroll history"
        title="Recent batches"
        action={
          <Link className="table-action-link" to="/payroll-batches">
            View all batches
          </Link>
        }
      >
        <RecentBatchesTable batches={overview.recentBatches} />
      </DashboardSection>
    </div>
  )
}
