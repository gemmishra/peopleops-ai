import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'

const unauthorizedError = () => {
  const error = new Error('Invalid email or password')
  error.statusCode = 401
  return error
}

export const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})

export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash',
  )

  if (!user) {
    throw unauthorizedError()
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    throw unauthorizedError()
  }

  return {
    token: signToken(user),
    user: toSafeUser(user),
  }
}
