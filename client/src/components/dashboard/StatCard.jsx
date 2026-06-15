export function StatCard({
  label,
  value,
  detail,
  tone = 'blue',
  children,
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <span className="stat-accent" />
      <span className="stat-label">{label}</span>
      <div className="stat-value">{children || value}</div>
      {detail && <span className="stat-detail">{detail}</span>}
    </article>
  )
}
