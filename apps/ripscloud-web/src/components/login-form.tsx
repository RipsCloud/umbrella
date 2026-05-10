import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import { cn } from "@/lib/utils"
import { getFrontendConfig } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          oneTap: (config: Record<string, unknown>) => void
        }
      }
    }
  }
}

// Helper function to get user-friendly error messages
const getErrorMessage = (error: unknown, defaultMessage: string, t: (key: string) => string): string => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    const message = error.message
    // Check if it's a raw HTTP error message
    if (message.includes('401') || message.includes('Request failed with status code 401')) {
      return t('errors.invalidCredentials')
    }
    if (message.includes('Network')) {
      return t('errors.networkError')
    }
    if (message.includes('invalid') || message.includes('incorrect') || message.includes('failed')) {
      return t('errors.invalidCredentials')
    }
    return message
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as Record<string, unknown>
    const response = axiosError.response as Record<string, unknown>
    if (response?.status === 401) {
      return t('errors.invalidCredentials')
    }
    if (response?.status === 400) {
      return t('errors.invalidCredentials')
    }
    const data = response?.data as Record<string, unknown>
    if (data?.message) {
      return String(data.message)
    }
  }

  return defaultMessage
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { changeLanguage, currentLanguage } = useLanguage()

  const handleGoogleLogin = useCallback(async (response: { credential: string }) => {
    setError("")
    setIsLoading(true)

    try {
      await loginWithGoogle(response.credential)
      navigate("/")
    } catch (err) {
      const errorMsg = getErrorMessage(err, t("errors.googleLoginFailed"), t)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [loginWithGoogle, navigate, t])

  useEffect(() => {
    // Load Google Sign-In script
    const initializeGoogle = async () => {
      const config = await getFrontendConfig()
      
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleLogin,
            auto_select: false,
          })

          const googleButtonContainer = document.getElementById("google_button_container")
          if (googleButtonContainer && !googleButtonContainer.hasChildNodes()) {
            window.google.accounts.id.renderButton(googleButtonContainer, {
              theme: "outline",
              size: "large",
            })
          }
        }
      }
      document.head.appendChild(script)

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }

    initializeGoogle()
  }, [handleGoogleLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      navigate("/")
    } catch (err) {
      const errorMsg = getErrorMessage(err, t("errors.loginFailed"), t)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-muted p-4", className)} {...props}>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <img 
                    src="/logo.svg" 
                    alt="RIPS Admin Dashboard" 
                    className="w-20 h-20 mb-4"
                  />
                  <h1 className="text-2xl font-bold">{t("login.title")}</h1>
                  <p className="text-balance text-muted-foreground">
                    {t("login.subtitle")}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t("login.password")}</Label>
                    <Link
                      to="#"
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      {t("login.forgotPassword")}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("login.loggingIn") : t("login.loginButton")}
                </Button>

                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    {t("login.orContinueWith")}
                  </span>
                </div>

                <div id="google_button_container" className="flex justify-center">
                  {/* Google Sign-In button will be rendered here */}
                </div>

                <div className="text-center text-sm">
                  {t("login.noAccount")}{" "}
                  <Link to="/register" className="underline underline-offset-4">
                    {t("login.signUp")}
                  </Link>
                </div>
              </div>
            </form>

            <div className="relative hidden bg-muted md:block">
              <img
                src="/placeholder.png"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            {t("login.agreeMessage")} <a href="#">{t("login.termsOfService")}</a>{" "}
            {t("login.and")} <a href="#">{t("login.privacyPolicy")}</a>.
          </div>
          
          <div className="flex justify-center">
            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger className="w-32 h-8 text-xs border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t("common.spanish")}</SelectItem>
                <SelectItem value="en">{t("common.english")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
