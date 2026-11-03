import { getErrorMessage } from '@/lib/api-error'
import { Skeleton } from './Skeleton'
import './query-state.css'

type QueryStateProps = {
  isPending: boolean
  error: unknown
  onRetry: () => void
  /** What is being loaded, for the status text: "Loading plans…". */
  noun: string
  /** Shimmering placeholder blocks instead of a text line, for sections that have a recognisable shape. */
  skeleton?: boolean
}

/** Placeholder for a section whose data hasn't arrived: a loading line, or an error with a retry. */
export function QueryState({ isPending, error, onRetry, noun, skeleton = false }: QueryStateProps) {
  if (isPending && skeleton) {
    return (
      <div className="query-state query-state--skeleton" role="status" aria-busy="true">
        <span className="visually-hidden">Loading {noun}…</span>
        <Skeleton height="1.4rem" width="40%" />
        <Skeleton height="5.5rem" />
        <Skeleton height="5.5rem" />
      </div>
    )
  }

  if (isPending) {
    return (
      <p className="query-state" role="status">
        Loading {noun}…
      </p>
    )
  }

  return (
    <div className="query-state query-state--error" role="alert">
      <p>{getErrorMessage(error)}</p>
      <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
