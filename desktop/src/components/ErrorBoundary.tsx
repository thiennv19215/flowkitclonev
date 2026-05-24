import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary p-6">
          <div className="max-w-md w-full bg-bg-secondary border border-accent-red/30 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-accent-red">
              <AlertTriangle size={20} />
              <h1 className="text-lg font-semibold">Something went wrong</h1>
            </div>
            <p className="text-sm text-text-secondary">
              {this.state.error?.message ?? 'Unknown error'}
            </p>
            {this.state.error?.stack && (
              <pre className="text-xs bg-bg-tertiary border border-border rounded p-2 overflow-auto max-h-48 text-text-secondary">
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
