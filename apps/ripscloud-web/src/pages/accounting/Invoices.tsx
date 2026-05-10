import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCcw,
  FileText,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  ChevronsUpDown,
  Plus,
} from 'lucide-react'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import type {
  RipsAdminApplicationDTOsInvoiceDraftListItemDto,
  RipsAdminApplicationDTOsInvoiceDraftListResponseDto,
} from '@/api'

type InvoiceDraftListItem = {
  id: string
  clientId: string
  clientName: string
  totalAmount: number
  status: string
  statusMessage?: string | null
  createdAt: string
  updatedAt: string
  submittedBy: string
  assignedInvoiceNumber?: string | null
  kind: 'Commercial' | 'Health'
  cuv?: string | null
}

type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'invoiceNumber' | 'createdAt' | 'clientName' | 'total' | 'status' | 'submittedBy' | null

type Filters = {
  invoiceNumber: string
  clientName: string
  status: string
  submittedBy: string
  createdFrom: string
  createdTo: string
  totalMin: string
  totalMax: string
}

const emptyFilters: Filters = {
  invoiceNumber: '',
  clientName: '',
  status: '',
  submittedBy: '',
  createdFrom: '',
  createdTo: '',
  totalMin: '',
  totalMax: '',
}

const mapDraftListItem = (
  dto: RipsAdminApplicationDTOsInvoiceDraftListItemDto
): InvoiceDraftListItem => ({
  id: dto.id ?? '',
  clientId: dto.clientId ?? '',
  clientName: dto.clientName ?? '',
  totalAmount: dto.totalAmount ?? 0,
  status: dto.status ?? 'Queued',
  statusMessage: dto.statusMessage,
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
  submittedBy: dto.submittedByDisplayName ?? '',
  assignedInvoiceNumber: dto.assignedInvoiceNumber,
  kind: (dto.kind ?? 'Commercial') as 'Commercial' | 'Health',
  cuv: dto.cuv,
})

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
    case 'Cancelled':
      return 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

type ColumnHeaderProps = {
  column: SortColumn
  label: string
  sortBy: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn, direction: SortDirection) => void
  filterContent?: React.ReactNode
  hasActiveFilter?: boolean
  className?: string
}

