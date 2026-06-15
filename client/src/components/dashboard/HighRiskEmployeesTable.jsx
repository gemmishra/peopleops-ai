import { formatCurrency, formatLabel } from '../../utils/formatters.js'
import { RiskBadge } from '../payroll/RiskBadge.jsx'

export function HighRiskEmployeesTable({ employees }) {
  return (
    <div className="table-responsive">
      <table className="table enterprise-table dashboard-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th className="text-end">Net pay</th>
            <th>Risk</th>
            <th>Primary flag</th>
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
                {formatCurrency(employee.netPay)}
              </td>
              <td>
                <RiskBadge level="high" score={employee.riskScore} />
              </td>
              <td>
                {employee.riskFlags?.[0] ? (
                  <span
                    className={`risk-flag flag-${employee.riskFlags[0].severity}`}
                    title={employee.riskFlags[0].message}
                  >
                    {formatLabel(employee.riskFlags[0].code)}
                  </span>
                ) : (
                  <span className="muted-text">Review required</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
