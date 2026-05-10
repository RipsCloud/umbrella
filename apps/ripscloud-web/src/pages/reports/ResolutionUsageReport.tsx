import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/context/useAuth'
import { axiosInstance } from '@/lib/api'

type ResolutionUsageItem = {
  resolutionNumber: string
  prefix: string
  type: string
  rangeFrom: number
  rangeTo: number
  used: number
  remaining: number
  percentUsed: number
  validFrom: string
  validTo: string
  daysRemaining: number
  status: string
}

type ResolutionUsageResponse = {
  items: ResolutionUsageItem[]
}

export function ResolutionUsageReport() {
  const { t } = useTranslation()
  const { currentWorkspace } = useAuth()

  const [data, setData] = useState<ResolutionUsageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const workspaceId = currentWorkspace?.id

  const fetchData = useCallback(async () => {
    if (!workspaceId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.get<ResolutionUsageResponse>(
        `/api/workspaces/${workspaceId}/reports/resolution-usage`,
      )
      setData(response.data.items)
    } catch {
      setError(t('reportsPage.resolutionUsage.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDownloadCsv = async () => {
    if (!workspaceId) return

    setIsDownloading(true)
    try {
      const csvResponse = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/reports/resolution-usage/csv`,
        { responseType: 'blob' },
      )
      const url = window.URL.createObjectURL(new Blob([csvResponse.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `resolution_usage_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError(t('reportsPage.resolutionUsage.downloadError'))
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            {t('reportsPage.resolutionUsage.status.active')}
          </Badge>
        )
      case 'Expired':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            {t('reportsPage.resolutionUsage.status.expired')}
          </Badge>
        )
      case 'Exhausted':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            {t('reportsPage.resolutionUsage.status.exhausted')}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('reportsPage.resolutionUsage.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('reportsPage.resolutionUsage.description')}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{t('reportsPage.resolutionUsage.cardTitle')}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={isDownloading || isLoading || data.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading
              ? t('reportsPage.resolutionUsage.downloading')
              : t('reportsPage.resolutionUsage.downloadCsv')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {t('reportsPage.resolutionUsage.empty')}
              </p>
            </div>
          )}

          {!isLoading && !error && data.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reportsPage.resolutionUsage.table.resolutionNumber')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.prefix')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.type')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.range')}</TableHead>
                    <TableHead className="text-right">{t('reportsPage.resolutionUsage.table.used')}</TableHead>
                    <TableHead className="text-right">{t('reportsPage.resolutionUsage.table.remaining')}</TableHead>
                    <TableHead className="text-right">{t('reportsPage.resolutionUsage.table.percentUsed')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.validFrom')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.validTo')}</TableHead>
                    <TableHead className="text-right">{t('reportsPage.resolutionUsage.table.daysRemaining')}</TableHead>
                    <TableHead>{t('reportsPage.resolutionUsage.table.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={`${item.resolutionNumber}-${item.type}-${index}`}>
                      <TableCell className="font-medium">{item.resolutionNumber}</TableCell>
                      <TableCell>{item.prefix}</TableCell>
                      <TableCell>
                        {item.type === 'Invoice'
                          ? t('reportsPage.resolutionUsage.type.invoice')
                          : t('reportsPage.resolutionUsage.type.creditNote')}
                      </TableCell>
                      <TableCell>{item.rangeFrom} - {item.rangeTo}</TableCell>
                      <TableCell className="text-right">{item.used}</TableCell>
                      <TableCell className="text-right">{item.remaining}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.percentUsed >= 90
                                  ? 'bg-red-500'
                                  : item.percentUsed >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                            />
                          </div>
                          <span className="text-sm tabular-nums">{formatPercent(item.percentUsed)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.validFrom}</TableCell>
                      <TableCell>{item.validTo}</TableCell>
                      <TableCell className="text-right">{item.daysRemaining}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
