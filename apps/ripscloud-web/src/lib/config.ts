interface FrontendConfig {
  apiUrl: string
  googleClientId: string
}

let cachedConfig: FrontendConfig | null = null

export async function getFrontendConfig(): Promise<FrontendConfig> {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const response = await fetch('/api/config/frontend')
    if (!response.ok) {
      throw new Error('Failed to fetch frontend configuration')
    }
    const config = await response.json()
    cachedConfig = config
    return config
  } catch (error) {
    console.error('Failed to load frontend config, using fallbacks:', error)
    // Fallback to build-time env vars; use empty string for relative URLs (same-origin)
    const fallbackConfig: FrontendConfig = {
      apiUrl: import.meta.env.VITE_API_URL ?? '',
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
    }
    return fallbackConfig
  }
}
