const recommendationRules = [
  {
    applies: (context) => context.riskCounts?.high > 0,
    message:
      'Review all high-risk payroll records before payroll approval.',
  },
  {
    applies: (context) => context.invalidRows > 0,
    message:
      'Correct invalid source rows and upload a revised payroll batch.',
  },
  {
    applies: (context) => context.riskFlagCounts?.HIGH_DEDUCTION_RATIO > 0,
    message:
      'Verify deduction amounts and authorization for records with unusually high deductions.',
  },
  {
    applies: (context) => context.riskFlagCounts?.HIGH_BONUS_RATIO > 0,
    message:
      'Confirm bonus approvals for records with bonuses above the expected period threshold.',
  },
  {
    applies: (context) => context.riskFlagCounts?.SALARY_OUTLIER > 0,
    message:
      'Review salary outliers against approved compensation records.',
  },
]

export const countRiskFlags = (rows) => {
  const counts = {}

  for (const row of rows) {
    for (const flag of row.riskFlags || []) {
      counts[flag.code] = (counts[flag.code] || 0) + 1
    }
  }

  return counts
}

export const generateRecommendations = ({
  invalidRows = 0,
  riskCounts = {},
  rows = [],
  mostCommonRiskFlag = null,
}) => {
  const context = {
    invalidRows,
    riskCounts,
    riskFlagCounts: countRiskFlags(rows),
    mostCommonRiskFlag,
  }
  const recommendations = recommendationRules
    .filter((rule) => rule.applies(context))
    .map((rule) => rule.message)

  if (mostCommonRiskFlag) {
    recommendations.push(
      `Prioritize review of the most common risk flag: ${mostCommonRiskFlag.code}.`,
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'No immediate payroll risk actions were identified; complete the standard HR review.',
    )
  }

  return [...new Set(recommendations)]
}
