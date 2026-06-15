export function EmptyState({
  title,
  description,
  action,
  symbol = '-',
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-symbol" aria-hidden="true">
        {symbol}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
