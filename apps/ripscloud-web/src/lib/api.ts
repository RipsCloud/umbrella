import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ApiApi, Configuration } from '@/api'
import type { RipsAdminApplicationDTOsAuthResponseDto } from '@/api'
import { getFrontendConfig } from '@/lib/config'

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TOKEN_EXPIRY_KEY = 'tokenExpiresAt'
const TENANT_STORAGE_KEY = 'currentTenantId'

let currentTenantId: string | null = null
const configuredAxiosInstances = new WeakSet<AxiosInstance>()

const tokenListeners = new Set<(token: string | null, expiresAt?: string | null) => void>()

const notifyTokenListeners = (token: string | null, expiresAt?: string | null) => {
  tokenListeners.forEach((listener) => {
    try {
      listener(token, expiresAt ?? null)
    } catch (error) {
      console.error('Auth token listener error', error)
    }
  })
}

export const registerAuthTokenListener = (
  listener: (token: string | null, expiresAt?: string | null) => void,
) => {
  tokenListeners.add(listener)
  return () => tokenListeners.delete(listener)
}

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setCurrentTenant = (tenantId: string) => {
  currentTenantId = tenantId
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
  }
}

export const getCurrentTenant = (): string | null => {
  if (!currentTenantId && typeof window !== 'undefined') {
    currentTenantId = window.localStorage.getItem(TENANT_STORAGE_KEY)
  }
  return currentTenantId
}

export const clearCurrentTenant = () => {
  currentTenantId = null
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TENANT_STORAGE_KEY)
  }
}

export interface AuthTokens {
  token?: string | null
  refreshToken?: string | null
  expiresAt?: string | null
}

export const setAuthTokens = ({ token, refreshToken, expiresAt }: AuthTokens) => {
  if (typeof window === 'undefined') return

  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }

  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  if (expiresAt) {
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt)
  } else {
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  }

  notifyTokenListeners(token ?? null, expiresAt ?? null)
}

export const clearAuthTokens = () => {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY)

  notifyTokenListeners(null)
}

let apiClientInstance: ApiApi | null = null
let axiosInstanceCache: AxiosInstance | null = null

const isAuthRequest = (url?: string) => url?.includes('/api/auth/')

const handleSuccessfulRefresh = (data: RipsAdminApplicationDTOsAuthResponseDto | undefined) => {
  if (!data?.token) {
    return
  }

  setAuthTokens({
    token: data.token,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
  })
}

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

const attachInterceptors = (instance: AxiosInstance) => {
  if (configuredAxiosInstances.has(instance)) {
    return
  }

  configuredAxiosInstances.add(instance)

  // Install interceptors synchronously so cold-start deep links do not issue
  // unauthenticated requests before async frontend config loading finishes.
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && !isAuthRequest(config.url)) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const tenantId = getCurrentTenant()
    const url = config.url

    if (
      tenantId &&
      url &&
      url.startsWith('/api/') &&
      !isAuthRequest(url) &&
      !url.startsWith('/api/admin/') &&
      !/^\/api\/[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}\//.test(url) &&
      !url.startsWith('/api/workspaces')
    ) {
      config.url = url.replace('/api/', `/api/${tenantId}/`)
    }

    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined
      const status = error.response?.status
      const authPage =
        typeof window !== 'undefined' &&
        (window.location.pathname === '/login' || window.location.pathname === '/register')
      const authRequest = isAuthRequest(originalRequest?.url)

      if (status === 401 && originalRequest && !originalRequest._retry && !authRequest) {
        originalRequest._retry = true
        const refreshToken = getRefreshToken()

        if (!refreshToken) {
          clearAuthTokens()
          if (!authPage) {
            redirectToLogin()
          }
          return Promise.reject(error)
        }

        try {
          const refreshResponse =
            await apiClient.ripsAdminPresentationEndpointsAuthRefreshTokenEndpoint({
              refreshToken,
            })

          handleSuccessfulRefresh(refreshResponse.data)

          const latestToken = getAccessToken()

          if (latestToken) {
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${latestToken}`,
            } as typeof originalRequest.headers
          }

          return instance(originalRequest)
        } catch (refreshError) {
          clearAuthTokens()
          if (!authPage) {
            redirectToLogin()
          }
          return Promise.reject(refreshError)
        }
      }

      if (status === 401 && !authPage && !authRequest) {
        clearAuthTokens()
        redirectToLogin()
      }

      return Promise.reject(error)
    },
  )
}

const initializeApiClient = async () => {
  if (apiClientInstance) {
    return { apiClient: apiClientInstance, axiosInstance: axiosInstanceCache! }
  }

  const config = await getFrontendConfig()
  // Use relative URL (empty string) for same-origin requests, localhost only for explicit dev override
  const basePath = config.apiUrl || ''

  const configuration = new Configuration({
    basePath,
    accessToken: async () => getAccessToken() || '',
  })

  apiClientInstance = new ApiApi(configuration)
  axiosInstanceCache = (apiClientInstance as unknown as { axios: AxiosInstance }).axios
  attachInterceptors(axiosInstanceCache)

  return { apiClient: apiClientInstance, axiosInstance: axiosInstanceCache }
}

// Export for backward compatibility
export const apiClient = new ApiApi(new Configuration({
  basePath: '',
  accessToken: async () => getAccessToken() || '',
}))

export const axiosInstance = (apiClient as unknown as { axios: AxiosInstance }).axios
attachInterceptors(axiosInstance)

export const getAxiosInstance = async (): Promise<AxiosInstance> => {
  const { axiosInstance } = await initializeApiClient()
  return axiosInstance
}

// Initialize dynamic API client
initializeApiClient().then(({ apiClient: dynamicClient, axiosInstance: dynamicAxios }) => {
  Object.assign(apiClient, dynamicClient)
  Object.assign(axiosInstance, dynamicAxios)
})
