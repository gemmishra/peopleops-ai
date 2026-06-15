const TOKEN_STORAGE_KEY = 'peopleops_ai_token'
const USER_STORAGE_KEY = 'peopleops_ai_user'

export const AUTH_UNAUTHORIZED_EVENT = 'peopleops-ai:unauthorized'

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY)

export const getStoredUser = () => {
  const value = localStorage.getItem(USER_STORAGE_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export const storeAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}
