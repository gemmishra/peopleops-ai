import { roundMoney } from './payrollCalculation.service.js'

const aggregateMoneyFields = [
  'grossPay',
  'netPay',
  'bonus',
  'preTaxDeductions',
  'taxWithheld',
  'postTaxDeductions',
]

export const calculateAggregateTotals = (rows) => {
  const totals = Object.fromEntries(
    aggregateMoneyFields.map((field) => [field, 0]),
  )

  for (const row of rows) {
    for (const field of aggregateMoneyFields) {
      totals[field] += Number(row[field]) || 0
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([field, value]) => [
      field,
      roundMoney(value),
    ]),
  )
}

export const calculateRiskCounts = (rows) => {
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
  }

  for (const row of rows) {
    if (row.riskLevel in counts) {
      counts[row.riskLevel] += 1
    }
  }

  return counts
}

export const getMostCommonRiskFlag = (rows) => {
  const counts = new Map()

  for (const row of rows) {
    for (const flag of row.riskFlags || []) {
      const current = counts.get(flag.code) || {
        code: flag.code,
        message: flag.message,
        count: 0,
      }
      current.count += 1
      counts.set(flag.code, current)
    }
  }

  return (
    [...counts.values()].sort(
      (left, right) =>
        right.count - left.count || left.code.localeCompare(right.code),
    )[0] || null
  )
}

export const getDepartmentWithHighestNetPay = (rows) => {
  const departmentTotals = new Map()

  for (const row of rows) {
    const department = row.department || 'Unassigned'
    departmentTotals.set(
      department,
      (departmentTotals.get(department) || 0) + (Number(row.netPay) || 0),
    )
  }

  const highest =
    [...departmentTotals.entries()].sort(
      ([leftDepartment, leftTotal], [rightDepartment, rightTotal]) =>
        rightTotal - leftTotal ||
        leftDepartment.localeCompare(rightDepartment),
    )[0] || null

  return highest
    ? {
        department: highest[0],
        netPay: roundMoney(highest[1]),
      }
    : null
}

export const buildBatchAnalytics = (rows) => ({
  aggregateTotals: calculateAggregateTotals(rows),
  riskCounts: calculateRiskCounts(rows),
  mostCommonRiskFlag: getMostCommonRiskFlag(rows),
  departmentWithHighestNetPay: getDepartmentWithHighestNetPay(rows),
})
