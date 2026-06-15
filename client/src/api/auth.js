import { apiClient } from './client.js'

export const loginRequest = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials, {
    skipUnauthorizedEvent: true,
  })

  return response.data.data
}

export const currentUserRequest = async () => {
  const response = await apiClient.get('/auth/me')

  return response.data.data.user
}
