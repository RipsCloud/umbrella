import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ApiApi } from '@/api'
import {
  apiClient,
  clearAuthTokens,
  getAccessToken,
  getCurrentTenant,
  clearCurrentTenant,
  getRefreshToken,
  setAuthTokens,
  setCurrentTenant,
  type AuthTokens,
} from '@/lib/api'

interface ApiClientContextValue {
  apiClient: ApiApi
  setAuthTokens: (tokens: AuthTokens) => void
  clearAuthTokens: () => void
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setCurrentTenant: (tenantId: string) => void
  getCurrentTenant: () => string | null
  clearCurrentTenant: () => void
}

const ApiClientContext = createContext<ApiClientContextValue | undefined>(undefined)

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ApiClientContextValue>(
    () => ({
      apiClient,
      setAuthTokens,
      clearAuthTokens,
      getAccessToken,
      getRefreshToken,
      setCurrentTenant,
      getCurrentTenant,
      clearCurrentTenant,
    }),
    [],
  )

  return <ApiClientContext.Provider value={value}>{children}</ApiClientContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApiClient = () => {
  const context = useContext(ApiClientContext)
  if (!context) {
    throw new Error('useApiClient must be used within an ApiClientProvider')
  }
  return context
}
