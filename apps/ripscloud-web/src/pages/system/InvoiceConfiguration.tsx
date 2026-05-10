import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import type {
  RipsAdminApplicationDTOsInvoiceSettingsDto,
} from '@/api'

export function InvoiceConfiguration() {
  const { t } = useTranslation()
  const { currentWorkspace } = useAuth()
  const { apiClient } = useApiClient()

  const workspaceId = currentWorkspace?.id ?? ''

  const [token, setToken] = useState('')
  const [initialToken, setInitialToken] = useState('')
  const [provider, setProvider] = useState<number>(1)
  const [initialProvider, setInitialProvider] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true)

  const isDirty = useMemo(
    () => token !== initialToken || provider !== initialProvider,
    [token, initialToken, provider, initialProvider],
  )
  const hasToken = token.trim().length > 0

  const resetMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const applySettings = (settings: RipsAdminApplicationDTOsInvoiceSettingsDto | undefined) => {
    const nextToken = (settings?.token ?? '').trim()
    setToken(nextToken)
    setInitialToken(nextToken)
    setIsEditing(nextToken.length === 0)
    const nextProvider = settings?.invoiceProvider ?? 1
    setProvider(nextProvider)
    setInitialProvider(nextProvider)
  }

  const fetchSettings = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      resetMessages()

      const response =
        await apiClient.ripsAdminPresentationEndpointsInvoiceGetInvoiceConfigurationEndpoint(workspaceId)
      applySettings(response.data)
    } catch (err) {
      console.error(err)
      if (isAxiosError(err) && err.response?.status === 404) {
        applySettings(undefined)
      } else {
        setError(t('invoiceConfigurationPage.loadError'))
        applySettings(undefined)
      }
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, resetMessages, t, workspaceId])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const handleTokenChange = (value: string) => {
    resetMessages()
    setToken(value)
  }

  const handleClearToken = () => {
    resetMessages()
    setToken('')
    setIsEditing(true)
  }

  const handleStartEditing = () => {
    resetMessages()
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    resetMessages()
    setToken(initialToken)
    setProvider(initialProvider)
    setIsEditing(false)
  }

  const handleSave: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (!workspaceId) {
      setError(t('invoiceConfigurationPage.missingWorkspaceDescription'))
      return
    }

    try {
      setIsSaving(true)
      resetMessages()

      const payload = {
        token: hasToken ? token.trim() : null,
        invoiceProvider: provider,
      }

      const response =
        await apiClient.ripsAdminPresentationEndpointsInvoiceUpdateInvoiceConfigurationEndpoint(
          workspaceId,
          payload,
        )
      applySettings(response.data)
      setSuccess(t('invoiceConfigurationPage.saveSettingsSuccess'))
      setIsEditing((response.data.token ?? '').trim().length === 0)
    } catch (err) {
      console.error(err)

      if (isAxiosError(err)) {
        const serverError =
          (typeof err.response?.data?.error === 'string' && err.response.data.error) ||
          (Array.isArray(err.response?.data?.errors) ? err.response?.data?.errors[0] : undefined)

        setError(serverError ?? t('invoiceConfigurationPage.saveError'))
      } else {
        setError(t('invoiceConfigurationPage.saveError'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceConfigurationPage.missingWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('invoiceConfigurationPage.missingWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('invoiceConfigurationPage.title')}</h1>
        <p className="text-muted-foreground">{t('invoiceConfigurationPage.description')}</p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>{t('invoiceConfigurationPage.formTitleSettings')}</CardTitle>
            <CardDescription>{t('invoiceConfigurationPage.helperText')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && !error && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invoice-provider">{t('invoiceConfigurationPage.providerLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('invoiceConfigurationPage.providerHelperText')}
                  </p>
                  <Select
                    value={String(provider)}
                    onValueChange={(value) => {
                      resetMessages()
                      setProvider(Number(value))
                    }}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="invoice-provider" className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('invoiceConfigurationPage.providerMonaros')}</SelectItem>
                      <SelectItem value="2">{t('invoiceConfigurationPage.providerLedger')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {provider === 2 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t('invoiceConfigurationPage.ledgerEnvironmentHint')}
                  </p>
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="invoice-token">
                      {provider === 2
                        ? t('invoiceConfigurationPage.tokenLabelLedger')
                        : t('invoiceConfigurationPage.tokenLabel')}
                    </Label>
                    <Textarea
                      id="invoice-token"
                      value={token}
                      onChange={(event) => handleTokenChange(event.target.value)}
                      placeholder={
                        provider === 2
                          ? t('invoiceConfigurationPage.tokenPlaceholderLedger')
                          : t('invoiceConfigurationPage.tokenPlaceholder')
                      }
                      rows={provider === 2 ? 1 : 4}
                      className={provider === 2 ? 'min-h-[40px]' : 'min-h-[140px]'}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>
                      {provider === 2
                        ? t('invoiceConfigurationPage.tokenLabelLedger')
                        : t('invoiceConfigurationPage.tokenLabel')}
                    </Label>
                    <div className="rounded-md border border-dashed bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        {hasToken
                          ? provider === 2
                            ? t('invoiceConfigurationPage.maskedValueLedger')
                            : t('invoiceConfigurationPage.maskedValue')
                          : provider === 2
                            ? t('invoiceConfigurationPage.noTokenLedger')
                            : t('invoiceConfigurationPage.noToken')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {t('invoiceConfigurationPage.cancelButton')}
                </Button>
                {initialToken && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleClearToken}
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {t('invoiceConfigurationPage.clearButton')}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isDirty || isSaving || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      {t('invoiceConfigurationPage.saving')}
                    </>
                  ) : (
                    t('invoiceConfigurationPage.saveSettingsButton')
                  )}
                </Button>
              </>
            ) : (
              <>
                {hasToken && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearToken}
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {t('invoiceConfigurationPage.clearButton')}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleStartEditing}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {hasToken ? t('invoiceConfigurationPage.editButton') : t('invoiceConfigurationPage.addButton')}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
