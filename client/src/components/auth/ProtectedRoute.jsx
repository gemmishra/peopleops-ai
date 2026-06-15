import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '../common/FullPageLoader.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
