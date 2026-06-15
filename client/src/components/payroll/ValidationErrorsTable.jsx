import { EmptyState } from '../common/EmptyState.jsx'

export function ValidationErrorsTable({ errors = [] }) {
  if (errors.length === 0) {
    return (
      <EmptyState
        title="No validation errors"
        description="Every row in this batch passed the strict payroll contract."
        symbol="OK"
      />
    )
  }

  return (
    <div className="table-responsive">
      <table className="table enterprise-table validation-table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Employee ID</th>
            <th>Field</th>
            <th>Code</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => (
            <tr key={`${error.rowNumber}-${error.code}-${index}`}>
              <td>{error.rowNumber}</td>
              <td>{error.employeeId || 'N/A'}</td>
              <td>{error.field}</td>
              <td>
                <span className="code-label">{error.code}</span>
              </td>
              <td>{error.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
