import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Wrap any route with <ProtectedRoute> to require login.
 * Pass adminOnly to restrict to admin users.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8faff' }}>
        <div className="w-10 h-10 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Remember where they were going
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/store" replace />
  }

  return children
}
