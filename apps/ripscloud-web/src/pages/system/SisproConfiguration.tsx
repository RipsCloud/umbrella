import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Copy, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { isAxiosError } from 'axios'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  ReferenceCombobox,
  type ReferenceComboboxMessages,
} from '@/components/reference/ReferenceCombobox'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import type { SisproLoginRequest, SisproLoginResult, SisproSettingsResponse } from '@/types/sispro'
import { useReferenceData, useReferenceTableRecords } from '@/context/useReferenceData'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption } from '@/lib/reference-data/types'

const MAX_REFERENCE_RESULTS = 50

export function SisproConfiguration() {
  const { t } = useTranslation()
  const { currentWorkspace } = useAuth()
  const { apiClient } = useApiClient()
  const { errors: referenceSyncErrors } = useReferenceData()
  const { records: documentTypeRecords, error: documentTypeLoadError } =
    useReferenceTableRecords('documentTypes')
  const documentTypeDefinition = referenceTableDefinitions.documentTypes
  const documentTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      documentTypeRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          documentTypeDefinition.toOption
            ? documentTypeDefinition.toOption(record)
            : {
                value: record.code,
                label: `${record.code} · ${record.name}`,
                description: record.description ?? null,
                searchText: [record.code, record.name, record.description ?? '']
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [documentTypeDefinition, documentTypeRecords],
  )
  const referenceComboboxMessages = useMemo<ReferenceComboboxMessages>(
    () => ({
      searchPlaceholder: t('referenceData.searchPlaceholder'),
      noResults: t('referenceData.noResultsDefault'),
      noResultsForQuery: (query: string) => t('referenceData.noResultsForQuery', { query }),
      resultsLimited: (count: number, total: number) =>
        t('referenceData.resultsLimited', { count, total }),
    }),
    [t],
  )
  const documentTypeTableLabel = t(documentTypeDefinition.labelKey)
  const documentTypeErrorMessage =
    referenceSyncErrors?.documentTypes || documentTypeLoadError
      ? t('referenceData.errors.loadTable', { table: documentTypeTableLabel })
      : null

  const workspaceId = currentWorkspace?.id ?? ''

  const [formData, setFormData] = useState<SisproLoginRequest>({
    documentType: 'CC',
    documentNumber: '',
    password: '',
  })
  const [nit, setNit] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [statusInfo, setStatusInfo] = useState<{ login: boolean; registrado: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const api = useMemo(
    () => apiClient as unknown as { axios: AxiosInstance; basePath: string },
    [apiClient],
  )

  const isLinked = useMemo(() => {
    if (!token || token.trim().length === 0) return false
    if (statusInfo?.login === false) return false
    return true
  }, [token, statusInfo])

  const callApi = useCallback(
    async <T,>(config: AxiosRequestConfig) => {
      const response = await api.axios.request<T>({
        baseURL: api.basePath,
        ...config,
      })
      return response.data
    },
    [api],
  )

  const resetMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const fetchSettings = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      resetMessages()

      const data = await callApi<SisproSettingsResponse>({
        method: 'GET',
        url: `/api/workspaces/${workspaceId}/sispro/settings`,
      })

      setFormData({
        documentType: data.documentType ?? 'CC',
        documentNumber: data.documentNumber ?? '',
        password: data.password ?? '',
      })
      setNit(data.nit ?? '')
      setToken(data.token ?? null)
      setStatusInfo(null)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setFormData({
          documentType: 'CC',
          documentNumber: '',
          password: '',
        })
        setNit('')
        setToken(null)
        setStatusInfo(null)
      } else {
        setError(t('sisproPage.loadError'))
        console.error(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [callApi, t, workspaceId])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const handleInputChange = (field: keyof SisproLoginRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()

    if (!workspaceId) {
      setError(t('sisproPage.missingWorkspaceDescription'))
      return
    }

    if (!formData.documentType || !formData.documentNumber || !formData.password) {
      setError(t('errors.validationError'))
      return
    }

    try {
      setIsSubmitting(true)

      const result = await callApi<SisproLoginResult>({
        method: 'POST',
        url: `/api/workspaces/${workspaceId}/sispro/login`,
        data: formData,
      })

      if (result.login) {
        setSuccess(t('sisproPage.loginSuccess'))
      } else {
        const details = result.errors?.filter(Boolean).join(' • ')
        setError(details || t('sisproPage.loginFailed'))
      }

      setToken(result.token ?? null)
      setStatusInfo({ login: result.login, registrado: result.registrado })
    } catch (err) {
      if (isAxiosError(err)) {
        const rawErrors = err.response?.data?.errors as unknown
        const parsedErrors = Array.isArray(rawErrors)
          ? rawErrors.filter((item: unknown): item is string => typeof item === 'string').join(' • ')
          : undefined

        const details =
          parsedErrors ||
          (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : undefined) ||
          (typeof err.response?.data?.message === 'string' ? err.response?.data?.message : undefined)

        setError(details || t('sisproPage.loginFailed'))
      } else {
        setError(t('sisproPage.loginFailed'))
      }
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setSuccess(t('sisproPage.tokenCopied'))
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('sisproPage.missingWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('sisproPage.missingWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{t('sisproPage.title')}</h1>
          {isLinked && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('sisproPage.linkedBadge')}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{t('sisproPage.description')}</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('sisproPage.credentialsSection')}</AlertTitle>
        <AlertDescription>{t('sisproPage.credentialsSectionDescription')}</AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !error && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>{t('common.success')}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('sisproPage.credentialsSection')}</CardTitle>
          <CardDescription>{t('sisproPage.credentialsSectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentType">{t('sisproPage.documentType')}</Label>
                  <ReferenceCombobox
                    id="documentType"
                    value={formData.documentType}
                    selectedOption={
                      documentTypeReferenceOptions.find(
                        (option) => option.value === formData.documentType,
                      ) ?? null
                    }
                    options={documentTypeReferenceOptions}
                    onChange={(value) => handleInputChange('documentType', value)}
                    placeholder={t('common.selectOption')}
                    tableLabel={documentTypeTableLabel}
                    disabled={documentTypeReferenceOptions.length === 0}
                    maxResults={MAX_REFERENCE_RESULTS}
                    messages={referenceComboboxMessages}
                  />
                  {documentTypeErrorMessage ? (
                    <p className="text-xs text-destructive">{documentTypeErrorMessage}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">{t('sisproPage.documentNumber')}</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber}
                    onChange={(event) => handleInputChange('documentNumber', event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('sisproPage.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => handleInputChange('password', event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nit">{t('sisproPage.nit')}</Label>
                  <Input id="nit" value={nit} disabled placeholder="000000000" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? t('sisproPage.loggingIn') : t('sisproPage.loginButton')}
                </Button>
                {statusInfo && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={statusInfo.login ? 'default' : 'destructive'} className="gap-1">
                      {statusInfo.login ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      {statusInfo.login ? t('sisproPage.loginSuccess') : t('sisproPage.loginFailed')}
                    </Badge>
                    <Badge
                      variant={statusInfo.registrado ? 'default' : 'outline'}
                      className="gap-1"
                    >
                      {statusInfo.registrado ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      {t('sisproPage.registradoLabel')}: 
                      <span className="font-semibold">
                        {statusInfo.registrado ? t('common.success') : t('common.error')}
                      </span>
                    </Badge>
                  </div>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('sisproPage.tokenSection')}</CardTitle>
          <CardDescription>{t('sisproPage.tokenSectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : token ? (
            <>
              <Textarea value={token} readOnly className="font-mono text-xs" rows={6} />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {statusInfo ? (
                    <span>
                      {t('sisproPage.loginLabel')}: {statusInfo.login ? t('common.success') : t('common.error')}
                    </span>
                  ) : null}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleCopyToken}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('common.copy')}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('sisproPage.noToken')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
