import { useCallback, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Copy,
  ChevronDown,
  ChevronUp,
  Code,
  Receipt,
  Info,
  Download,
  Mail,
  MinusCircle,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/api'
import type {
  RipsAdminApplicationDTOsInvoiceDraftDetailsDto,
  RipsAdminApplicationDTOsDispatchAttemptDto,
} from '@/api'

const exportFormats = [
  { key: 'default', label: 'Default' },
  { key: 'fomag', label: 'FOMAG' },
  { key: 'sura', label: 'SURA' },
  { key: 'colmena', label: 'COLMENA' },
  { key: 'axa-colpatria', label: 'Axa Colpatria' },
] as const

type DispatchAttempt = {
  attemptedAt: string
  succeeded: boolean
  errorMessage?: string | null
  requestPayload?: string | null
  responsePayload?: string | null
  source: string
}

type DocumentType = 'pdf' | 'xml' | 'attached'

type DocumentAvailability = {
  documentType: DocumentType
  isSupported: boolean
  canDownload: boolean
}

type InvoiceDetail = {
  id: string
  tenantId: string
  clientId: string
  clientName: string
  totalAmount: number
  status: string
  statusMessage?: string | null
  submittedByUserId: string
  submittedByDisplayName: string
  createdAt: string
  updatedAt: string
  assignedInvoiceNumber?: string | null
  cufe?: string | null
  cuv?: string | null
  kind?: 'Commercial' | 'Health'
  dianStatusCode?: string | null
  dianStatusDescription?: string | null
  invoiceDispatchHistory: DispatchAttempt[]
  ripsDispatchHistory: DispatchAttempt[]
  documentAvailability: DocumentAvailability[]
  hasRips: boolean
}

// Parsed response types
type InvoiceResponse = {
  success?: boolean
  message?: string
  cufe?: string
  QRStr?: string
  urlinvoicepdf?: string
  urlinvoicexml?: string
  urlinvoiceattached?: string
  send_email_success?: boolean
  resolution_days_left?: number
  certificate_days_left?: number
}

type RipsValidation = {
  Clase: string
  Codigo: string
  Descripcion: string
  Observaciones?: string
  PathFuente?: string
  Fuente?: string
}

type RipsResponse = {
  ResultState?: boolean
  ProcesoId?: number
  NumFactura?: string
  CodigoUnicoValidacion?: string
  FechaRadicacion?: string
  ResultadosValidacion?: RipsValidation[]
}

type InvoiceRequest = {
  date?: string
  time?: string
  number?: string
  prefix?: string
  resolution_number?: string
  customer?: {
    name?: string
    identification_number?: string
    dv?: string | null
    email?: string
    phone?: string
    address?: string
  }
  invoice_lines?: Array<{
    description?: string
    price_amount?: string
    invoiced_quantity?: string
  }>
  legal_monetary_totals?: {
    line_extension_amount?: string
    tax_exclusive_amount?: string
    tax_inclusive_amount?: string
    payable_amount?: string
  }
}

type RipsRequest = {
  Rips?: Record<string, unknown>
  XmlFevFile?: string | null
}

const mapDispatchAttempt = (dto: RipsAdminApplicationDTOsDispatchAttemptDto): DispatchAttempt => ({
  attemptedAt: dto.attemptedAt ?? new Date().toISOString(),
  succeeded: dto.succeeded ?? false,
  errorMessage: dto.errorMessage,
  requestPayload: dto.requestPayload,
  responsePayload: dto.responsePayload,
  source: dto.source ?? 'Unknown',
})

const defaultDocumentAvailability: DocumentAvailability[] = [
  { documentType: 'pdf', isSupported: false, canDownload: false },
  { documentType: 'xml', isSupported: false, canDownload: false },
  { documentType: 'attached', isSupported: false, canDownload: false },
]

const mapDocumentAvailability = (dto: RipsAdminApplicationDTOsInvoiceDraftDetailsDto): DocumentAvailability[] => {
  const rawAvailability = (dto as unknown as {
    documentAvailability?: Array<{
      documentType?: string
      isSupported?: boolean
      canDownload?: boolean
    }>
  }).documentAvailability

  if (!rawAvailability || rawAvailability.length === 0) {
    return defaultDocumentAvailability
  }

  const byType = new Map<DocumentType, DocumentAvailability>()
  for (const item of rawAvailability) {
    const documentType = item.documentType?.toLowerCase()
    if (documentType !== 'pdf' && documentType !== 'xml' && documentType !== 'attached') {
      continue
    }

    byType.set(documentType, {
      documentType,
      isSupported: item.isSupported ?? false,
      canDownload: item.canDownload ?? false,
    })
  }

  return (['pdf', 'xml', 'attached'] as const).map(
    (documentType) => byType.get(documentType) ?? { documentType, isSupported: false, canDownload: false }
  )
}

const mapInvoiceDetail = (dto: RipsAdminApplicationDTOsInvoiceDraftDetailsDto): InvoiceDetail => ({
  id: dto.id ?? '',
  tenantId: dto.tenantId ?? '',
  clientId: dto.clientId ?? '',
  clientName: dto.clientName ?? '',
  totalAmount: dto.totalAmount ?? 0,
  status: dto.status ?? 'Queued',
  statusMessage: dto.statusMessage,
  submittedByUserId: dto.submittedByUserId ?? '',
  submittedByDisplayName: dto.submittedByDisplayName ?? '',
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
  assignedInvoiceNumber: dto.assignedInvoiceNumber,
  cufe: dto.cufe,
  cuv: dto.cuv,
  kind: (dto.kind ?? 'Commercial') as 'Commercial' | 'Health',
  dianStatusCode: dto.dianStatusCode,
  dianStatusDescription: dto.dianStatusDescription,
  invoiceDispatchHistory: dto.invoiceDispatchHistory?.map(mapDispatchAttempt) ?? [],
  ripsDispatchHistory: dto.ripsDispatchHistory?.map(mapDispatchAttempt) ?? [],
  documentAvailability: mapDocumentAvailability(dto),
  hasRips: !!dto.ripsPayloadJson,
})

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Annulled':
      return <MinusCircle className="h-5 w-5 text-rose-500" />
    case 'PartiallyAnnulled':
      return <MinusCircle className="h-5 w-5 text-amber-500" />
    case 'Sent':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    case 'Processing':
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
    case 'Failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

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

const validationBadgeClass = (clase: string) => {
  switch (clase?.toUpperCase()) {
    case 'RECHAZADO':
    case 'ERROR':
      return 'bg-red-500/15 text-red-600 border border-red-500/30'
    case 'ADVERTENCIA':
    case 'WARNING':
      return 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
    case 'NOTIFICACION':
    case 'INFO':
      return 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const formatCurrency = (value: number | string, locale: string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP' }).format(numValue)
}

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

const parseJsonSafe = <T,>(str: string | null | undefined): T | null => {
  if (!str) return null
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

// User-friendly Invoice View Component
function InvoiceView({ invoice, locale, t, workspaceId }: { invoice: InvoiceDetail; locale: string; t: (key: string) => string; workspaceId: string }) {
  const lastInvoiceAttempt = invoice.invoiceDispatchHistory[0]
  const lastRipsAttempt = invoice.ripsDispatchHistory[0]
  
  const invoiceRequest = useMemo(() => 
    parseJsonSafe<InvoiceRequest>(lastInvoiceAttempt?.requestPayload), 
    [lastInvoiceAttempt?.requestPayload]
  )
  const invoiceResponse = useMemo(() => 
    parseJsonSafe<InvoiceResponse>(lastInvoiceAttempt?.responsePayload), 
    [lastInvoiceAttempt?.responsePayload]
  )
  const ripsRequest = useMemo(() => 
    parseJsonSafe<RipsRequest>(lastRipsAttempt?.requestPayload), 
    [lastRipsAttempt?.requestPayload]
  )
  const ripsResponse = useMemo(() => 
    parseJsonSafe<RipsResponse>(lastRipsAttempt?.responsePayload), 
    [lastRipsAttempt?.responsePayload]
  )

  // Download JSON data as file
  const downloadJson = (data: unknown, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('invoiceDetails.copiedToClipboard'))
  }

  // Download document with authentication using axios instance
  const downloadDocument = async (documentType: 'pdf' | 'xml' | 'attached') => {
    try {
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/invoice/documents/${invoice.id}/download/${documentType}`,
        { responseType: 'blob' }
      )
      
      const contentType = response.headers?.['content-type']
      const blobType = typeof contentType === 'string' ? contentType : undefined
      const blob = new Blob([response.data], blobType ? { type: blobType } : undefined)
      const rawContentDisposition = response.headers?.['content-disposition']
      const contentDisposition = typeof rawContentDisposition === 'string' ? rawContentDisposition : undefined
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const fallbackFileName = documentType === 'pdf' ? 'invoice.pdf' : 'invoice.xml'
      const filename = filenameMatch?.[1] || fallbackFileName
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t('invoiceDetails.downloadError'))
    }
  }

  // Resend invoice via email
  const resendInvoice = async () => {
    try {
      await axiosInstance.post(
        `/api/workspaces/${workspaceId}/invoice/documents/${invoice.id}/resend`
      )
      toast.success(t('invoiceDetails.resendSuccess'))
    } catch (error) {
      console.error('Resend error:', error)
      toast.error(t('invoiceDetails.resendError'))
    }
  }

  const exportPackage = async (format: string) => {
    try {
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/invoice/documents/${invoice.id}/export/${format}`,
        { responseType: 'blob' }
      )

      const blob = new Blob([response.data], { type: 'application/zip' })
      const contentDisposition = response.headers?.['content-disposition']
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || `${invoice.assignedInvoiceNumber || invoice.id}.zip`

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('invoiceDetails.exportError'))
    }
  }

  const customer = invoiceRequest?.customer
  const lines = invoiceRequest?.invoice_lines ?? []
  const totals = invoiceRequest?.legal_monetary_totals
  const validations = ripsResponse?.ResultadosValidacion ?? []
  
  const rejections = validations.filter(v => v.Clase?.toUpperCase() === 'RECHAZADO')
  const errors = validations.filter(v => v.Clase?.toUpperCase() === 'ERROR')
  const warnings = validations.filter(v => v.Clase?.toUpperCase() === 'ADVERTENCIA' || v.Clase?.toUpperCase() === 'WARNING')
  const notifications = validations.filter(v => v.Clase?.toUpperCase() === 'NOTIFICACION' || v.Clase?.toUpperCase() === 'INFO')

  const documentByType = new Map<DocumentType, DocumentAvailability>(
    invoice.documentAvailability.map((item) => [item.documentType, item])
  )
  const pdfDocument = documentByType.get('pdf') ?? defaultDocumentAvailability[0]
  const xmlDocument = documentByType.get('xml') ?? defaultDocumentAvailability[1]
  const attachedDocument = documentByType.get('attached') ?? defaultDocumentAvailability[2]

  const getDocumentHint = (document: DocumentAvailability) => {
    if (!document.isSupported) {
      return t('invoiceDetails.documentNotSupported')
    }

    if (!document.canDownload) {
      return t('invoiceDetails.documentNotAvailable')
    }

    return null
  }

  const canResendInvoice = pdfDocument.canDownload && (xmlDocument.canDownload || attachedDocument.canDownload)
  const resendHint = canResendInvoice ? null : t('invoiceDetails.resendNotSupported')
  const canExportPackage = attachedDocument.canDownload && invoice.hasRips

  return (
    <div className="space-y-6">
      {/* Invoice Header - like a PDF invoice */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            {/* Left: Invoice Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t('invoiceDetails.electronicInvoice')}
                </h2>
                {invoice.hasRips && <p className="text-muted-foreground">{t('invoiceDetails.healthSector')}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('invoiceDetails.invoiceNumber')}</p>
                  <p className="font-semibold font-mono text-lg">{invoice.assignedInvoiceNumber || (invoiceRequest?.prefix && invoiceRequest?.number ? `${invoiceRequest.prefix}${invoiceRequest.number}` : '—')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('invoiceDetails.issueDate')}</p>
                  <p className="font-medium">{invoiceRequest?.date || formatDate(invoice.createdAt, locale).split(',')[0]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('invoiceDetails.resolution')}</p>
                  <p className="font-medium text-xs">{invoiceRequest?.resolution_number || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('invoiceDetails.status')}</p>
                  <Badge className={statusBadgeClass(invoice.status)}>
                    {t(`invoicesPage.status.${invoice.status.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Client Info */}
            <div className="md:text-right space-y-2">
              <p className="text-muted-foreground text-sm">{t('invoiceDetails.billedTo')}</p>
              <p className="font-semibold text-lg">{customer?.name || invoice.clientName}</p>
              <p className="text-sm">NIT: {customer?.identification_number}{customer?.dv ? `-${customer.dv}` : ''}</p>
              {customer?.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
              {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
              {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CUFE & QR Info */}
      {(invoice.cufe || invoiceResponse?.cufe) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('invoiceDetails.dianValidation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">CUFE</p>
                <p className="font-mono text-xs break-all">{invoice.cufe || invoiceResponse?.cufe}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(invoice.cufe || invoiceResponse?.cufe || '')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {invoice.cuv && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">CUV</p>
                  <p className="font-mono text-xs break-all">{invoice.cuv}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(invoice.cuv || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pdfDocument.canDownload}
                title={getDocumentHint(pdfDocument) ?? undefined}
                onClick={() => downloadDocument('pdf')}
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!xmlDocument.canDownload}
                title={getDocumentHint(xmlDocument) ?? undefined}
                onClick={() => downloadDocument('xml')}
              >
                <Code className="h-4 w-4 mr-1" />
                XML
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!attachedDocument.canDownload}
                title={getDocumentHint(attachedDocument) ?? undefined}
                onClick={() => downloadDocument('attached')}
              >
                <FileText className="h-4 w-4 mr-1" />
                {t('invoiceDetails.attachedDocument')}
              </Button>
                {ripsResponse?.ResultState === true && ripsRequest?.Rips && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadJson(ripsRequest.Rips, `RIPS_${invoice.assignedInvoiceNumber || invoice.id}.json`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {t('invoiceDetails.downloadRips')}
                  </Button>
                )}
                {ripsResponse?.ResultState === true && ripsResponse && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadJson(ripsResponse, `RIPS_Response_${invoice.assignedInvoiceNumber || invoice.id}.json`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {t('invoiceDetails.downloadMinistryResponse')}
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  disabled={!canResendInvoice}
                  title={resendHint ?? undefined}
                  onClick={resendInvoice}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {t('invoiceDetails.resendInvoice')}
                </Button>
                {canExportPackage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-1" />
                        {t('invoiceDetails.exportPackage')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {exportFormats.map(format => (
                        <DropdownMenuItem key={format.key} onClick={() => exportPackage(format.key)}>
                          {format.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            {(invoiceResponse?.resolution_days_left !== undefined || invoiceResponse?.certificate_days_left !== undefined) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {invoiceResponse?.resolution_days_left !== undefined && (
                  <span>{t('invoiceDetails.resolutionDaysLeft')}: <strong>{invoiceResponse.resolution_days_left}</strong></span>
                )}
                {invoiceResponse?.certificate_days_left !== undefined && (
                  <span>{t('invoiceDetails.certificateDaysLeft')}: <strong>{invoiceResponse.certificate_days_left}</strong></span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('invoiceDetails.lineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">{t('invoiceDetails.description')}</TableHead>
                <TableHead className="text-center">{t('invoiceDetails.quantity')}</TableHead>
                <TableHead className="text-right">{t('invoiceDetails.unitPrice')}</TableHead>
                <TableHead className="text-right">{t('invoiceDetails.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length > 0 ? lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{line.description}</TableCell>
                  <TableCell className="text-center">{line.invoiced_quantity || 1}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.price_amount || '0', locale)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.price_amount || '0', locale)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('invoiceDetails.noLineItems')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoiceDetails.subtotal')}</span>
                <span>{formatCurrency(totals?.line_extension_amount || invoice.totalAmount, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (0%)</span>
                <span>{formatCurrency(0, locale)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{t('invoiceDetails.grandTotal')}</span>
                <span>{formatCurrency(totals?.payable_amount || invoice.totalAmount, locale)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RIPS Validations */}
      {(ripsResponse?.CodigoUnicoValidacion || validations.length > 0 || ripsResponse !== null) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('invoiceDetails.ripsValidation')}</CardTitle>
                <CardDescription>{t('invoiceDetails.sisproValidation')}</CardDescription>
              </div>
              {ripsResponse?.ResultState === true ? (
                <Badge className={statusBadgeClass('Sent')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('invoiceDetails.validated')}
                </Badge>
              ) : ripsResponse?.ResultState === false ? (
                <Badge className={statusBadgeClass('Failed')}>
                  <XCircle className="h-3 w-3 mr-1" />
                  {t('invoiceDetails.rejected')}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ripsResponse?.CodigoUnicoValidacion && ripsResponse.CodigoUnicoValidacion !== '-' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">CUV (Código Único de Validación)</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs break-all bg-muted px-2 py-1 rounded">
                    {ripsResponse.CodigoUnicoValidacion}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(ripsResponse.CodigoUnicoValidacion || '')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {ripsResponse.ProcesoId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('invoiceDetails.processId')}: {ripsResponse.ProcesoId}
                  </p>
                )}
              </div>
            )}

            {/* Validation Summary */}
            {validations.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  {rejections.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{rejections.length} {t('invoiceDetails.rejections')}</span>
                    </div>
                  )}
                  {errors.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{errors.length} {t('invoiceDetails.errors')}</span>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{warnings.length} {t('invoiceDetails.warnings')}</span>
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Info className="h-4 w-4" />
                      <span>{notifications.length} {t('invoiceDetails.notifications')}</span>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {validations.map((v, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-start gap-2">
                          <Badge className={validationBadgeClass(v.Clase)} variant="outline">
                            {v.Codigo}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{v.Descripcion}</p>
                            {v.Observaciones && (
                              <p className="text-xs text-muted-foreground mt-1">{v.Observaciones}</p>
                            )}
                            {v.PathFuente && (
                              <p className="text-xs font-mono text-muted-foreground mt-1">{v.PathFuente}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('invoiceDetails.submittedBy')}: {invoice.submittedByDisplayName}</span>
        <span>{t('invoiceDetails.createdAt')}: {formatDate(invoice.createdAt, locale)}</span>
      </div>
    </div>
  )
}

// Technical View Component (existing functionality)
function TechnicalView({ invoice, locale, t }: { invoice: InvoiceDetail; locale: string; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Dispatch History Tabs */}
      <Tabs defaultValue="invoice" className="w-full">
        <TabsList className={invoice.hasRips ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('invoiceDetails.invoiceHistory')}
            {invoice.invoiceDispatchHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {invoice.invoiceDispatchHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          {invoice.hasRips && (
            <TabsTrigger value="rips" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t('invoiceDetails.ripsHistory')}
              {invoice.ripsDispatchHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {invoice.ripsDispatchHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="invoice" className="space-y-4 mt-4">
          {invoice.invoiceDispatchHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('invoiceDetails.noInvoiceAttempts')}</h3>
                <p className="text-muted-foreground">{t('invoiceDetails.noInvoiceAttemptsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoice.invoiceDispatchHistory.map((attempt, index) => (
                <DispatchAttemptCard
                  key={`invoice-${index}`}
                  attempt={attempt}
                  index={invoice.invoiceDispatchHistory.length - 1 - index}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {invoice.hasRips && (
          <TabsContent value="rips" className="space-y-4 mt-4">
            {invoice.ripsDispatchHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">{t('invoiceDetails.noRipsAttempts')}</h3>
                  <p className="text-muted-foreground">{t('invoiceDetails.noRipsAttemptsDescription')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invoice.ripsDispatchHistory.map((attempt, index) => (
                  <DispatchAttemptCard
                    key={`rips-${index}`}
                    attempt={attempt}
                    index={invoice.ripsDispatchHistory.length - 1 - index}
                    locale={locale}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

interface DispatchAttemptCardProps {
  attempt: DispatchAttempt
  index: number
  locale: string
  t: (key: string) => string
}

function DispatchAttemptCard({ attempt, index, locale, t }: DispatchAttemptCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [showResponse, setShowResponse] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('invoiceDetails.copiedToClipboard'))
  }

  const responseJson = parseJsonSafe<Record<string, unknown>>(attempt.responsePayload)
  const errorFromResponse: string | null = responseJson && typeof responseJson === 'object' 
    ? String(responseJson.message || responseJson.error || '')
    : null

  return (
    <Card className={attempt.succeeded ? 'border-emerald-500/30' : 'border-red-500/30'}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {attempt.succeeded ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <CardTitle className="text-sm font-medium">
                    {t('invoiceDetails.attempt')} #{index + 1}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatDate(attempt.attemptedAt, locale)} · {attempt.source}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={attempt.succeeded ? statusBadgeClass('Sent') : statusBadgeClass('Failed')}>
                  {attempt.succeeded ? t('invoiceDetails.success') : t('invoiceDetails.failed')}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {(attempt.errorMessage || errorFromResponse) && (
              <Alert variant={attempt.succeeded ? "default" : "destructive"}>
                {attempt.succeeded ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>{attempt.succeeded ? t('invoiceDetails.responseMessage') : t('invoiceDetails.errorMessage')}</AlertTitle>
                <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                  {attempt.errorMessage || errorFromResponse}
                </AlertDescription>
              </Alert>
            )}

            {attempt.responsePayload && responseJson && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setShowResponse(!showResponse)}>
                    {showResponse ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {t('invoiceDetails.responsePayload')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(attempt.responsePayload!)}>
                    <Copy className="h-3 w-3 mr-1" />
                    {t('common.copy')}
                  </Button>
                </div>
                {showResponse && (
                  <ScrollArea className="h-64 rounded-md border bg-muted/30 p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(responseJson, null, 2)}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            )}

            {attempt.requestPayload && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setShowRequest(!showRequest)}>
                    {showRequest ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {t('invoiceDetails.requestPayload')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(attempt.requestPayload!)}>
                    <Copy className="h-3 w-3 mr-1" />
                    {t('common.copy')}
                  </Button>
                </div>
                {showRequest && (
                  <ScrollArea className="h-64 rounded-md border bg-muted/30 p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(parseJsonSafe(attempt.requestPayload), null, 2)}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function InvoiceDetails() {
  const { t, i18n } = useTranslation()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'invoice' | 'technical'>('invoice')
  const [isRetrying, setIsRetrying] = useState(false)

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'

  const fetchInvoice = useCallback(async () => {
    if (!workspaceId || !invoiceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint(
        workspaceId,
        invoiceId
      )
      if (!response.data) {
        throw new Error('Invoice not found')
      }
      setInvoice(mapInvoiceDetail(response.data))
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('invoiceDetails.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, invoiceId, t, workspaceId])

  useEffect(() => {
    void fetchInvoice()
  }, [fetchInvoice])

  const handleRetry = useCallback(async () => {
    if (!workspaceId || !invoiceId || isRetrying) return
    setIsRetrying(true)
    try {
      await axiosInstance.post(
        `/api/workspaces/${workspaceId}/invoice/documents/${invoiceId}/retry`
      )
      toast.success(t('invoiceDetails.retrySuccess'))
      await fetchInvoice()
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(apiError ?? t('invoiceDetails.retryError'))
    } finally {
      setIsRetrying(false)
    }
  }, [workspaceId, invoiceId, isRetrying, fetchInvoice, t])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/accounting/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('invoiceDetails.backToList')}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error ?? t('invoiceDetails.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isCreditNoteLocked = invoice.status === 'Annulled' || invoice.status === 'PartiallyAnnulled'
  const creditNoteLockMessage = invoice.status === 'Annulled'
    ? t('invoiceDetails.annulledLockMessage')
    : t('invoiceDetails.partiallyAnnulledLockMessage')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/accounting/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <StatusIcon status={invoice.status} />
              <h1 className="text-2xl font-semibold tracking-tight">
                {invoice.assignedInvoiceNumber ?? t('invoiceDetails.pendingNumber')}
              </h1>
              <Badge className={statusBadgeClass(invoice.status)}>
                {t(`invoicesPage.status.${invoice.status.toLowerCase()}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {invoice.clientName} · {formatCurrency(invoice.totalAmount, locale)}
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          {/* Retry dispatch — only for Failed invoices that never reached DIAN (no CUFE).
              Once a CUFE exists, the proper recovery is annulation via credit note. */}
          {invoice.status === 'Failed' && !invoice.cufe && (
            <Button
              variant="default"
              size="sm"
              onClick={() => void handleRetry()}
              disabled={isRetrying}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? t('invoiceDetails.retryInProgress') : t('invoiceDetails.retryDispatch')}
            </Button>
          )}
          {(invoice.status === 'Failed' || invoice.status === 'Error') && invoice.hasRips && (
             <Button
               variant="destructive"
               size="sm"
               onClick={() => navigate(`/accounting/invoices/${invoiceId}/edit-rips`)}
             >
               {t('invoiceDetails.editRips')}
             </Button>
          )}
          {/* Annulation (full / partial credit note) is gated on CUFE presence —
              not on draft status — so a Failed-with-CUFE invoice (RIPS error after
              successful DIAN emit) can still be annulated. The lock for already-annulled
              invoices is handled separately via isCreditNoteLocked. */}
          {invoice.cufe && !isCreditNoteLocked && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/accounting/invoices/${invoiceId}/credit-note?type=partial`)}
              >
                <MinusCircle className="h-4 w-4 mr-1" />
                {t('invoiceDetails.partialCreditNote')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/accounting/invoices/${invoiceId}/credit-note?type=complete`)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <MinusCircle className="h-4 w-4 mr-1" />
                {t('invoiceDetails.fullCreditNote')}
              </Button>
            </>
          )}
          <Button
            variant={viewMode === 'invoice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('invoice')}
          >
            <Receipt className="h-4 w-4 mr-1" />
            {t('invoiceDetails.invoiceView')}
          </Button>
          <Button
            variant={viewMode === 'technical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('technical')}
          >
            <Code className="h-4 w-4 mr-1" />
            {t('invoiceDetails.technicalView')}
          </Button>
        </div>
      </div>

      {/* Status Message Alert */}
      {invoice.statusMessage && (
        <Alert variant={invoice.status === 'Failed' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('invoiceDetails.statusMessage')}</AlertTitle>
          <AlertDescription>{invoice.statusMessage}</AlertDescription>
        </Alert>
      )}

      {isCreditNoteLocked && (
        <Alert>
          <MinusCircle className="h-4 w-4" />
          <AlertTitle>{t('invoiceDetails.creditNoteLockedTitle')}</AlertTitle>
          <AlertDescription>{creditNoteLockMessage}</AlertDescription>
        </Alert>
      )}

      {/* View Content */}
      {viewMode === 'invoice' ? (
        <InvoiceView invoice={invoice} locale={locale} t={t} workspaceId={workspaceId} />
      ) : (
        <TechnicalView invoice={invoice} locale={locale} t={t} />
      )}
    </div>
  )
}
