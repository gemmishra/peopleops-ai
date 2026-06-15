import {
  RISK_RULES,
  RISK_THRESHOLDS,
} from '../utils/payrollConstants.js'

export const getRiskLevel = (score) => {
  if (score >= RISK_THRESHOLDS.high) {
    return 'high'
  }

  if (score >= RISK_THRESHOLDS.medium) {
    return 'medium'
  }

  return 'low'
}

export const calculateSalaryStatistics = (rows) => {
  const salaries = rows
    .map((row) => Number(row.annualSalary))
    .filter(Number.isFinite)

  if (salaries.length === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
    }
  }

  const mean =
    salaries.reduce((total, salary) => total + salary, 0) / salaries.length
  const variance =
    salaries.reduce(
      (total, salary) => total + (salary - mean) ** 2,
      0,
    ) / salaries.length

  return {
    mean,
    standardDeviation: Math.sqrt(variance),
  }
}

const isSalaryOutlier = (annualSalary, statistics) =>
  statistics.standardDeviation > 0 &&
  Math.abs(annualSalary - statistics.mean) >=
    2 * statistics.standardDeviation

export const assessPayrollRisk = (row, salaryStatistics) => {
  const riskFlags = []
  const totalDeductions =
    row.preTaxDeductions + row.taxWithheld + row.postTaxDeductions

  if (row.netPay <= 0) {
    riskFlags.push(RISK_RULES.NON_POSITIVE_NET_PAY)
  }

  if (row.grossPay > 0 && totalDeductions / row.grossPay > 0.4) {
    riskFlags.push(RISK_RULES.HIGH_DEDUCTION_RATIO)
  }

  if (
    row.periodBasePay > 0 &&
    row.bonus / row.periodBasePay > 0.2
  ) {
    riskFlags.push(RISK_RULES.HIGH_BONUS_RATIO)
  }

  if (isSalaryOutlier(row.annualSalary, salaryStatistics)) {
    riskFlags.push(RISK_RULES.SALARY_OUTLIER)
  }

  if (row.validationWarnings?.length > 0) {
    riskFlags.push(RISK_RULES.VALIDATION_WARNING)
  }

  const riskScore = Math.min(
    RISK_THRESHOLDS.maximum,
    riskFlags.reduce((total, flag) => total + flag.scoreImpact, 0),
  )

  return {
    ...row,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    riskFlags: riskFlags.map((flag) => ({ ...flag })),
  }
}

export const assessBatchRisk = (rows) => {
  const salaryStatistics = calculateSalaryStatistics(rows)

  return {
    rows: rows.map((row) => assessPayrollRisk(row, salaryStatistics)),
    salaryStatistics,
  }
}
