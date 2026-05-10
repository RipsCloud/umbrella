import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Server, TestTube2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/context/useAuth'
import { axiosInstance } from '@/lib/api'

interface EnvironmentResponse {
  environment: number
  environmentName: string
}

export default function Environment() {
  const { t } = useTranslation()
  const { currentWorkspace, refreshWorkspaces } = useAuth()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workspaceId = currentWorkspace?.id
  // Use environment from context, default to 2 (testing) if not set
  const environment = currentWorkspace?.environment ?? 2

  const handleEnvironmentChange = async (value: string) => {
    const newEnvironment = parseInt(value, 10)
    if (newEnvironment === environment) return

    setSaving(true)
    setError(null)

    try {
      const response = await axiosInstance.put<EnvironmentResponse>(
        `/api/workspaces/${workspaceId}/environment`,
        { environment: newEnvironment }
      )
      
      // Refresh workspaces to update the environment badge and context
      await refreshWorkspaces()

      toast.success(t('environment.switchSuccess'), {
        description: t('environment.switchSuccessDescription', {
          environment: response.data.environmentName,
        }),
      })
    } catch (err) {
      console.error('Failed to switch environment:', err)
      setError(t('environment.switchError'))
      toast.error(t('common.error'), {
        description: t('environment.switchError'),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!workspaceId) {
    return (
      <div className="p-6 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('workspace.noWorkspaceSelected')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t('environment.title')}</h1>
        <p className="text-muted-foreground">{t('environment.description')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('environment.selectEnvironment')}</CardTitle>
          <CardDescription>{t('environment.selectEnvironmentDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup
              value={String(environment)}
              onValueChange={handleEnvironmentChange}
              disabled={saving}
              className="grid gap-4"
            >
              {/* Testing Environment */}
              <div className="relative">
                <RadioGroupItem
                  value="2"
                  id="testing"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="testing"
                  className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <TestTube2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                      {t('environment.testing')}
                      {environment === 2 && (
                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('environment.testingDescription')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('environment.testingNote')}
                    </p>
                  </div>
                </Label>
              </div>

              {/* Production Environment */}
              <div className="relative">
                <RadioGroupItem
                  value="1"
                  id="production"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="production"
                  className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500 cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Server className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                      {t('environment.production')}
                      {environment === 1 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('environment.productionDescription')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('environment.productionNote')}
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

          {saving && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {t('environment.switching')}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('environment.warningTitle')}</AlertTitle>
        <AlertDescription>{t('environment.warningDescription')}</AlertDescription>
      </Alert>
    </div>
  )
}
