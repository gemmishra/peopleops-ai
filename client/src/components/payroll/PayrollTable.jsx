import { EmptyState } from '../common/EmptyState.jsx'
import { formatCurrency, formatLabel } from '../../utils/formatters.js'
import { RiskBadge } from './RiskBadge.jsx'

export function PayrollTable({ employees = [] }) {
  if (employees.length === 0) {
    return (
      <EmptyState
        title="No employee records"
        description="No employee payroll records match the current filters."
        symbol="E"
      />
    )
  }

  return (
    <div className="table-responsive">
      <table className="table enterprise-table payroll-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th className="text-end">Gross pay</th>
            <th className="text-end">Net pay</th>
            <th>Risk</th>
            <th>Risk flags</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id || employee.employeeId}>
              <td>
                <div className="employee-cell">
                  <strong>{employee.employeeName}</strong>
                  <span>{employee.employeeId}</span>
                </div>
              </td>
              <td>{employee.department}</td>
              <td className="text-end money-cell">
                {formatCurrency(employee.grossPay)}
              </td>
              <td className="text-end money-cell">
                {formatCurrency(employee.netPay)}
              </td>
              <td>
                <RiskBadge
                  level={employee.riskLevel}
                  score={employee.riskScore}
                />
              </td>
              <td>
                <div className="risk-flags">
                  {employee.riskFlags?.length > 0 ? (
                    employee.riskFlags.map((flag) => (
                      <span
                        className={`risk-flag flag-${flag.severity}`}
                        key={flag.code}
                        title={flag.message}
                      >
                        {formatLabel(flag.code)}
                      </span>
                    ))
                  ) : (
                    <span className="muted-text">No flags</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