function ColumnHeader({
  column,
  label,
  sortBy,
  sortDirection,
  onSort,
  filterContent,
  hasActiveFilter,
  className,
}: ColumnHeaderProps) {
  const { t } = useTranslation()
  const isActive = sortBy === column
  const [open, setOpen] = useState(false)

  const handleSort = (direction: SortDirection) => {
    onSort(column, direction)
    setOpen(false)
  }

  return (
    <TableHead className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent flex items-center gap-1"
          >
            {label}
            {isActive && sortDirection === 'asc' && (
              <ArrowUp className="h-3.5 w-3.5 text-primary" />
            )}
            {isActive && sortDirection === 'desc' && (
              <ArrowDown className="h-3.5 w-3.5 text-primary" />
            )}
            {!isActive && <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
            {hasActiveFilter && (
              <Filter className="h-3 w-3 text-primary fill-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <Button
                variant={isActive && sortDirection === 'asc' ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => handleSort('asc')}
              >
                <ArrowUp className="mr-2 h-3.5 w-3.5" />
                {t('invoicesPage.filters.sortAsc')}
              </Button>
              <Button
                variant={isActive && sortDirection === 'desc' ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => handleSort('desc')}
              >
                <ArrowDown className="mr-2 h-3.5 w-3.5" />
                {t('invoicesPage.filters.sortDesc')}
              </Button>
              {isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-muted-foreground"
                  onClick={() => handleSort(null)}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  {t('invoicesPage.filters.clearSort')}
                </Button>
              )}
            </div>
            {filterContent && (
              <>
                <div className="border-t my-2" />
                {filterContent}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TableHead>
  )
}

export function Invoices() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { apiClient } = useApiClient()
  const { currentWorkspace, roles } = useAuth()

  const [drafts, setDrafts] = useState<InvoiceDraftListItem[]>([])
  const [isListLoading, setIsListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Sorting state
  const [sortBy, setSortBy] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Filter state
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [pendingFilters, setPendingFilters] = useState<Filters>(emptyFilters)

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'
  const totalPages = Math.ceil(totalCount / pageSize)

  const hasAdminAccess = useMemo(
    () => roles.includes('SuperAdmin') || roles.includes('Admin'),
    [roles]
  )

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => v !== '').length
  }, [filters])

  const handleSort = useCallback((column: SortColumn, direction: SortDirection) => {
    if (direction === null) {
      setSortBy(null)
      setSortDirection(null)
    } else {
      setSortBy(column)
      setSortDirection(direction)
    }
    setPage(1)
  }, [])

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setPendingFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters)
    setPage(1)
  }, [pendingFilters])

  const clearAllFilters = useCallback(() => {
    setFilters(emptyFilters)
    setPendingFilters(emptyFilters)
    setSortBy(null)
    setSortDirection(null)
    setPage(1)
  }, [])

  const fetchDrafts = useCallback(async () => {
    if (!workspaceId || !hasAdminAccess) {
      setDrafts([])
      setIsListLoading(false)
      return
    }

    try {
      setIsListLoading(true)
      setListError(null)
      const response =
        await apiClient.ripsAdminPresentationEndpointsInvoiceListInvoiceDraftsEndpoint(
          workspaceId,
          page,
          pageSize,
          sortBy ?? undefined,
          sortDirection ?? undefined,
          filters.invoiceNumber || undefined,
          filters.clientName || undefined,
          filters.status || undefined,
          filters.submittedBy || undefined,
          filters.createdFrom || undefined,
          filters.createdTo || undefined,
          filters.totalMin ? parseFloat(filters.totalMin) : undefined,
          filters.totalMax ? parseFloat(filters.totalMax) : undefined
        )
      const data = response.data as
        | RipsAdminApplicationDTOsInvoiceDraftListResponseDto
        | undefined
      const mapped = data?.items?.map(mapDraftListItem) ?? []
      setDrafts(mapped)
      setTotalCount(data?.totalCount ?? 0)
    } catch (error) {
      const apiError = (error as { response?: { data?: { error?: string } } })
        .response?.data?.error
      setListError(apiError ?? t('invoicesPage.errors.loadDrafts'))
    } finally {
      setIsListLoading(false)
    }
  }, [
    apiClient,
    hasAdminAccess,
    t,
    workspaceId,
    page,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  ])

  useEffect(() => {
    void fetchDrafts()
  }, [fetchDrafts])

  // Sync pending filters with applied filters when component mounts or filters change externally
  useEffect(() => {
    setPendingFilters(filters)
  }, [filters])

  if (!hasAdminAccess) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>{t('invoicesPage.noAccessTitle')}</AlertTitle>
          <AlertDescription>
            {t('invoicesPage.noAccessDescription')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderTextFilter = (
    filterKey: keyof Filters,
    columnName: string
  ) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        {t('invoicesPage.filters.filterBy', { column: columnName })}
      </Label>
      <Input
        placeholder={t('invoicesPage.filters.search')}
        value={pendingFilters[filterKey]}
        onChange={(e) => handleFilterChange(filterKey, e.target.value)}
        className="h-8"
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('invoicesPage.filters.apply')}
        </Button>
        {filters[filterKey] && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              handleFilterChange(filterKey, '')
              setFilters((prev) => ({ ...prev, [filterKey]: '' }))
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderStatusFilter = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        {t('invoicesPage.filters.filterBy', {
          column: t('invoicesPage.table.status'),
        })}
      </Label>
      <Select
        value={pendingFilters.status}
        onValueChange={(value) =>
          handleFilterChange('status', value === 'all' ? '' : value)
        }
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder={t('invoicesPage.filters.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('invoicesPage.filters.allStatuses')}
          </SelectItem>
          <SelectItem value="Queued">{t('invoicesPage.status.queued')}</SelectItem>
          <SelectItem value="Processing">
            {t('invoicesPage.status.processing')}
          </SelectItem>
          <SelectItem value="Sent">{t('invoicesPage.status.sent')}</SelectItem>
          <SelectItem value="PartiallyAnnulled">
            {t('invoicesPage.status.partiallyannulled')}
          </SelectItem>
          <SelectItem value="Annulled">
            {t('invoicesPage.status.annulled')}
          </SelectItem>
          <SelectItem value="Failed">{t('invoicesPage.status.failed')}</SelectItem>
          <SelectItem value="Cancelled">{t('invoicesPage.status.cancelled')}</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('invoicesPage.filters.apply')}
        </Button>
        {filters.status && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              handleFilterChange('status', '')
              setFilters((prev) => ({ ...prev, status: '' }))
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderDateFilter = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        {t('invoicesPage.filters.filterBy', {
          column: t('invoicesPage.table.createdAt'),
        })}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">{t('invoicesPage.filters.from')}</Label>
          <Input
            type="date"
            value={pendingFilters.createdFrom}
            onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">{t('invoicesPage.filters.to')}</Label>
          <Input
            type="date"
            value={pendingFilters.createdTo}
            onChange={(e) => handleFilterChange('createdTo', e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('invoicesPage.filters.apply')}
        </Button>
        {(filters.createdFrom || filters.createdTo) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              handleFilterChange('createdFrom', '')
              handleFilterChange('createdTo', '')
              setFilters((prev) => ({ ...prev, createdFrom: '', createdTo: '' }))
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderAmountFilter = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        {t('invoicesPage.filters.filterBy', {
          column: t('invoicesPage.table.total'),
        })}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">{t('invoicesPage.filters.min')}</Label>
          <Input
            type="number"
            value={pendingFilters.totalMin}
            onChange={(e) => handleFilterChange('totalMin', e.target.value)}
            className="h-8"
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-xs">{t('invoicesPage.filters.max')}</Label>
          <Input
            type="number"
            value={pendingFilters.totalMax}
            onChange={(e) => handleFilterChange('totalMax', e.target.value)}
            className="h-8"
            placeholder="999999"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('invoicesPage.filters.apply')}
        </Button>
        {(filters.totalMin || filters.totalMax) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              handleFilterChange('totalMin', '')
              handleFilterChange('totalMax', '')
              setFilters((prev) => ({ ...prev, totalMin: '', totalMax: '' }))
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('invoicesPage.title')}
        </h1>
        <p className="text-muted-foreground">{t('invoicesPage.description')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">
              {t('invoicesPage.list.title')}
            </CardTitle>
            <CardDescription>
              {t('invoicesPage.list.description')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                {t('invoicesPage.filters.clearAll')}
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => void fetchDrafts()}
              disabled={isListLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t('invoicesPage.actions.refresh')}
            </Button>
            <Button onClick={() => navigate('/accounting/invoices/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('invoicesPage.list.newInvoice')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {listError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}

          {isListLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {t('invoicesPage.empty.title')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg">
                {t('invoicesPage.empty.useRipsWizard')}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/accounting/invoices/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('invoicesPage.empty.createInvoice')}
                </Button>
                <Button variant="outline" onClick={() => navigate('/rips/wizard')}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('invoicesPage.empty.goToWizard')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <ColumnHeader
                        column="invoiceNumber"
                        label={t('invoicesPage.table.invoiceNumber')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.invoiceNumber}
                        filterContent={renderTextFilter(
                          'invoiceNumber',
                          t('invoicesPage.table.invoiceNumber')
                        )}
                      />
                      <ColumnHeader
                        column="createdAt"
                        label={t('invoicesPage.table.createdAt')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={
                          !!filters.createdFrom || !!filters.createdTo
                        }
                        filterContent={renderDateFilter()}
                      />
                      <ColumnHeader
                        column="clientName"
                        label={t('invoicesPage.table.client')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.clientName}
                        filterContent={renderTextFilter(
                          'clientName',
                          t('invoicesPage.table.client')
                        )}
                      />
                      <ColumnHeader
                        column="total"
                        label={t('invoicesPage.table.total')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={
                          !!filters.totalMin || !!filters.totalMax
                        }
                        filterContent={renderAmountFilter()}
                        className="text-right"
                      />
                      <ColumnHeader
                        column="status"
                        label={t('invoicesPage.table.status')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.status}
                        filterContent={renderStatusFilter()}
                      />
                      <ColumnHeader
                        column="submittedBy"
                        label={t('invoicesPage.table.submittedBy')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.submittedBy}
                        filterContent={renderTextFilter(
                          'submittedBy',
                          t('invoicesPage.table.submittedBy')
                        )}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map((draft) => (
                      <TableRow
                        key={draft.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/accounting/invoices/${draft.id}`)
                        }
                      >
                        <TableCell className="font-mono">
                          <div className="flex flex-col gap-1">
                            <span>{draft.assignedInvoiceNumber ?? '—'}</span>
                            <span
                              className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wide ${
                                draft.kind === 'Health'
                                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                  : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                              }`}
                            >
                              {t(`invoiceKind.${draft.kind === 'Health' ? 'health' : 'commercial'}`)}
                            </span>
                            {draft.cuv && (
                              <span
                                className="text-[10px] font-sans text-muted-foreground truncate max-w-[12rem]"
                                title={draft.cuv}
                              >
                                CUV: {draft.cuv.slice(0, 12)}…
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(draft.createdAt, locale)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {draft.clientName}
                            </span>
                            {draft.statusMessage && (
                              <span
                                className="text-xs text-muted-foreground truncate max-w-xs"
                                title={draft.statusMessage}
                              >
                                {draft.statusMessage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(draft.totalAmount, locale)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(draft.status)}>
                            {t(
                              `invoicesPage.status.${draft.status.toLowerCase()}`
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{draft.submittedBy}</TableCell>
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
