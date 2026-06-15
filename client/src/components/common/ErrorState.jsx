export function ErrorState({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-symbol" aria-hidden="true">
        !
      </div>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          className="btn btn-outline-danger btn-sm"
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  )
}
