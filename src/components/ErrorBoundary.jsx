import { Component } from 'react'
import { Link } from 'react-router-dom'

/* Class component because React only supports error boundaries via
   componentDidCatch / getDerivedStateFromError (no hooks equivalent yet).
   Wrapped around <Routes> so a crashing protected page degrades to a
   visible recovery screen instead of white-screening the whole SPA. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info?.componentStack)
  }

  /* Reset on route change so navigating away from the broken page
     gives a clean slate. */
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20" style={{ background: '#f8faff' }}>
        <p className="text-6xl mb-6">😵</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
          Something went wrong
        </h1>
        <p className="text-gray-500 max-w-md mb-8">
          The page hit an unexpected error. You can head back to the home page or try signing in again.
        </p>
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-primary">Go Home</Link>
          <Link to="/login" className="text-sm text-gray-500 hover:text-primary">Sign In</Link>
        </div>
      </div>
    )
  }
}
