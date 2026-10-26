import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type User } from './api'
import { AuthContext } from './auth-context'

/** Session du compte client : cookie posé par l'API Symfony, vérifié au chargement. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    api.me().then(setUser, () => setUser(null))
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setUser(await api.login(email, password, remember))
  }, [])
  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    setUser(await api.register(data))
  }, [])
  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
