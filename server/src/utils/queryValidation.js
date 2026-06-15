import { z } from 'zod'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    )
  }, 'Date is invalid')
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

const optionalQueryString = (schema) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    schema.optional(),
  )

export const paginationSchema = {
  page: optionalQueryString(z.coerce.number().int().min(1)).default(1),
  limit: optionalQueryString(
    z.coerce.number().int().min(1).max(100),
  ).default(20),
}

export const dateRangeSchema = {
  from: optionalQueryString(dateString),
  to: optionalQueryString(dateString),
}

export const getInclusiveDateRange = ({ from, to }) => {
  if (from && to && from > to) {
    const error = new Error('"from" date must be on or before "to" date')
    error.statusCode = 400
    throw error
  }

  if (!from && !to) {
    return undefined
  }

  const range = {}

  if (from) {
    range.$gte = from
  }

  if (to) {
    const endOfDay = new Date(to)
    endOfDay.setUTCHours(23, 59, 59, 999)
    range.$lte = endOfDay
  }

  return range
}

export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const toPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
})
