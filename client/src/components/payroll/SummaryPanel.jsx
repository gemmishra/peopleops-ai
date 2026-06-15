export function SummaryPanel({ summary }) {
  return (
    <section className="review-panel summary-panel">
      <div className="panel-heading">
        <span className="panel-icon" aria-hidden="true">
          S
        </span>
        <div>
          <span className="eyebrow">Deterministic review</span>
          <h2>Payroll summary</h2>
        </div>
      </div>
      <p>{summary || 'No summary is available for this batch.'}</p>
      <div className="deterministic-note">
        Generated from stored payroll calculations and risk rules. No LLM is
        used.
      </div>
    </section>
  )
}
