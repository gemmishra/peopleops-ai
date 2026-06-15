const formatMoney = (value) => Number(value || 0).toFixed(2)

const formatStatus = (status) => String(status).replaceAll('_', ' ')

export const generateBatchSummary = ({
  totalRows,
  validRows,
  invalidRows,
  status,
  aggregateTotals,
  riskCounts,
  mostCommonRiskFlag,
  departmentWithHighestNetPay,
}) => {
  const commonRiskText = mostCommonRiskFlag
    ? `${mostCommonRiskFlag.code} (${mostCommonRiskFlag.count} record${mostCommonRiskFlag.count === 1 ? '' : 's'})`
    : 'none'
  const departmentText = departmentWithHighestNetPay
    ? `${departmentWithHighestNetPay.department} (${formatMoney(departmentWithHighestNetPay.netPay)})`
    : 'none'

  return [
    `Batch status: ${formatStatus(status)}.`,
    `Processed ${totalRows} row${totalRows === 1 ? '' : 's'}: ${validRows} valid and ${invalidRows} invalid.`,
    `Total net pay is ${formatMoney(aggregateTotals?.netPay)}.`,
    `Risk distribution is ${riskCounts?.low || 0} low, ${riskCounts?.medium || 0} medium, and ${riskCounts?.high || 0} high.`,
    `Most common risk flag: ${commonRiskText}.`,
    `Department with highest net pay: ${departmentText}.`,
  ].join(' ')
}
