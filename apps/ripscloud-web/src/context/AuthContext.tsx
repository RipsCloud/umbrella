import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useApiClient } from './ApiClientContext'
import { registerAuthTokenListener, axiosInstance } from '@/lib/api'
import type {
  RipsAdminApplicationDTOsAuthResponseDto,
  RipsAdminApplicationDTOsUserResponseDto,
  RipsAdminApplicationDTOsWorkspaceClaimDto,
} from '@/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface Workspace {
  id: string
  companyName: string
  environment?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  roles: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  switchWorkspace: (workspaceId: string) => void
  refreshWorkspaces: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

type JwtWorkspaceClaim = {
  Id?: string
  id?: string
  CompanyName?: string
  companyName?: string
  DisplayName?: string
  displayName?: string
}

type JwtPayload = {
  sub?: string
  email?: string
  given_name?: string
  family_name?: string
  name?: string
  exp?: number
  roles?: string
  role?: string | string[]
  workspaces?: string | JwtWorkspaceClaim[]
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const base64UrlDecode = (segment: string): string => {
  const prepared = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (prepared.length % 4 || 4)) % 4
  const padded = prepared + '='.repeat(pad)

  let buffer = 0
  let bitsCollected = 0
  let binary = ''

  for (const char of padded) {
    if (char === '=') break
    const code = BASE64_ALPHABET.indexOf(char)
    if (code < 0) continue
    buffer = (buffer << 6) | code
    bitsCollected += 6
    if (bitsCollected >= 8) {
      bitsCollected -= 8
      binary += String.fromCharCode((buffer >> bitsCollected) & 0xff)
    }
  }

  try {
    return decodeURIComponent(
      binary
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
  } catch {
    return binary
  }
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) {
      return null
    }

    const json = base64UrlDecode(parts[1] ?? '')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

const extractRoles = (payload: JwtPayload): string[] => {
  const roles = new Set<string>()

  if (typeof payload.roles === 'string') {
    payload.roles.split(',').map((role) => role.trim()).filter(Boolean).forEach((role) => roles.add(role))
  }

  if (typeof payload.role === 'string') {
    roles.add(payload.role)
  }

  if (Array.isArray(payload.role)) {
    payload.role.filter((value): value is string => typeof value === 'string').forEach((role) => roles.add(role))
  }

  return Array.from(roles)
}

const normalizeWorkspace = (workspace: JwtWorkspaceClaim): Workspace => {
  const id = workspace.Id ?? workspace.id ?? ''
  const companyName =
    workspace.DisplayName ??
    workspace.displayName ??
    workspace.CompanyName ??
    workspace.companyName ??
    ''

  return {
    id,
    companyName: companyName || id,
  }
}

const mapWorkspaceFallback = (workspace: RipsAdminApplicationDTOsWorkspaceClaimDto): Workspace => ({
  id: workspace.id ?? '',
  companyName: workspace.companyName ?? workspace.displayName ?? '',
})

const normalizeWorkspaces = (
  workspacesClaim: JwtPayload['workspaces'],
  fallback?: RipsAdminApplicationDTOsWorkspaceClaimDto[] | null,
): Workspace[] => {
  if (Array.isArray(workspacesClaim)) {
    return workspacesClaim.map(normalizeWorkspace).filter((workspace) => workspace.id)
  }

  if (typeof workspacesClaim === 'string') {
    try {
      const parsed = JSON.parse(workspacesClaim) as JwtWorkspaceClaim[] | undefined
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeWorkspace).filter((workspace) => workspace.id)
      }
    } catch {
      // ignore malformed claim
    }
  }

  if (fallback && fallback.length > 0) {
    return fallback.map(mapWorkspaceFallback).filter((workspace) => workspace.id)
  }

  return []
}

const deriveUserFromPayload = (
  payload: JwtPayload,
  fallback?: RipsAdminApplicationDTOsUserResponseDto | null,
): User | null => {
  if (!payload.sub && !fallback) {
    return null
  }

  const firstName =
    payload.given_name ??
    fallback?.firstName ??
    (payload.name ? payload.name.split(' ')[0] ?? '' : '')
  const lastName =
    payload.family_name ??
    fallback?.lastName ??
    (payload.name ? payload.name.split(' ').slice(1).join(' ') : '')

  return {
    id: payload.sub ?? fallback?.id ?? '',
    email: payload.email ?? fallback?.email ?? '',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
  }
}

