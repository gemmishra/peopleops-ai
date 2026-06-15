import { Navigate, Outlet } from 'react-router-dom'
import { FullPageLoader } from '../common/FullPageLoader.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <FullPageLoader />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
