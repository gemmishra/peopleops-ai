import { BrandMark } from './BrandMark.jsx'

export function FullPageLoader() {
  return (
    <main
      className="app-loading"
      role="status"
      aria-label="Loading PeopleOps AI"
    >
      <BrandMark />
      <div className="spinner-border spinner-border-sm text-primary" />
      <span>Validating your secure session...</span>
    </main>
  )
}
