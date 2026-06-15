import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.resolve(currentDirectory, '../../../.env')

dotenv.config({ path: rootEnvPath, quiet: true })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  ADMIN_NAME: z.string().trim().min(2, 'ADMIN_NAME is required'),
  ADMIN_EMAIL: z.string().trim().email('ADMIN_EMAIL must be valid'),
  ADMIN_PASSWORD: z
    .string()
    .min(12, 'ADMIN_PASSWORD must be at least 12 characters'),
  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN must be a valid URL'),
  AI_PROVIDER: z.enum(['gemini']).default('gemini'),
  GEMINI_API_KEY: z.string().trim().optional().default(''),
  AI_MODEL: z.string().trim().min(1).default('gemini-2.5-flash'),
})

const parsedEnvironment = envSchema.safeParse(process.env)

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')

  throw new Error(`Invalid environment configuration: ${issues}`)
}

export const env = Object.freeze(parsedEnvironment.data)
