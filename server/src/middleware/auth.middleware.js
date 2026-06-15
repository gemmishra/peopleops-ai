import User from '../models/User.js'
import { verifyToken } from '../utils/jwt.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const authenticationError = (message = 'Authentication required') => {
  const error = new Error(message)
  error.statusCode = 401
  return error
}

export const protect = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw authenticationError()
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw authenticationError()
  }

  let payload

  try {
    payload = verifyToken(token)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw authenticationError('Token has expired')
    }

    throw authenticationError('Invalid authentication token')
  }

  const user = await User.findById(payload.sub)

  if (!user) {
    throw authenticationError('User for this token no longer exists')
  }

  req.user = user
  next()
})
