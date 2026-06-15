import { EmptyState } from '../common/EmptyState.jsx'

export function RecommendationsPanel({ recommendations = [] }) {
  return (
    <section className="review-panel recommendations-panel">
      <div className="panel-heading">
        <span className="panel-icon" aria-hidden="true">
          R
        </span>
        <div>
          <span className="eyebrow">HR follow-up</span>
          <h2>Recommendations</h2>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <ol className="recommendation-list">
          {recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title="No recommendations"
          description="No additional HR review actions were generated."
          symbol="R"
        />
      )}
    </section>
  )
}
