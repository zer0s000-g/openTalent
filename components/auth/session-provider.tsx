'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppSession } from '@/lib/auth/session'

interface AuthSessionState {
  session: AppSession | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

const AuthSessionContext = createContext<AuthSessionState>({
  session: null,
  status: 'loading',
})

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
        })

        if (!response.ok) {
          if (!cancelled) {
            setState({
              session: null,
              status: 'unauthenticated',
            })
          }
          return
        }

        const payload = await response.json()
        if (!cancelled) {
          setState({
            session: payload.user || null,
            status: payload.authenticated ? 'authenticated' : 'unauthenticated',
          })
        }
      } catch {
        if (!cancelled) {
          setState({
            session: null,
            status: 'unauthenticated',
          })
        }
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => state, [state])

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  return useContext(AuthSessionContext)
}
