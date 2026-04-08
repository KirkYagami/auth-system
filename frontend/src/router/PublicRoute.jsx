import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'

/**
 * Renders auth pages (login, register, etc.) only when NOT authenticated.
 * Redirects to dashboard if user is already logged in.
 */
export default function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner fullPage />

  if (user) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
