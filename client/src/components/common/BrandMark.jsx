export function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark-compact' : ''}`}>
      <span className="brand-mark-symbol" aria-hidden="true">
        P
      </span>
      {!compact && (
        <span>
          <strong>PeopleOps AI</strong>
          <small>Payroll intelligence</small>
        </span>
      )}
    </div>
  )
}
