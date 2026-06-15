import { PAY_FREQUENCY_PERIODS } from '../utils/payrollConstants.js'

export const roundMoney = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new TypeError('Money value must be a finite number')
  }

  const scaledValue = numericValue * 100
  const floatingPointTolerance =
    Number.EPSILON * Math.abs(scaledValue) * 2
  const roundedValue =
    Math.sign(scaledValue) *
    Math.round(Math.abs(scaledValue) + floatingPointTolerance)

  return roundedValue / 100
}

export const getFrequencyPeriods = (payFrequency) => {
  const periods = PAY_FREQUENCY_PERIODS[payFrequency]

  if (!periods) {
    const error = new Error(`Unsupported pay frequency: ${payFrequency}`)
    error.code = 'INVALID_PAY_FREQUENCY'
    throw error
  }

  return periods
}

export const calculatePayroll = ({
  annualSalary,
  payFrequency,
  bonus,
  preTaxDeductions,
  taxWithheld,
  postTaxDeductions,
}) => {
  const frequencyPeriods = getFrequencyPeriods(payFrequency)
  const periodBasePay = roundMoney(annualSalary / frequencyPeriods)
  const grossPay = roundMoney(periodBasePay + bonus)
  const taxablePay = roundMoney(
    Math.max(0, grossPay - preTaxDeductions),
  )
  const netPay = roundMoney(
    grossPay -
      preTaxDeductions -
      taxWithheld -
      postTaxDeductions,
  )

  return {
    periodBasePay,
    grossPay,
    taxablePay,
    netPay,
  }
}
