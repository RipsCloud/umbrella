import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Search, X } from 'lucide-react'
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
import { axiosInstance } from '@/lib/api'

type StatementItem = {
  date: string
  documentType: string
  number: string
  description: string
  debit: number
  credit: number
  runningBalance: number
}

type StatementSummary = {
  totalDebits: number
  totalCredits: number
  finalBalance: number
  clientName: string
}

const formatCurrency = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP' }).format(
    value
  )

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

export function ClientAccountStatement() {
  const { t, i18n } = useTranslation()
  const { currentWorkspace } = useAuth()

  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [items, setItems] = useState<StatementItem[]>([])
  const [summary, setSummary] = useState<StatementSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [isClientsLoading, setIsClientsLoading] = useState(true)

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'
  const totalPages = Math.ceil(totalCount / pageSize)

  // Fetch clients on mount
  useEffect(() => {
    if (!workspaceId) return

    const fetchClients = async () => {
      try {
        setIsClientsLoading(true)
        const response = await axiosInstance.get(
          `/api/workspaces/${workspaceId}/clients`
        )
        const data = response.data as
          | { id: string; companyName: string }[]
          | undefined
        const mapped = (data ?? []).map(
          (c: { id: string; companyName: string }) => ({
            id: c.id,
            name: c.companyName,
          })
        )
        setClients(mapped)
      } catch {
        setClients([])
      } finally {
        setIsClientsLoading(false)
      }
    }

    void fetchClients()
  }, [workspaceId])

  const fetchStatement = useCallback(async () => {
    if (!workspaceId || !selectedClientId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/reports/client-statement`,
        {
          params: {
            clientId: selectedClientId,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            page,
            pageSize,
          },
        }
      )
      const data = response.data as {
        items: StatementItem[]
        summary: StatementSummary
        totalCount: number
      }
      setItems(data.items ?? [])
      setSummary(data.summary ?? null)
      setTotalCount(data.totalCount ?? 0)
    } catch {
      setError(t('reportsPage.clientStatement.errors.loadReport'))
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, selectedClientId, dateFrom, dateTo, page, pageSize, t])

  // Re-fetch when page changes (only if we already have data)
  useEffect(() => {
    if (summary) {
      void fetchStatement()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleApply = () => {
    setPage(1)
    void fetchStatement()
  }

  const handleClearFilters = () => {
    setSelectedClientId('')
    setDateFrom('')
    setDateTo('')
    setItems([])
    setSummary(null)
    setTotalCount(0)
    setPage(1)
    setError(null)
  }

  const handleDownloadCsv = async () => {
    if (!workspaceId || !selectedClientId) return

    try {
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/reports/client-statement/csv`,
        {
          params: {
            clientId: selectedClientId,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          responseType: 'blob',
        }
      )
      const blob = new Blob([response.data as BlobPart], {
        type: 'text/csv',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `client_statement_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError(t('reportsPage.clientStatement.errors.downloadCsv'))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('reportsPage.clientStatement.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('reportsPage.clientStatement.description')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('reportsPage.clientStatement.filters.title')}
          </CardTitle>
          <CardDescription>
            {t('reportsPage.clientStatement.filters.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>{t('reportsPage.clientStatement.filters.client')}</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={isClientsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'reportsPage.clientStatement.filters.selectClient'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {t('reportsPage.clientStatement.filters.dateFrom')}
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reportsPage.clientStatement.filters.dateTo')}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                disabled={!selectedClientId || isLoading}
              >
                <Search className="mr-2 h-4 w-4" />
                {t('reportsPage.clientStatement.filters.apply')}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                {t('reportsPage.clientStatement.filters.clear')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.clientStatement.summary.totalDebits')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.totalDebits, locale)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.clientStatement.summary.totalCredits')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalCredits, locale)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('reportsPage.clientStatement.summary.finalBalance')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.finalBalance, locale)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">
              {t('reportsPage.clientStatement.table.title')}
            </CardTitle>
            {summary?.clientName && (
              <CardDescription>{summary.clientName}</CardDescription>
            )}
          </div>
          {summary && (
            <Button
              variant="outline"
              onClick={() => void handleDownloadCsv()}
              disabled={items.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('reportsPage.clientStatement.actions.downloadCsv')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {t('reportsPage.clientStatement.empty.title')}
              </h3>
              <p className="text-muted-foreground max-w-lg">
                {t('reportsPage.clientStatement.empty.description')}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {t('reportsPage.clientStatement.empty.noResults')}
              </h3>
              <p className="text-muted-foreground max-w-lg">
                {t('reportsPage.clientStatement.empty.noResultsDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t('reportsPage.clientStatement.table.date')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.clientStatement.table.type')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.clientStatement.table.number')}
                      </TableHead>
                      <TableHead>
                        {t('reportsPage.clientStatement.table.description')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('reportsPage.clientStatement.table.debit')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('reportsPage.clientStatement.table.credit')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('reportsPage.clientStatement.table.balance')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={`${item.number}-${index}`}>
                        <TableCell>
                          {formatDate(item.date, locale)}
                        </TableCell>
                        <TableCell>{item.documentType}</TableCell>
                        <TableCell className="font-mono">
                          {item.number || '\u2014'}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {item.debit > 0
                            ? formatCurrency(item.debit, locale)
                            : ''}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {item.credit > 0
                            ? formatCurrency(item.credit, locale)
                            : ''}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.runningBalance, locale)}
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
