import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import User from '../models/User.js'

const PASSWORD_SALT_ROUNDS = 12

export const seedAdmin = async () => {
  const email = env.ADMIN_EMAIL.toLowerCase()
  const existingAdmin = await User.exists({ email })

  if (existingAdmin) {
    console.info(`Seed admin already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(
    env.ADMIN_PASSWORD,
    PASSWORD_SALT_ROUNDS,
  )

  try {
    await User.create({
      name: env.ADMIN_NAME,
      email,
      passwordHash,
      role: 'admin',
    })
    console.info(`Seed admin created: ${email}`)
  } catch (error) {
    if (error?.code === 11000) {
      console.info(`Seed admin already exists: ${email}`)
      return
    }

    throw error
  }
}
