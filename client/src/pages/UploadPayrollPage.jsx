import { useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadPayrollFile } from '../api/payroll.js'
import { BatchStatusBadge } from '../components/payroll/BatchStatusBadge.jsx'
import { RiskBadge } from '../components/payroll/RiskBadge.jsx'
import { ValidationErrorsTable } from '../components/payroll/ValidationErrorsTable.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import { getApiErrorMessage } from '../utils/formatters.js'

const requiredHeaders = [
  'employeeId',
  'employeeName',
  'department',
  'annualSalary',
  'payFrequency',
  'bonus',
  'preTaxDeductions',
  'taxWithheld',
  'postTaxDeductions',
  'payPeriodStart',
  'payPeriodEnd',
]

const normalizeHeaderErrors = (errors = []) =>
  errors.map((error) => ({
    rowNumber: 1,
    employeeId: null,
    field: 'headers',
    code: error.code,
    message: error.message,
  }))

export function UploadPayrollPage() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null
    setResult(null)
    setError(null)

    if (
      selectedFile &&
      !selectedFile.name.toLowerCase().endsWith('.csv')
    ) {
      setFile(null)
      event.target.value = ''
      setError({
        message: 'Select a file with the .csv extension.',
        details: [],
      })
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError({
        message: 'Choose a payroll CSV before starting validation.',
        details: [],
      })
      return
    }

    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      const response = await uploadPayrollFile(file)
      setResult(response.data)
    } catch (requestError) {
      setError({
        message: getApiErrorMessage(
          requestError,
          'Unable to upload the payroll file.',
        ),
        details: normalizeHeaderErrors(
          requestError.response?.data?.error?.details,
        ),
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Payroll intake</span>
          <h1>Upload payroll CSV</h1>
          <p>
            Validate salaried payroll records, calculate deterministic pay,
            and identify explainable workforce risks.
          </p>
        </div>
        <a
          className="btn btn-outline-primary"
          href="/sample-payroll.csv"
          download
        >
          Download sample CSV
        </a>
      </div>

      <div className="upload-layout">
        <section className="content-card upload-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Step 1</span>
              <h2>Select payroll file</h2>
            </div>
            <span className="file-limit">CSV | 5 MB maximum</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              className={`file-dropzone ${file ? 'has-file' : ''}`}
              htmlFor="payroll-file"
            >
              <input
                accept=".csv,text/csv"
                id="payroll-file"
                name="file"
                onChange={handleFileChange}
                type="file"
              />
              <span className="upload-symbol" aria-hidden="true">
                CSV
              </span>
              {file ? (
                <>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB selected</span>
                </>
              ) : (
                <>
                  <strong>Choose a strict payroll CSV</strong>
                  <span>Click to browse your local files</span>
                </>
              )}
            </label>

            <button
              className="btn btn-primary upload-action"
              disabled={!file || isUploading}
              type="submit"
            >
              {isUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Validating and calculating...
                </>
              ) : (
                'Upload and process payroll'
              )}
            </button>
          </form>
        </section>

        <aside className="content-card csv-contract-card">
          <span className="eyebrow">Strict contract</span>
          <h2>Required CSV headers</h2>
          <p>
            Headers must appear exactly in this order. Dates use
            <code> YYYY-MM-DD</code>.
          </p>
          <div className="header-token-list">
            {requiredHeaders.map((header, index) => (
              <span key={header}>
                <small>{String(index + 1).padStart(2, '0')}</small>
                {header}
              </span>
            ))}
          </div>
        </aside>
      </div>

      {error && (
        <section className="result-section">
          <ErrorState
            title="Payroll upload was not processed"
            message={error.message}
          />
          {error.details.length > 0 && (
            <div className="content-card mt-3">
              <ValidationErrorsTable errors={error.details} />
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="result-section" aria-live="polite">
          <div className="content-card upload-result-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Processing result</span>
                <h2>{result.batch.originalFileName}</h2>
              </div>
              <BatchStatusBadge status={result.batch.status} />
            </div>

            <div className="metric-grid compact">
              <article>
                <span>Total rows</span>
                <strong>{result.batch.totalRows}</strong>
              </article>
              <article>
                <span>Valid rows</span>
                <strong>{result.batch.validRows}</strong>
              </article>
              <article>
                <span>Invalid rows</span>
                <strong>{result.batch.invalidRows}</strong>
              </article>
            </div>

            <div className="risk-count-row">
              <RiskBadge level="low" score={result.batch.riskCounts.low} />
              <RiskBadge
                level="medium"
                score={result.batch.riskCounts.medium}
              />
              <RiskBadge level="high" score={result.batch.riskCounts.high} />
            </div>

            <div className="result-actions">
              <Link
                className="btn btn-primary"
                to={`/payroll-batches/${result.batch.id}`}
              >
                Open batch details
              </Link>
              <Link className="btn btn-outline-secondary" to="/payroll-batches">
                View all batches
              </Link>
            </div>
          </div>

          {result.batch.validationErrors.length > 0 && (
            <div className="content-card mt-3">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Source issues</span>
                  <h2>Validation errors</h2>
                </div>
              </div>
              <ValidationErrorsTable errors={result.batch.validationErrors} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
