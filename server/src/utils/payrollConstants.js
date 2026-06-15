export const CSV_HEADERS = Object.freeze([
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
])

export const PAY_FREQUENCY_PERIODS = Object.freeze({
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
})

export const PAY_FREQUENCIES = Object.freeze(
  Object.keys(PAY_FREQUENCY_PERIODS),
)

export const BATCH_STATUSES = Object.freeze([
  'processing',
  'completed',
  'completed_with_errors',
  'failed',
])

export const RISK_LEVELS = Object.freeze(['low', 'medium', 'high'])

export const RISK_THRESHOLDS = Object.freeze({
  medium: 30,
  high: 60,
  maximum: 100,
})

export const RISK_RULES = Object.freeze({
  NON_POSITIVE_NET_PAY: Object.freeze({
    code: 'NON_POSITIVE_NET_PAY',
    message: 'Net pay is zero or negative.',
    severity: 'high',
    scoreImpact: 40,
  }),
  HIGH_DEDUCTION_RATIO: Object.freeze({
    code: 'HIGH_DEDUCTION_RATIO',
    message: 'Total deductions exceed 40% of gross pay.',
    severity: 'medium',
    scoreImpact: 25,
  }),
  HIGH_BONUS_RATIO: Object.freeze({
    code: 'HIGH_BONUS_RATIO',
    message: 'Bonus exceeds 20% of period base pay.',
    severity: 'medium',
    scoreImpact: 20,
  }),
  SALARY_OUTLIER: Object.freeze({
    code: 'SALARY_OUTLIER',
    message: 'Annual salary is at least two standard deviations from the batch mean.',
    severity: 'medium',
    scoreImpact: 20,
  }),
  VALIDATION_WARNING: Object.freeze({
    code: 'VALIDATION_WARNING',
    message: 'Record contains one or more validation warnings.',
    severity: 'low',
    scoreImpact: 10,
  }),
})
