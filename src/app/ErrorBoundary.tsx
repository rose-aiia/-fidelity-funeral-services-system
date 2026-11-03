import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { hasError: boolean }

/** Last-resort guard so a render error shows a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="status-page container" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>We couldn’t load this page.</h1>
        <p className="muted">Please refresh the page. If the problem continues, contact support.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </main>
    )
  }
}
