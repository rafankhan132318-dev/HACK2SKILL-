// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, getToken, setToken, clearToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const { user } = await api.getMe()
      setUser(user)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password)
    setToken(token)
    setUser(user)
    return user
  }

  const register = async (name, email, password) => {
    const { token, user } = await api.register(name, email, password)
    setToken(token)
    setUser(user)
    return user
  }

  const loginWithToken = (token) => {
    setToken(token)
    loadUser()
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken, updateUser, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
