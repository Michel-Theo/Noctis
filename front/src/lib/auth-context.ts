import { createContext, useContext } from 'react'
import type { User } from './api'

export type Auth = {
  /** undefined tant que la session n'est pas vérifiée, null si personne n'est connecté. */
  user: User | null | undefined
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth hors de AuthProvider')
  return ctx
}
