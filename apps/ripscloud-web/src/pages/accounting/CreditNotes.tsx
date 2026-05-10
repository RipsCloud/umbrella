import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCcw,
  FileText,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  ChevronsUpDown,
  Receipt,
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
import { useAuth } from '@/context/useAuth'
import { axiosInstance } from '@/lib/api'

type CreditNoteDraftListItem = {
  id: string
  tenantId: string
  invoiceDraftId: string
  originalInvoiceNumber?: string | null
  clientId: string
  clientName: string
  totalAmount: number
  status: string
  assignedCreditNoteNumber?: string | null
  discrepancyResponseCode: number
  discrepancyResponseDescription: string
  createdAt: string
  updatedAt: string
  kind?: 'Commercial' | 'Health'
}

type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'creditNoteNumber' | 'createdAt' | 'clientName' | 'total' | 'status' | 'originalInvoice' | null

type Filters = {
  creditNoteNumber: string
  originalInvoiceNumber: string
  clientName: string
  status: string
  createdFrom: string
  createdTo: string
}

const emptyFilters: Filters = {
  creditNoteNumber: '',
  originalInvoiceNumber: '',
  clientName: '',
  status: '',
  createdFrom: '',
  createdTo: '',
}

const statusBadgeClass = (status: string) => {
  switch (status) {
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

const discrepancyBadgeClass = (code: number) => {
  switch (code) {
    case 1:
      return 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
    case 2:
      return 'bg-red-500/15 text-red-600 border border-red-500/30'
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
                {t('creditNotesPage.filters.sortAsc')}
              </Button>
              <Button
                variant={isActive && sortDirection === 'desc' ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => handleSort('desc')}
              >
                <ArrowDown className="mr-2 h-3.5 w-3.5" />
                {t('creditNotesPage.filters.sortDesc')}
              </Button>
              {isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-muted-foreground"
                  onClick={() => handleSort(null)}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  {t('creditNotesPage.filters.clearSort')}
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

export function CreditNotes() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { currentWorkspace, roles } = useAuth()

  const [drafts, setDrafts] = useState<CreditNoteDraftListItem[]>([])
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
      
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      if (sortBy) params.append('sortBy', sortBy)
      if (sortDirection) params.append('sortDirection', sortDirection)
      if (filters.creditNoteNumber) params.append('creditNoteNumber', filters.creditNoteNumber)
      if (filters.originalInvoiceNumber) params.append('originalInvoiceNumber', filters.originalInvoiceNumber)
      if (filters.clientName) params.append('clientName', filters.clientName)
      if (filters.status) params.append('status', filters.status)
      if (filters.createdFrom) params.append('createdFrom', filters.createdFrom)
      if (filters.createdTo) params.append('createdTo', filters.createdTo)

      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/credit-notes?${params.toString()}`
      )
      
      const data = response.data
      setDrafts(data?.items ?? [])
      setTotalCount(data?.totalCount ?? 0)
    } catch (error) {
      const apiError = (error as { response?: { data?: { error?: string } } })
        .response?.data?.error
      setListError(apiError ?? t('creditNotesPage.errors.loadDrafts'))
    } finally {
      setIsListLoading(false)
    }
  }, [
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

  useEffect(() => {
    setPendingFilters(filters)
  }, [filters])

  if (!hasAdminAccess) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>{t('creditNotesPage.noAccessTitle')}</AlertTitle>
          <AlertDescription>
            {t('creditNotesPage.noAccessDescription')}
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
        {t('creditNotesPage.filters.filterBy', { column: columnName })}
      </Label>
      <Input
        placeholder={t('creditNotesPage.filters.search')}
        value={pendingFilters[filterKey]}
        onChange={(e) => handleFilterChange(filterKey, e.target.value)}
        className="h-8"
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('creditNotesPage.filters.apply')}
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
        {t('creditNotesPage.filters.filterBy', {
          column: t('creditNotesPage.table.status'),
        })}
      </Label>
      <Select
        value={pendingFilters.status}
        onValueChange={(value) =>
          handleFilterChange('status', value === 'all' ? '' : value)
        }
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder={t('creditNotesPage.filters.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('creditNotesPage.filters.allStatuses')}
          </SelectItem>
          <SelectItem value="Queued">{t('creditNotesPage.status.queued')}</SelectItem>
          <SelectItem value="Processing">
            {t('creditNotesPage.status.processing')}
          </SelectItem>
          <SelectItem value="Sent">{t('creditNotesPage.status.sent')}</SelectItem>
          <SelectItem value="Failed">{t('creditNotesPage.status.failed')}</SelectItem>
          <SelectItem value="Cancelled">{t('creditNotesPage.status.cancelled')}</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={applyFilters}>
          {t('creditNotesPage.filters.apply')}
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
        {t('creditNotesPage.filters.filterBy', {
          column: t('creditNotesPage.table.createdAt'),
        })}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">{t('creditNotesPage.filters.from')}</Label>
          <Input
            type="date"
            value={pendingFilters.createdFrom}
            onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">{t('creditNotesPage.filters.to')}</Label>
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
          {t('creditNotesPage.filters.apply')}
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('creditNotesPage.title')}
        </h1>
        <p className="text-muted-foreground">{t('creditNotesPage.description')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">
              {t('creditNotesPage.list.title')}
            </CardTitle>
            <CardDescription>
              {t('creditNotesPage.list.description')}
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
                {t('creditNotesPage.filters.clearAll')}
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
              {t('creditNotesPage.actions.refresh')}
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
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {t('creditNotesPage.empty.title')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg">
                {t('creditNotesPage.empty.description')}
              </p>
              <Button onClick={() => navigate('/accounting/invoices')}>
                <FileText className="mr-2 h-4 w-4" />
                {t('creditNotesPage.empty.goToInvoices')}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <ColumnHeader
                        column="creditNoteNumber"
                        label={t('creditNotesPage.table.creditNoteNumber')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.creditNoteNumber}
                        filterContent={renderTextFilter(
                          'creditNoteNumber',
                          t('creditNotesPage.table.creditNoteNumber')
                        )}
                      />
                      <ColumnHeader
                        column="originalInvoice"
                        label={t('creditNotesPage.table.originalInvoice')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.originalInvoiceNumber}
                        filterContent={renderTextFilter(
                          'originalInvoiceNumber',
                          t('creditNotesPage.table.originalInvoice')
                        )}
                      />
                      <ColumnHeader
                        column="createdAt"
                        label={t('creditNotesPage.table.createdAt')}
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
                        label={t('creditNotesPage.table.client')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.clientName}
                        filterContent={renderTextFilter(
                          'clientName',
                          t('creditNotesPage.table.client')
                        )}
                      />
                      <ColumnHeader
                        column="total"
                        label={t('creditNotesPage.table.total')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-right"
                      />
                      <TableHead>{t('creditNotesPage.table.type')}</TableHead>
                      <ColumnHeader
                        column="status"
                        label={t('creditNotesPage.table.status')}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        hasActiveFilter={!!filters.status}
                        filterContent={renderStatusFilter()}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map((draft) => (
                      <TableRow
                        key={draft.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/accounting/credit-notes/${draft.id}`)
                        }
                      >
                        <TableCell className="font-mono">
                          <div className="flex flex-col gap-1">
                            <span>{draft.assignedCreditNoteNumber ?? '—'}</span>
                            {draft.kind && (
                              <span
                                className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wide ${
                                  draft.kind === 'Health'
                                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                    : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                                }`}
                              >
                                {t(`invoiceKind.${draft.kind === 'Health' ? 'health' : 'commercial'}`)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {draft.originalInvoiceNumber ?? '—'}
                        </TableCell>
                        <TableCell>
                          {formatDate(draft.createdAt, locale)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{draft.clientName}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(draft.totalAmount, locale)}
                        </TableCell>
                        <TableCell>
                          <Badge className={discrepancyBadgeClass(draft.discrepancyResponseCode)}>
                            {draft.discrepancyResponseCode === 1
                              ? t('creditNotesPage.type.partial')
                              : t('creditNotesPage.type.full')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(draft.status)}>
                            {t(
                              `creditNotesPage.status.${draft.status.toLowerCase()}`
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
