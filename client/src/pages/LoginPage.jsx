import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/common/BrandMark.jsx'
import { useAuth } from '../hooks/useAuth.js'

const getErrorMessage = (error) =>
  error.response?.data?.error?.message ||
  (error.code === 'ECONNABORTED'
    ? 'The server took too long to respond. Please try again.'
    : 'Unable to sign in. Confirm the API is running and try again.')

export function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-story-inner">
          <BrandMark />
          <div className="story-copy">
            <span className="eyebrow">Payroll validation platform</span>
            <h1>Confident payroll review, backed by deterministic rules.</h1>
            <p>
              Validate salaried payroll, surface workforce risk, and preserve
              an auditable trail without delegating calculations to an LLM.
            </p>
          </div>

          <div className="assurance-list">
            <div>
              <span>01</span>
              <p>
                <strong>Rule-based calculations</strong>
                Repeatable payroll results with transparent formulas.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>Explainable risk signals</strong>
                Every score is tied to a documented payroll condition.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>Enterprise auditability</strong>
                Authenticated workflows and structured operational history.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand d-lg-none">
            <BrandMark />
          </div>
          <span className="eyebrow">Secure admin access</span>
          <h2>Welcome back</h2>
          <p className="login-intro">
            Sign in with the seeded HR-admin credentials configured for this
            environment.
          </p>

          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Work email
              </label>
              <input
                autoComplete="username"
                autoFocus
                className="form-control form-control-lg"
                id="email"
                name="email"
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                type="email"
                value={credentials.email}
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                autoComplete="current-password"
                className="form-control form-control-lg"
                id="password"
                minLength="1"
                name="password"
                onChange={handleChange}
                placeholder="Enter your password"
                required
                type="password"
                value={credentials.password}
              />
            </div>

            <button
              className="btn btn-primary btn-lg w-100 login-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Signing in...
                </>
              ) : (
                'Sign in to PeopleOps AI'
              )}
            </button>
          </form>

          <div className="login-security-note">
            <span className="security-dot" />
            JWT-protected session. No public registration is available.
          </div>
        </div>
      </section>
    </main>
  )
}
