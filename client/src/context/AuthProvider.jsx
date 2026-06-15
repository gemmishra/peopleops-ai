import { useCallback, useEffect, useMemo, useState } from 'react'
import { currentUserRequest, loginRequest } from '../api/auth.js'
import { AuthContext } from './AuthContext.js'
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from '../utils/authStorage.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isInitializing, setIsInitializing] = useState(true)

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  useEffect(() => {
    const validateSession = async () => {
      if (!getStoredToken()) {
        clearAuthSession()
        setUser(null)
        setIsInitializing(false)
        return
      }

      try {
        const currentUser = await currentUserRequest()
        storeAuthSession({
          token: getStoredToken(),
          user: currentUser,
        })
        setUser(currentUser)
      } catch {
        logout()
      } finally {
        setIsInitializing(false)
      }
    }

    validateSession()
  }, [logout])

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, logout)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, logout)
    }
  }, [logout])

  const login = useCallback(async (credentials) => {
    const session = await loginRequest(credentials)
    storeAuthSession(session)
    setUser(session.user)
    return session.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
