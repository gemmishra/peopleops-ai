export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)

export const formatDateTime = (value) => {
  if (!value) {
    return 'Not processed'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  (error.code === 'ECONNABORTED'
    ? 'The request timed out. Please try again.'
    : fallback)
