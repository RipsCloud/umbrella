import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RefreshCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuth } from '@/context/useAuth'
import { axiosInstance } from '@/lib/api'

type RipsDispatchItem = {
  date: string
  documentType: string
  number: string
  clientName: string
  ripsStatus: string
  lastAttemptDate: string | null
  errorMessage: string | null
}

type RipsDispatchSummary = {
  totalSubmitted: number
  successful: number
  failed: number
  pending: number
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'Sent':
      return 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
    case 'Failed':
      return 'bg-red-500/15 text-red-600 border border-red-500/30'
    case 'Pending':
      return 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const formatDate = (value: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const formatDateTime = (value: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function RipsDispatchReport() {
  const { t, i18n } = useTranslation()
  const { currentWorkspace } = useAuth()

  const [items, setItems] = useState<RipsDispatchItem[]>([])
  const [summary, setSummary] = useState<RipsDispatchSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'
  const totalPages = Math.ceil(totalCount / pageSize)

  const fetchReport = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/reports/rips-dispatch`,
        {
          params: {
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            page,
            pageSize,
          },
        }
      )

      const data = response.data
      setItems(data?.items ?? [])
      setSummary(data?.summary ?? null)
      setTotalCount(data?.totalCount ?? 0)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error
      setError(apiError ?? t('reportsPage.ripsDispatch.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, dateFrom, dateTo, page, pageSize, t])

  useEffect(() => {
    void fetchReport()
  }, [fetchReport])

  const handleApplyFilters = useCallback(() => {
    setPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])

  const handleDownloadCsv = useCallback(async () => {
    if (!workspaceId) return

    try {
      setIsDownloading(true)

      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/reports/rips-dispatch/csv`,
        {
          params: {
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          responseType: 'blob',
        }
      )

      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rips_dispatch_report_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error
      setError(apiError ?? t('reportsPage.ripsDispatch.loadError'))
    } finally {
      setIsDownloading(false)
    }
  }, [workspaceId, dateFrom, dateTo, t])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('reportsPage.ripsDispatch.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('reportsPage.ripsDispatch.description')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>{t('reportsPage.ripsDispatch.table.date')}</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
            <Button onClick={handleApplyFilters}>
              {t('reportsPage.ripsDispatch.apply')}
            </Button>
            {(dateFrom || dateTo) && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                {t('reportsPage.ripsDispatch.clearFilters')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={() => void fetchReport()}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleDownloadCsv()}
                disabled={isDownloading || isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('reportsPage.ripsDispatch.download')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.ripsDispatch.summary.totalSubmitted')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSubmitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.ripsDispatch.summary.successful')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {summary.successful}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.ripsDispatch.summary.failed')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.failed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.ripsDispatch.summary.pending')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {summary.pending}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('reportsPage.ripsDispatch.title')}
          </CardTitle>
          <CardDescription>
            {t('reportsPage.ripsDispatch.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
              <h3 className="text-lg font-semibold">
                {t('reportsPage.ripsDispatch.noResults')}
              </h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.date')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.documentType')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.number')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.client')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.ripsStatus')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.lastAttempt')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.ripsDispatch.table.errorMessage')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={`${item.documentType}-${item.number}-${index}`}>
                        <TableCell>
                          {formatDate(item.date, locale)}
                        </TableCell>
                        <TableCell>{item.documentType}</TableCell>
                        <TableCell className="font-mono">
                          {item.number || '\u2014'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.clientName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(item.ripsStatus)}>
                            {t(
                              `reportsPage.ripsDispatch.status.${item.ripsStatus.toLowerCase()}`
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.lastAttemptDate
                            ? formatDateTime(item.lastAttemptDate, locale)
                            : '\u2014'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {item.errorMessage || '\u2014'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink isActive>{page}</PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
