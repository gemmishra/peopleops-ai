import { ZodError } from 'zod'
import { env } from '../config/env.js'

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal server error'
  let details

  if (error instanceof ZodError) {
    statusCode = 400
    message = 'Request validation failed'
    details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid resource identifier'
  } else if (error.code === 11000) {
    statusCode = 409
    message = 'A resource with that value already exists'
  } else if (error.name === 'MulterError') {
    statusCode = 400
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'CSV file exceeds the 5 MB size limit'
        : error.message
  } else if (error.details) {
    details = error.details
  }

  if (statusCode >= 500) {
    console.error(error)
    message =
      env.NODE_ENV === 'production' ? 'Internal server error' : message
  }

  const response = {
    success: false,
    error: {
      message,
    },
  }

  if (details) {
    response.error.details = details
  }

  if (error.batchId) {
    response.error.batchId = error.batchId
  }

  res.status(statusCode).json(response)
}
