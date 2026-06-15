import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <span className="eyebrow">404</span>
      <h1>That workspace page does not exist.</h1>
      <p>The route may belong to a later PeopleOps AI phase.</p>
      <Link className="btn btn-primary" to="/dashboard">
        Return to dashboard
      </Link>
    </main>
  )
}
