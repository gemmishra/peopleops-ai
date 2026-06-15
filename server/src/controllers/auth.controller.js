import { z } from 'zod'
import {
  authenticateUser,
  toSafeUser,
} from '../services/auth.service.js'

const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict()

export const login = async (req, res) => {
  const credentials = loginSchema.parse(req.body)
  const result = await authenticateUser(credentials)

  res.status(200).json({
    success: true,
    data: result,
  })
}

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: toSafeUser(req.user),
    },
  })
}
