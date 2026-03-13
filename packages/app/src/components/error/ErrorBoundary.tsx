import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    // Also clear the URL hash to go back to landing
    window.location.hash = ''
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-card border-2 border-red-300 rounded-lg p-8 text-center space-y-4">
            <div className="text-4xl">💥</div>
            <h2 className="text-xl font-semibold text-red-700">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">
              {this.state.error.message}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium"
            >
              Return to Home
            </button>
            <details className="text-left text-xs text-muted-foreground mt-4">
              <summary className="cursor-pointer font-medium">Stack trace</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                {this.state.error.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
