import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RefreshCcw, Search, X } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuth } from '@/context/useAuth'
import { useApiClient } from '@/context/ApiClientContext'
import { CATEGORY_CONFIG, type CategorySlug } from '@/lib/rips/serviceCategories'

interface SalesReportItem {
  date: string
  documentType: string
  number: string
  clientName: string
  subtotal: number
  tax: number
  totalAmount: number
  status: string
  cufeOrCude?: string | null
}

interface SalesReportSummary {
  totalInvoiced: number
  totalCredited: number
  netRevenue: number
  documentCount: number
}

interface SalesReportFilters {
  dateFrom: string
  dateTo: string
  clientId: string
  status: string
  documentType: string
  serviceCategory: string
  serviceCode: string
}

const createEmptyFilters = (): SalesReportFilters => ({
  dateFrom: '',
  dateTo: '',
  clientId: '',
  status: '',
  documentType: '',
  serviceCategory: '',
  serviceCode: '',
})

const serviceCategoryOptions = Object.entries(CATEGORY_CONFIG) as Array<
  [CategorySlug, (typeof CATEGORY_CONFIG)[CategorySlug]]
>

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'Annulled':
      return 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
    case 'PartiallyAnnulled':
      return 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
    case 'Sent':
      return 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
    case 'Processing':
      return 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
    case 'Failed':
      return 'bg-red-500/15 text-red-600 border border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const docTypeBadgeClass = (docType: string) => {
  switch (docType) {
    case 'Invoice':
      return 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
    case 'CreditNote':
      return 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const formatCurrency = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP' }).format(value)

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

export function SalesReport() {
  const { t, i18n } = useTranslation()
  const { currentWorkspace } = useAuth()
  const { apiClient } = useApiClient()

  const [items, setItems] = useState<SalesReportItem[]>([])
  const [summary, setSummary] = useState<SalesReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [hasFetched, setHasFetched] = useState(false)

  const [draftFilters, setDraftFilters] = useState<SalesReportFilters>(() =>
    createEmptyFilters(),
  )
  const [appliedFilters, setAppliedFilters] = useState<SalesReportFilters>(() =>
    createEmptyFilters(),
  )

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'
  const totalPages = Math.ceil(totalCount / pageSize)

  const fetchReport = useCallback(
    async (currentPage: number, filters: SalesReportFilters) => {
      if (!workspaceId || !filters.dateFrom || !filters.dateTo) return

      try {
        setIsLoading(true)
        setError(null)
        const response =
          await apiClient.ripsAdminPresentationEndpointsReportsGetSalesReportEndpoint(
            workspaceId,
            filters.dateFrom,
            filters.dateTo,
            currentPage,
            pageSize,
            filters.clientId || undefined,
            filters.status || undefined,
            filters.documentType || undefined,
            filters.serviceCategory || undefined,
            filters.serviceCode || undefined,
            {
            },
          )
        const data = response.data
        setItems(
          (data.items ?? []).map((item) => ({
            date: item.date ?? '',
            documentType: item.documentType ?? '',
            number: item.number ?? '',
            clientName: item.clientName ?? '',
            subtotal: item.subtotal ?? 0,
            tax: item.tax ?? 0,
            totalAmount: item.totalAmount ?? 0,
            status: item.status ?? '',
            cufeOrCude: item.cufeOrCude ?? null,
          })),
        )
        setSummary(
          data.summary
            ? {
                totalInvoiced: data.summary.totalInvoiced ?? 0,
                totalCredited: data.summary.totalCredited ?? 0,
                netRevenue: data.summary.netRevenue ?? 0,
                documentCount: data.summary.documentCount ?? 0,
              }
            : null,
        )
        setTotalCount(data.totalCount ?? 0)
        setHasFetched(true)
      } catch (err) {
        const apiError = (err as { response?: { data?: { error?: string } } })
          .response?.data?.error
        setError(apiError ?? t('reportsPage.sales.loadError'))
      } finally {
        setIsLoading(false)
      }
    },
    [apiClient, workspaceId, pageSize, t],
  )

  const handleApply = useCallback(() => {
    if (!draftFilters.dateFrom || !draftFilters.dateTo) return

    const nextAppliedFilters = { ...draftFilters }
    setAppliedFilters(nextAppliedFilters)
    setPage(1)
    void fetchReport(1, nextAppliedFilters)
  }, [draftFilters, fetchReport])

  const handleClear = useCallback(() => {
    const emptyFilters = createEmptyFilters()
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setItems([])
    setSummary(null)
    setTotalCount(0)
    setPage(1)
    setHasFetched(false)
    setError(null)
  }, [])

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      void fetchReport(newPage, appliedFilters)
    },
    [appliedFilters, fetchReport],
  )

  const handleDownloadCsv = useCallback(async () => {
    if (!workspaceId || !appliedFilters.dateFrom || !appliedFilters.dateTo) return

    try {
      setIsDownloading(true)
      const csvResponse =
        await apiClient.ripsAdminPresentationEndpointsReportsDownloadSalesReportCsvEndpoint(
          workspaceId,
          {
            params: {
              dateFrom: appliedFilters.dateFrom,
              dateTo: appliedFilters.dateTo,
              clientId: appliedFilters.clientId || undefined,
              status: appliedFilters.status || undefined,
              documentType: appliedFilters.documentType || undefined,
              serviceCategory: appliedFilters.serviceCategory || undefined,
              serviceCode: appliedFilters.serviceCode || undefined,
            },
            responseType: 'blob',
          },
        )
      const csvData = csvResponse.data as unknown as BlobPart
      const url = window.URL.createObjectURL(new Blob([csvData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `sales_report_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error
      setError(apiError ?? t('reportsPage.sales.loadError'))
    } finally {
      setIsDownloading(false)
    }
  }, [apiClient, workspaceId, appliedFilters, t])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('reportsPage.sales.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('reportsPage.sales.description')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('reportsPage.sales.title')}
          </CardTitle>
          <CardDescription>
            {t('reportsPage.sales.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.dateFrom')}</Label>
              <Input
                type="date"
                value={draftFilters.dateFrom}
                onChange={(e) =>
                  setDraftFilters((current) => ({
                    ...current,
                    dateFrom: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.dateTo')}</Label>
              <Input
                type="date"
                value={draftFilters.dateTo}
                onChange={(e) =>
                  setDraftFilters((current) => ({
                    ...current,
                    dateTo: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.client')}</Label>
              <Input
                placeholder={t('reportsPage.sales.allClients')}
                value={draftFilters.clientId}
                onChange={(e) =>
                  setDraftFilters((current) => ({
                    ...current,
                    clientId: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.status')}</Label>
              <Select
                value={draftFilters.status || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('reportsPage.sales.allStatuses')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('reportsPage.sales.allStatuses')}
                  </SelectItem>
                  <SelectItem value="Sent">
                    {t('invoicesPage.status.sent')}
                  </SelectItem>
                  <SelectItem value="PartiallyAnnulled">
                    {t('invoicesPage.status.partiallyannulled')}
                  </SelectItem>
                  <SelectItem value="Annulled">
                    {t('invoicesPage.status.annulled')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.documentType')}</Label>
              <Select
                value={draftFilters.documentType || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    documentType: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('reportsPage.sales.allTypes')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('reportsPage.sales.allTypes')}
                  </SelectItem>
                  <SelectItem value="Invoice">
                    {t('reportsPage.sales.invoice')}
                  </SelectItem>
                  <SelectItem value="CreditNote">
                    {t('reportsPage.sales.creditNote')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.serviceCategory')}</Label>
              <Select
                value={draftFilters.serviceCategory || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    serviceCategory: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('reportsPage.sales.allServiceCategories')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('reportsPage.sales.allServiceCategories')}
                  </SelectItem>
                  {serviceCategoryOptions.map(([slug, config]) => (
                    <SelectItem key={slug} value={slug}>
                      {t(config.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.sales.serviceCode')}</Label>
              <Input
                placeholder={t('reportsPage.sales.serviceCodePlaceholder')}
                value={draftFilters.serviceCode}
                onChange={(e) =>
                  setDraftFilters((current) => ({
                    ...current,
                    serviceCode: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleApply}
              disabled={
                !draftFilters.dateFrom || !draftFilters.dateTo || isLoading || isDownloading
              }
            >
              <Search className="mr-2 h-4 w-4" />
              {t('reportsPage.sales.apply')}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              {t('reportsPage.sales.clearFilters')}
            </Button>
            {hasFetched && (
              <>
                <Button
                  variant="outline"
                  onClick={() => void fetchReport(page, appliedFilters)}
                  disabled={isLoading || isDownloading}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t('reportsPage.sales.apply')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDownloadCsv()}
                  disabled={isLoading || isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('reportsPage.sales.download')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.sales.summary.totalInvoiced')}
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-600">
                {formatCurrency(summary.totalInvoiced, locale)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.sales.summary.totalCredited')}
              </CardDescription>
              <CardTitle className="text-2xl text-rose-600">
                {formatCurrency(summary.totalCredited, locale)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.sales.summary.netRevenue')}
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(summary.netRevenue, locale)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {hasFetched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t('reportsPage.sales.summary.documents')}
            </CardTitle>
            <CardDescription>
              {totalCount} {t('reportsPage.sales.summary.documents').toLowerCase()}
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
                  {t('reportsPage.sales.noResults')}
                </h3>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t('reportsPage.sales.table.date')}
                        </TableHead>
                        <TableHead>
                          {t('reportsPage.sales.table.documentType')}
                        </TableHead>
                        <TableHead>
                          {t('reportsPage.sales.table.number')}
                        </TableHead>
                        <TableHead>
                          {t('reportsPage.sales.table.client')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('reportsPage.sales.table.subtotal')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('reportsPage.sales.table.tax')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('reportsPage.sales.table.total')}
                        </TableHead>
                        <TableHead>
                          {t('reportsPage.sales.table.status')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={`${item.documentType}-${item.number}-${index}`}>
                          <TableCell>
                            {formatDate(item.date, locale)}
                          </TableCell>
                          <TableCell>
                            <Badge className={docTypeBadgeClass(item.documentType)}>
                              {item.documentType === 'Invoice'
                                ? t('reportsPage.sales.invoice')
                                : t('reportsPage.sales.creditNote')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {item.number || '\u2014'}
                          </TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.subtotal, locale)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.tax, locale)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.totalAmount, locale)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={statusBadgeClass(item.status)}
                            >
                              {t(
                                `invoicesPage.status.${item.status.toLowerCase()}`,
                              )}
                            </Badge>
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
                            onClick={() =>
                              handlePageChange(Math.max(1, page - 1))
                            }
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
                              handlePageChange(Math.min(totalPages, page + 1))
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
      )}
    </div>
  )
}
