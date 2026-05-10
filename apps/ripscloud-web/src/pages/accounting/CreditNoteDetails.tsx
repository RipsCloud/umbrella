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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/useAuth'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/api'

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

type CreditNoteDetail = {
  id: string
  tenantId: string
  invoiceDraftId: string
  originalInvoiceNumber?: string | null
  clientId: string
  clientName: string
  totalAmount: number
  status: string
  statusMessage?: string | null
  submittedByUserId: string
  submittedByDisplayName: string
  createdAt: string
  updatedAt: string
  assignedCreditNoteNumber?: string | null
  cude?: string | null
  discrepancyResponseCode: number
  discrepancyResponseDescription: string
  dianStatusCode?: string | null
  dianStatusDescription?: string | null
  creditNoteDispatchHistory: DispatchAttempt[]
  ripsDispatchHistory: DispatchAttempt[]
  documentAvailability: DocumentAvailability[]
}

type CreditNoteResponse = {
  success?: boolean
  message?: string
  cude?: string
  QRStr?: string
  urlcreditnotepdf?: string
  urlcreditnotexml?: string
  urlcreditnoteattached?: string
  // Backward compatibility in technical payload viewers
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

type CreditNoteRequest = {
  date?: string
  time?: string
  number?: string
  prefix?: string
  resolution_number?: string
  billing_reference?: {
    number?: string
    uuid?: string
    issue_date?: string
  }
  customer?: {
    name?: string
    identification_number?: string
    dv?: string | null
    email?: string
    phone?: string
    address?: string
  }
  credit_note_lines?: Array<{
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

type DispatchAttemptApi = {
  attemptedAt?: string
  succeeded?: boolean
  errorMessage?: string | null
  requestPayload?: string | null
  responsePayload?: string | null
  source?: string
}

type CreditNoteDetailApi = {
  id?: string
  tenantId?: string
  invoiceDraftId?: string
  originalInvoiceNumber?: string | null
  clientId?: string
  clientName?: string
  totalAmount?: number
  status?: string
  statusMessage?: string | null
  submittedByUserId?: string
  submittedByDisplayName?: string
  createdAt?: string
  updatedAt?: string
  assignedCreditNoteNumber?: string | null
  cude?: string | null
  discrepancyResponseCode?: number
  discrepancyResponseDescription?: string
  dianStatusCode?: string | null
  dianStatusDescription?: string | null
  dispatchHistory?: DispatchAttemptApi[]
  creditNoteDispatchHistory?: DispatchAttemptApi[]
  ripsDispatchHistory?: DispatchAttemptApi[]
  documentAvailability?: Array<{
    documentType?: string
    isSupported?: boolean
    canDownload?: boolean
  }>
}

const defaultDocumentAvailability: DocumentAvailability[] = [
  { documentType: 'pdf', isSupported: false, canDownload: false },
  { documentType: 'xml', isSupported: false, canDownload: false },
  { documentType: 'attached', isSupported: false, canDownload: false },
]

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
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

const mapDispatchAttempt = (dto: DispatchAttemptApi): DispatchAttempt => ({
  attemptedAt: dto.attemptedAt ?? new Date().toISOString(),
  succeeded: dto.succeeded ?? false,
  errorMessage: dto.errorMessage,
  requestPayload: dto.requestPayload,
  responsePayload: dto.responsePayload,
  source: dto.source ?? 'Unknown',
})

const mapDocumentAvailability = (dto: CreditNoteDetailApi): DocumentAvailability[] => {
  if (!dto.documentAvailability || dto.documentAvailability.length === 0) {
    return defaultDocumentAvailability
  }

  const byType = new Map<DocumentType, DocumentAvailability>()
  for (const item of dto.documentAvailability) {
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

const mapCreditNoteDetail = (dto: CreditNoteDetailApi): CreditNoteDetail => ({
  id: dto.id ?? '',
  tenantId: dto.tenantId ?? '',
  invoiceDraftId: dto.invoiceDraftId ?? '',
  originalInvoiceNumber: dto.originalInvoiceNumber,
  clientId: dto.clientId ?? '',
  clientName: dto.clientName ?? '',
  totalAmount: dto.totalAmount ?? 0,
  status: dto.status ?? 'Queued',
  statusMessage: dto.statusMessage,
  submittedByUserId: dto.submittedByUserId ?? '',
  submittedByDisplayName: dto.submittedByDisplayName ?? '',
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
  assignedCreditNoteNumber: dto.assignedCreditNoteNumber,
  cude: dto.cude,
  discrepancyResponseCode: dto.discrepancyResponseCode ?? 1,
  discrepancyResponseDescription: dto.discrepancyResponseDescription ?? '',
  dianStatusCode: dto.dianStatusCode,
  dianStatusDescription: dto.dianStatusDescription,
  creditNoteDispatchHistory: (dto.dispatchHistory ?? dto.creditNoteDispatchHistory)?.map(mapDispatchAttempt) ?? [],
  ripsDispatchHistory: dto.ripsDispatchHistory?.map(mapDispatchAttempt) ?? [],
  documentAvailability: mapDocumentAvailability(dto),
})

const parseJsonSafe = <T,>(str: string | null | undefined): T | null => {
  if (!str) return null
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

// Credit Note View Component
function CreditNoteView({ creditNote, locale, t, workspaceId }: { creditNote: CreditNoteDetail; locale: string; t: (key: string) => string; workspaceId: string }) {
  const lastCreditNoteAttempt = creditNote.creditNoteDispatchHistory[0]
  const lastRipsAttempt = creditNote.ripsDispatchHistory[0]
  
  const creditNoteRequest = useMemo(() => 
    parseJsonSafe<CreditNoteRequest>(lastCreditNoteAttempt?.requestPayload), 
    [lastCreditNoteAttempt?.requestPayload]
  )
  const creditNoteResponse = useMemo(() => 
    parseJsonSafe<CreditNoteResponse>(lastCreditNoteAttempt?.responsePayload), 
    [lastCreditNoteAttempt?.responsePayload]
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
    toast.success(t('creditNoteDetails.copiedToClipboard'))
  }

  // Download document with authentication using axios instance
  const downloadDocument = async (documentType: 'pdf' | 'xml' | 'attached') => {
    try {
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/credit-notes/${creditNote.id}/download/${documentType}`,
        { responseType: 'blob' }
      )
      
      const contentType = response.headers?.['content-type']
      const blobType = typeof contentType === 'string' ? contentType : undefined
      const blob = new Blob([response.data], blobType ? { type: blobType } : undefined)
      const rawContentDisposition = response.headers?.['content-disposition']
      const contentDisposition = typeof rawContentDisposition === 'string' ? rawContentDisposition : undefined
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const fallbackFileName = documentType === 'pdf' ? 'credit-note.pdf' : 'credit-note.xml'
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
      toast.error(t('creditNoteDetails.downloadError'))
    }
  }

  // Resend credit note via email
  const resendCreditNote = async () => {
    try {
      await axiosInstance.post(
        `/api/workspaces/${workspaceId}/credit-notes/${creditNote.id}/resend`
      )
      toast.success(t('creditNoteDetails.resendSuccess'))
    } catch (error) {
      console.error('Resend error:', error)
      toast.error(t('creditNoteDetails.resendError'))
    }
  }

  const customer = creditNoteRequest?.customer
  const lines = creditNoteRequest?.credit_note_lines ?? []
  const totals = creditNoteRequest?.legal_monetary_totals
  const billingRef = creditNoteRequest?.billing_reference
  const validations = ripsResponse?.ResultadosValidacion ?? []
  
  const rejections = validations.filter(v => v.Clase?.toUpperCase() === 'RECHAZADO')
  const errors = validations.filter(v => v.Clase?.toUpperCase() === 'ERROR')
  const warnings = validations.filter(v => v.Clase?.toUpperCase() === 'ADVERTENCIA' || v.Clase?.toUpperCase() === 'WARNING')
  const notifications = validations.filter(v => v.Clase?.toUpperCase() === 'NOTIFICACION' || v.Clase?.toUpperCase() === 'INFO')

  const documentByType = new Map<DocumentType, DocumentAvailability>(
    creditNote.documentAvailability.map((item) => [item.documentType, item])
  )
  const pdfDocument = documentByType.get('pdf') ?? defaultDocumentAvailability[0]
  const xmlDocument = documentByType.get('xml') ?? defaultDocumentAvailability[1]
  const attachedDocument = documentByType.get('attached') ?? defaultDocumentAvailability[2]

  const getDocumentHint = (document: DocumentAvailability) => {
    if (!document.isSupported) {
      return t('creditNoteDetails.documentNotSupported')
    }

    if (!document.canDownload) {
      return t('creditNoteDetails.documentNotAvailable')
    }

    return null
  }

  const canResendCreditNote = xmlDocument.canDownload || attachedDocument.canDownload
  const resendHint = canResendCreditNote ? null : t('creditNoteDetails.resendNotSupported')

  return (
    <div className="space-y-6">
      {/* Credit Note Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            {/* Left: Credit Note Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t('creditNoteDetails.electronicCreditNote')}
                </h2>
                <p className="text-muted-foreground">{t('creditNoteDetails.healthSector')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('creditNoteDetails.creditNoteNumber')}</p>
                  <p className="font-semibold font-mono text-lg">{creditNote.assignedCreditNoteNumber || (creditNoteRequest?.prefix && creditNoteRequest?.number ? `${creditNoteRequest.prefix}${creditNoteRequest.number}` : '-')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteDetails.issueDate')}</p>
                  <p className="font-medium">{creditNoteRequest?.date || formatDate(creditNote.createdAt, locale).split(',')[0]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteDetails.resolution')}</p>
                  <p className="font-medium text-xs">{creditNoteRequest?.resolution_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteDetails.status')}</p>
                  <Badge className={statusBadgeClass(creditNote.status)}>
                    {t(`creditNotesPage.status.${creditNote.status.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Client Info */}
            <div className="md:text-right space-y-2">
              <p className="text-muted-foreground text-sm">{t('creditNoteDetails.billedTo')}</p>
              <p className="font-semibold text-lg">{customer?.name || creditNote.clientName}</p>
              <p className="text-sm">NIT: {customer?.identification_number}{customer?.dv ? `-${customer.dv}` : ''}</p>
              {customer?.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
              {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
              {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Reference (Original Invoice) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('creditNoteDetails.originalInvoice')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('creditNoteDetails.invoiceNumber')}</p>
              <p className="font-mono">{billingRef?.number || creditNote.originalInvoiceNumber || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('creditNoteDetails.invoiceDate')}</p>
              <p>{billingRef?.issue_date || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('creditNoteDetails.type')}</p>
              <Badge className={discrepancyBadgeClass(creditNote.discrepancyResponseCode)}>
                {creditNote.discrepancyResponseCode === 1
                  ? t('creditNotesPage.type.partial')
                  : t('creditNotesPage.type.full')}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t('creditNoteDetails.reason')}</p>
              <p className="text-sm">{creditNote.discrepancyResponseDescription || '-'}</p>
            </div>
          </div>
          {billingRef?.uuid && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">CUFE {t('creditNoteDetails.originalInvoice')}</p>
              <p className="font-mono text-xs break-all">{billingRef.uuid}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CUDE & QR Info */}
      {(creditNote.cude || creditNoteResponse?.cude) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('creditNoteDetails.dianValidation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">CUDE</p>
                <p className="font-mono text-xs break-all">{creditNote.cude || creditNoteResponse?.cude}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(creditNote.cude || creditNoteResponse?.cude || '')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
                {t('creditNoteDetails.attachedDocument')}
              </Button>
                {ripsResponse?.ResultState === true && ripsRequest?.Rips && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadJson(ripsRequest.Rips, `RIPS_NC_${creditNote.assignedCreditNoteNumber || creditNote.id}.json`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {t('creditNoteDetails.downloadRips')}
                  </Button>
                )}
                {ripsResponse?.ResultState === true && ripsResponse && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadJson(ripsResponse, `RIPS_Response_NC_${creditNote.assignedCreditNoteNumber || creditNote.id}.json`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {t('creditNoteDetails.downloadMinistryResponse')}
                  </Button>
                )}
                <Button 
                  variant="default" 
                  size="sm" 
                  disabled={!canResendCreditNote}
                  title={resendHint ?? undefined}
                  onClick={resendCreditNote}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {t('creditNoteDetails.resendCreditNote')}
                </Button>
              </div>
            {(creditNoteResponse?.resolution_days_left !== undefined || creditNoteResponse?.certificate_days_left !== undefined) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {creditNoteResponse?.resolution_days_left !== undefined && (
                  <span>{t('creditNoteDetails.resolutionDaysLeft')}: <strong>{creditNoteResponse.resolution_days_left}</strong></span>
                )}
                {creditNoteResponse?.certificate_days_left !== undefined && (
                  <span>{t('creditNoteDetails.certificateDaysLeft')}: <strong>{creditNoteResponse.certificate_days_left}</strong></span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Note Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('creditNoteDetails.lineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">{t('creditNoteDetails.description')}</TableHead>
                <TableHead className="text-center">{t('creditNoteDetails.quantity')}</TableHead>
                <TableHead className="text-right">{t('creditNoteDetails.unitPrice')}</TableHead>
                <TableHead className="text-right">{t('creditNoteDetails.total')}</TableHead>
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
                    {t('creditNoteDetails.noLineItems')}
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
                <span className="text-muted-foreground">{t('creditNoteDetails.subtotal')}</span>
                <span>{formatCurrency(totals?.line_extension_amount || creditNote.totalAmount, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (0%)</span>
                <span>{formatCurrency(0, locale)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{t('creditNoteDetails.grandTotal')}</span>
                <span className="text-red-600">-{formatCurrency(totals?.payable_amount || creditNote.totalAmount, locale)}</span>
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
                <CardTitle className="text-base">{t('creditNoteDetails.ripsValidation')}</CardTitle>
                <CardDescription>{t('creditNoteDetails.sisproValidation')}</CardDescription>
              </div>
              {ripsResponse?.ResultState === true ? (
                <Badge className={statusBadgeClass('Sent')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('creditNoteDetails.validated')}
                </Badge>
              ) : ripsResponse?.ResultState === false ? (
                <Badge className={statusBadgeClass('Failed')}>
                  <XCircle className="h-3 w-3 mr-1" />
                  {t('creditNoteDetails.rejected')}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ripsResponse?.CodigoUnicoValidacion && ripsResponse.CodigoUnicoValidacion !== '-' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">CUV (Codigo Unico de Validacion)</p>
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
                    {t('creditNoteDetails.processId')}: {ripsResponse.ProcesoId}
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
                      <span>{rejections.length} {t('creditNoteDetails.rejections')}</span>
                    </div>
                  )}
                  {errors.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{errors.length} {t('creditNoteDetails.errors')}</span>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{warnings.length} {t('creditNoteDetails.warnings')}</span>
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Info className="h-4 w-4" />
                      <span>{notifications.length} {t('creditNoteDetails.notifications')}</span>
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
        <span>{t('creditNoteDetails.submittedBy')}: {creditNote.submittedByDisplayName}</span>
        <span>{t('creditNoteDetails.createdAt')}: {formatDate(creditNote.createdAt, locale)}</span>
      </div>
    </div>
  )
}

// Technical View Component
function TechnicalView({ creditNote, locale, t }: { creditNote: CreditNoteDetail; locale: string; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Dispatch History Tabs */}
      <Tabs defaultValue="creditNote" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="creditNote" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('creditNoteDetails.creditNoteHistory')}
            {creditNote.creditNoteDispatchHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {creditNote.creditNoteDispatchHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rips" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t('creditNoteDetails.ripsHistory')}
            {creditNote.ripsDispatchHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {creditNote.ripsDispatchHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creditNote" className="space-y-4 mt-4">
          {creditNote.creditNoteDispatchHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('creditNoteDetails.noCreditNoteAttempts')}</h3>
                <p className="text-muted-foreground">{t('creditNoteDetails.noCreditNoteAttemptsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {creditNote.creditNoteDispatchHistory.map((attempt, index) => (
                <DispatchAttemptCard
                  key={`creditNote-${index}`}
                  attempt={attempt}
                  index={creditNote.creditNoteDispatchHistory.length - 1 - index}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rips" className="space-y-4 mt-4">
          {creditNote.ripsDispatchHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('creditNoteDetails.noRipsAttempts')}</h3>
                <p className="text-muted-foreground">{t('creditNoteDetails.noRipsAttemptsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {creditNote.ripsDispatchHistory.map((attempt, index) => (
                <DispatchAttemptCard
                  key={`rips-${index}`}
                  attempt={attempt}
                  index={creditNote.ripsDispatchHistory.length - 1 - index}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>
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
    toast.success(t('creditNoteDetails.copiedToClipboard'))
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
                    {t('creditNoteDetails.attempt')} #{index + 1}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatDate(attempt.attemptedAt, locale)} - {attempt.source}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={attempt.succeeded ? statusBadgeClass('Sent') : statusBadgeClass('Failed')}>
                  {attempt.succeeded ? t('creditNoteDetails.success') : t('creditNoteDetails.failed')}
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
                <AlertTitle>{attempt.succeeded ? t('creditNoteDetails.responseMessage') : t('creditNoteDetails.errorMessage')}</AlertTitle>
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
                    {t('creditNoteDetails.responsePayload')}
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
                    {t('creditNoteDetails.requestPayload')}
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

export function CreditNoteDetails() {
  const { t, i18n } = useTranslation()
  const { creditNoteId } = useParams<{ creditNoteId: string }>()
  const navigate = useNavigate()
  const { currentWorkspace } = useAuth()

  const [creditNote, setCreditNote] = useState<CreditNoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'creditNote' | 'technical'>('creditNote')

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'

  const fetchCreditNote = useCallback(async () => {
    if (!workspaceId || !creditNoteId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/credit-notes/${creditNoteId}`
      )
      if (!response.data) {
        throw new Error('Credit note not found')
      }
      setCreditNote(mapCreditNoteDetail(response.data as CreditNoteDetailApi))
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('creditNoteDetails.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [creditNoteId, t, workspaceId])

  useEffect(() => {
    void fetchCreditNote()
  }, [fetchCreditNote])

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

  if (error || !creditNote) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/accounting/credit-notes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('creditNoteDetails.backToList')}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error ?? t('creditNoteDetails.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/accounting/credit-notes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <StatusIcon status={creditNote.status} />
              <h1 className="text-2xl font-semibold tracking-tight">
                {creditNote.assignedCreditNoteNumber ?? t('creditNoteDetails.pendingNumber')}
              </h1>
              <Badge className={statusBadgeClass(creditNote.status)}>
                {t(`creditNotesPage.status.${creditNote.status.toLowerCase()}`)}
              </Badge>
              <Badge className={discrepancyBadgeClass(creditNote.discrepancyResponseCode)}>
                {creditNote.discrepancyResponseCode === 1
                  ? t('creditNotesPage.type.partial')
                  : t('creditNotesPage.type.full')}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {creditNote.clientName} - {formatCurrency(creditNote.totalAmount, locale)}
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'creditNote' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('creditNote')}
          >
            <Receipt className="h-4 w-4 mr-1" />
            {t('creditNoteDetails.creditNoteView')}
          </Button>
          <Button
            variant={viewMode === 'technical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('technical')}
          >
            <Code className="h-4 w-4 mr-1" />
            {t('creditNoteDetails.technicalView')}
          </Button>
        </div>
      </div>

      {/* Status Message Alert */}
      {creditNote.statusMessage && (
        <Alert variant={creditNote.status === 'Failed' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('creditNoteDetails.statusMessage')}</AlertTitle>
          <AlertDescription>{creditNote.statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* View Content */}
      {viewMode === 'creditNote' ? (
        <CreditNoteView creditNote={creditNote} locale={locale} t={t} workspaceId={workspaceId} />
      ) : (
        <TechnicalView creditNote={creditNote} locale={locale} t={t} />
      )}
    </div>
  )
}
