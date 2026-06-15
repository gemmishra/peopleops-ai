export function DashboardSection({
  eyebrow,
  title,
  action,
  children,
  className = '',
}) {
  return (
    <section className={`content-card dashboard-section ${className}`}>
      <div className="section-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