const isTokenExpired = (payload: JwtPayload, fallbackExpiresAt?: string | null): boolean => {
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number') {
    return payload.exp + 5 < nowSeconds
  }

  if (fallbackExpiresAt) {
    const expiresAt = new Date(fallbackExpiresAt).getTime()
    if (!Number.isNaN(expiresAt)) {
      return expiresAt < Date.now()
    }
  }

  return false
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    apiClient,
    setAuthTokens: persistAuthTokens,
    clearAuthTokens: purgeAuthTokens,
    getAccessToken,
    getCurrentTenant,
    setCurrentTenant: persistTenant,
    clearCurrentTenant: purgeTenant,
  } = useApiClient()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  const lastTokenRef = useRef<string | null>(null)
  const environmentFetchedRef = useRef<Set<string>>(new Set())

  const clearSession = useCallback(() => {
    purgeAuthTokens()
    purgeTenant()
    lastTokenRef.current = null
    environmentFetchedRef.current.clear()
    setUser(null)
    setWorkspaces([])
    setCurrentWorkspace(null)
    setRoles([])
  }, [purgeAuthTokens, purgeTenant])

  const applyTokenState = useCallback(
    (
      token: string | null,
      options?: { data?: RipsAdminApplicationDTOsAuthResponseDto },
    ) => {
      if (!token) {
        clearSession()
        setIsLoading(false)
        return
      }

      if (lastTokenRef.current === token && !options) {
        setIsLoading(false)
        return
      }

      const payload = decodeJwtPayload(token)
      if (!payload || isTokenExpired(payload, options?.data?.expiresAt ?? null)) {
        clearSession()
        setIsLoading(false)
        return
      }

      lastTokenRef.current = token

      const normalizedWorkspaces = normalizeWorkspaces(payload.workspaces, options?.data?.workspaces ?? null)
      setWorkspaces(normalizedWorkspaces)

      const persistedTenantId = getCurrentTenant()
      const nextWorkspace: Workspace | null =
        (persistedTenantId ? normalizedWorkspaces.find((workspace) => workspace.id === persistedTenantId) : null) ??
        normalizedWorkspaces[0] ??
        null

      if (nextWorkspace) {
        setCurrentWorkspace(nextWorkspace)
        persistTenant(nextWorkspace.id)
      } else {
        setCurrentWorkspace(null)
        purgeTenant()
      }

      const mappedUser = deriveUserFromPayload(payload, options?.data?.user ?? null)
      setUser(mappedUser)

      const derivedRoles = extractRoles(payload)
      setRoles(derivedRoles)

      setIsLoading(false)
    },
    [clearSession, getCurrentTenant, persistTenant, purgeTenant],
  )

  useEffect(() => {
    const unsubscribe = registerAuthTokenListener((token) => {
      applyTokenState(token, undefined)
    })

    const token = getAccessToken()
    if (token) {
      applyTokenState(token)
    } else {
      setIsLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [applyTokenState, getAccessToken])

  const handleAuthSuccess = useCallback(
    (data: RipsAdminApplicationDTOsAuthResponseDto | undefined) => {
      if (!data?.token) {
        throw new Error('No authentication data received from server.')
      }

      persistAuthTokens({
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      })

      applyTokenState(data.token, { data })
    },
    [applyTokenState, persistAuthTokens],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.ripsAdminPresentationEndpointsAuthLoginEndpoint({
        email,
        password,
      })

      if (response.data?.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors[0])
      }

      handleAuthSuccess(response.data)
    },
    [apiClient, handleAuthSuccess],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.ripsAdminPresentationEndpointsAuthLogoutEndpoint()
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }, [apiClient, clearSession])

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const response = await apiClient.ripsAdminPresentationEndpointsAuthRegisterEndpoint({
        email,
        password,
        firstName,
        lastName,
      })

      if (response.data?.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors[0])
      }

      handleAuthSuccess(response.data)
    },
    [apiClient, handleAuthSuccess],
  )

  const loginWithGoogle = useCallback(
    async (token: string) => {
      const response = await apiClient.ripsAdminPresentationEndpointsAuthGoogleLoginEndpoint({
        token,
      })

      if (response.data?.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors[0])
      }

      handleAuthSuccess(response.data)
    },
    [apiClient, handleAuthSuccess],
  )

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const workspace = workspaces.find((entry) => entry.id === workspaceId)
      if (workspace) {
        setCurrentWorkspace(workspace)
        persistTenant(workspaceId)
      }
    },
    [persistTenant, workspaces],
  )

  const refreshWorkspaces = useCallback(async () => {
    if (!currentWorkspace?.id || !getAccessToken()) return

    try {
      const response = await axiosInstance.get<{ environment: number }>(
        `/api/workspaces/${currentWorkspace.id}/environment`
      )

      environmentFetchedRef.current.add(currentWorkspace.id)

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === currentWorkspace.id
            ? { ...w, environment: response.data.environment }
            : w
        )
      )
      setCurrentWorkspace((prev) =>
        prev ? { ...prev, environment: response.data.environment } : null
      )
    } catch (err) {
      // Mark as fetched to prevent infinite retries on auth errors
      if (currentWorkspace?.id) {
        environmentFetchedRef.current.add(currentWorkspace.id)
      }
      console.error('Failed to refresh workspace environment:', err)
    }
  }, [currentWorkspace?.id])

  // Fetch environment when workspace changes (only once per workspace)
  useEffect(() => {
    if (user && 
        currentWorkspace?.id && 
        currentWorkspace.environment === undefined && 
        !environmentFetchedRef.current.has(currentWorkspace.id)) {
      refreshWorkspaces()
    }
  }, [user, currentWorkspace?.id, currentWorkspace?.environment, refreshWorkspaces])

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      workspaces,
      currentWorkspace,
      roles,
      login,
      logout,
      register,
      loginWithGoogle,
      switchWorkspace,
      refreshWorkspaces,
    }),
    [
      currentWorkspace,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      refreshWorkspaces,
      register,
      roles,
      switchWorkspace,
      user,
      workspaces,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
