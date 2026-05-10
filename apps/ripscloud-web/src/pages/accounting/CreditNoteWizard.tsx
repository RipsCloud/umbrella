import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  Loader2,
  AlertTriangle,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/useAuth'
import { axiosInstance } from '@/lib/api'
import { toast } from 'sonner'

type CreditNoteResolution = {
  id: string
  tenantId: string
  prefix: string
  resolutionNumber: string
  nextNumber: number
  fromNumber: number
  toNumber: number
  validFrom: string
  validTo: string
  isActive: boolean
  environment: number
}

type CreditNoteService = {
  category: string
  consecutivo: number
  description: string
  amount: number
  serviceDate?: string | null
}

type CreditNotePatient = {
  consecutivo: number
  tipoDocumentoIdentificacion: string
  numDocumentoIdentificacion: string
  patientName?: string | null
  totalAmount: number
  services: CreditNoteService[]
}

type InvoiceForCreditNote = {
  id: string
  invoiceNumber?: string | null
  cufe?: string | null
  issueDate: string
  totalAmount: number
  clientName: string
  clientId: string
  locationId: string
}

type WizardContext = {
  invoice: InvoiceForCreditNote
  patients: CreditNotePatient[]
  availableResolutions: CreditNoteResolution[]
  canCreateCreditNote: boolean
  validationMessage?: string | null
}

type SelectedService = {
  category: string
  consecutivo: number
  selected: boolean
}

type SelectedPatient = {
  consecutivo: number
  allSelected: boolean
  services: SelectedService[]
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

const resolveDiscrepancyDescription = (
  code: number,
  t: (key: string, options?: Record<string, unknown>) => string
) =>
  code === 1
    ? t('creditNoteWizard.discrepancy.partialReason')
    : t('creditNoteWizard.discrepancy.fullReason')

const localizeCreditNoteWorkflowMessage = (
  message: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (!message) {
    return null
  }

  const statusMatch = message.match(/status '([^']+)'/i)
  if (statusMatch) {
    const status = statusMatch[1]
    return t('creditNoteWizard.messages.statusBlocked', {
      status: t(`invoicesPage.status.${status.toLowerCase()}`, { defaultValue: status }),
    })
  }

  switch (message) {
    case 'Invoice does not have a valid CUFE.':
    case 'Cannot create credit note for invoice without a valid CUFE.':
      return t('creditNoteWizard.messages.missingCufe')
    case 'This invoice has already been partially annulled with a credit note and cannot be credited again.':
      return t('creditNoteWizard.messages.alreadyPartiallyAnnulled')
    case 'This invoice has already been annulled with a credit note and cannot be credited again.':
      return t('creditNoteWizard.messages.alreadyAnnulled')
    case 'No active credit note resolution found. Please configure a credit note resolution in Settings first.':
      return t('creditNoteWizard.messages.missingResolution')
    case 'Invoice not found.':
    case 'Original invoice not found for the selected workspace.':
      return t('creditNoteWizard.messages.invoiceNotFound')
    case 'Credit note resolution not found or inactive for the selected workspace.':
      return t('creditNoteWizard.messages.resolutionNotFound')
    case 'Location not found for the selected workspace.':
      return t('creditNoteWizard.messages.locationNotFound')
    case 'Submitting user not found.':
      return t('creditNoteWizard.messages.submittingUserNotFound')
    case 'Discrepancy response code must be 1 (Partial return) or 2 (Full cancellation).':
      return t('creditNoteWizard.messages.invalidDiscrepancyCode')
    case 'Invalid identifiers.':
      return t('creditNoteWizard.messages.invalidIdentifiers')
    default:
      return message
  }
}

export function CreditNoteWizard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [searchParams] = useSearchParams()
  const { currentWorkspace } = useAuth()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<WizardContext | null>(null)

  // Step 1: Reason selection
  const [discrepancyCode, setDiscrepancyCode] = useState<number>(
    searchParams.get('type') === 'complete' ? 2 : 1
  )
  const [discrepancyDescription, setDiscrepancyDescription] = useState(
    resolveDiscrepancyDescription(searchParams.get('type') === 'complete' ? 2 : 1, t)
  )
  const [selectedResolutionId, setSelectedResolutionId] = useState<string>('')

  // Step 2: Patient/service selection
  const [selectedPatients, setSelectedPatients] = useState<SelectedPatient[]>([])
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set())

  const workspaceId = currentWorkspace?.id ?? ''
  const locale = i18n.language ?? 'es'

  // Load wizard context
  const loadContext = useCallback(async () => {
    if (!workspaceId || !invoiceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await axiosInstance.get(
        `/api/workspaces/${workspaceId}/invoices/${invoiceId}/credit-note-context`
      )

      const data = response.data as WizardContext
      setContext(data)

      // Initialize selection state
      if (data.patients) {
        const initial = data.patients.map((patient) => ({
          consecutivo: patient.consecutivo,
          allSelected: discrepancyCode === 2, // Auto-select all for full cancellation
          services: patient.services.map((s) => ({
            category: s.category,
            consecutivo: s.consecutivo,
            selected: discrepancyCode === 2,
          })),
        }))
        setSelectedPatients(initial)
        setExpandedPatients(new Set(data.patients.map((p) => p.consecutivo)))
      }

      // Set default resolution
      if (data.availableResolutions.length > 0) {
        setSelectedResolutionId(data.availableResolutions[0].id)
      }
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(localizeCreditNoteWorkflowMessage(apiError, t) ?? t('creditNoteWizard.errors.loadContext'))
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, invoiceId, discrepancyCode, t])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  useEffect(() => {
    setDiscrepancyDescription(resolveDiscrepancyDescription(discrepancyCode, t))
  }, [discrepancyCode, t])

  // Calculate selected total
  const selectedTotal = useMemo(() => {
    if (!context) return 0

    let total = 0
    for (const patientSelection of selectedPatients) {
      const patient = context.patients.find((p) => p.consecutivo === patientSelection.consecutivo)
      if (!patient) continue

      if (patientSelection.allSelected) {
        total += patient.totalAmount
      } else {
        for (const serviceSelection of patientSelection.services) {
          if (serviceSelection.selected) {
            const service = patient.services.find(
              (s) => s.category === serviceSelection.category && s.consecutivo === serviceSelection.consecutivo
            )
            if (service) {
              total += service.amount
            }
          }
        }
      }
    }
    return total
  }, [context, selectedPatients])

  // Toggle patient selection
  const togglePatient = (patientConsecutivo: number) => {
    setSelectedPatients((prev) =>
      prev.map((p) => {
        if (p.consecutivo === patientConsecutivo) {
          const newAllSelected = !p.allSelected
          return {
            ...p,
            allSelected: newAllSelected,
            services: p.services.map((s) => ({ ...s, selected: newAllSelected })),
          }
        }
        return p
      })
    )
  }

  // Toggle service selection
  const toggleService = (patientConsecutivo: number, category: string, serviceConsecutivo: number) => {
    setSelectedPatients((prev) =>
      prev.map((p) => {
        if (p.consecutivo === patientConsecutivo) {
          const newServices = p.services.map((s) =>
            s.category === category && s.consecutivo === serviceConsecutivo
              ? { ...s, selected: !s.selected }
              : s
          )
          const allSelected = newServices.every((s) => s.selected)
          return { ...p, allSelected, services: newServices }
        }
        return p
      })
    )
  }

  // Toggle patient expansion
  const toggleExpanded = (patientConsecutivo: number) => {
    setExpandedPatients((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(patientConsecutivo)) {
        newSet.delete(patientConsecutivo)
      } else {
        newSet.add(patientConsecutivo)
      }
      return newSet
    })
  }

  // Handle discrepancy code change
  const handleDiscrepancyCodeChange = (code: string) => {
    const numCode = parseInt(code)
    setDiscrepancyCode(numCode)

    // Auto-select all for full cancellation
    if (numCode === 2 && context) {
      setSelectedPatients(
        context.patients.map((patient) => ({
          consecutivo: patient.consecutivo,
          allSelected: true,
          services: patient.services.map((s) => ({
            category: s.category,
            consecutivo: s.consecutivo,
            selected: true,
          })),
        }))
      )
    }
  }

  // Submit credit note
  const handleSubmit = async () => {
    if (!context || !selectedResolutionId) return

    setIsSubmitting(true)

    try {
      const dianDiscrepancyDescription = resolveDiscrepancyDescription(discrepancyCode, t)

      // Build selected items for the request
      const selectedItems = selectedPatients
        .filter((p) => p.allSelected || p.services.some((s) => s.selected))
        .map((p) => ({
          patientConsecutivo: p.consecutivo,
          includeAllServices: p.allSelected,
          selectedServices: p.allSelected
            ? null
            : p.services
                .filter((s) => s.selected)
                .map((s) => ({
                  serviceCategory: s.category,
                  serviceConsecutivo: s.consecutivo,
                  overrideAmount: null,
                })),
        }))

      // Build credit note lines from selected items
      const creditNoteLines: Array<{
        unit_measure_id: number
        invoiced_quantity: string
        line_extension_amount: string
        free_of_charge_indicator: boolean
        description: string
        notes: string
        code: string
        type_item_identification_id: number
        price_amount: string
        base_quantity: string
        tax_totals: Array<{
          tax_id: number
          tax_amount: string
          taxable_amount: string
          percent: string
        }>
      }> = []

      for (const patientSelection of selectedPatients) {
        const patient = context.patients.find((p) => p.consecutivo === patientSelection.consecutivo)
        if (!patient) continue

        const servicesToInclude = patientSelection.allSelected
          ? patient.services
          : patient.services.filter((s) =>
              patientSelection.services.some(
                (sel) => sel.category === s.category && sel.consecutivo === s.consecutivo && sel.selected
              )
            )

        for (const service of servicesToInclude) {
          creditNoteLines.push({
            unit_measure_id: 94,
            invoiced_quantity: '1',
            line_extension_amount: service.amount.toFixed(2),
            free_of_charge_indicator: false,
            description: `Anulacion - ${patient.tipoDocumentoIdentificacion} ${patient.numDocumentoIdentificacion} - ${service.description}`,
            notes: 'Anulacion',
            code: '100',
            type_item_identification_id: 4,
            price_amount: service.amount.toFixed(2),
            base_quantity: '1',
            tax_totals: [
              {
                tax_id: 1,
                tax_amount: '0.00',
                taxable_amount: service.amount.toFixed(2),
                percent: '0.00',
              },
            ],
          })
        }
      }

      const totalAmount = selectedTotal

      const creditNotePayload = {
        billing_reference: {
          number: context.invoice.invoiceNumber ?? '',
          uuid: context.invoice.cufe ?? '',
          issue_date: context.invoice.issueDate.split('T')[0],
        },
        type_document_id: 4,
        number: 0, // Will be assigned by backend
        discrepancyresponsecode: discrepancyCode,
        discrepancyresponsedescription: dianDiscrepancyDescription,
        notes: `Nota credito para factura ${context.invoice.invoiceNumber}`,
        prefix: '', // Will be assigned by backend
        date: '', // Will be assigned by backend
        time: '', // Will be assigned by backend
        resolution_number: '', // Will be assigned by backend
        disable_confirmation_text: true,
        establishment_name: '',
        establishment_address: '',
        establishment_phone: '',
        establishment_municipality: 149,
        establishment_email: '',
        sendmail: true,
        sendmailtome: true,
        send_customer_credentials: false,
        seze: '2019-2030',
        email_cc_list: [],
        customer: {
          identification_number: '',
          dv: null,
          name: context.invoice.clientName,
          phone: '',
          address: '',
          email: '',
          merchant_registration: '0000000-00',
          type_document_identification_id: 6,
          type_organization_id: 1,
          type_liability_id: 7,
          municipality_id: 149,
          type_regime_id: 1,
        },
        payment_form: {
          payment_form_id: 1,
          payment_method_id: 10,
          payment_due_date: new Date().toISOString().split('T')[0],
          duration_measure: '0',
        },
        legal_monetary_totals: {
          line_extension_amount: totalAmount.toFixed(2),
          tax_exclusive_amount: totalAmount.toFixed(2),
          tax_inclusive_amount: totalAmount.toFixed(2),
          payable_amount: totalAmount.toFixed(2),
        },
        tax_totals: [
          {
            tax_id: 1,
            tax_amount: '0.00',
            percent: '0.00',
            taxable_amount: totalAmount.toFixed(2),
          },
        ],
        health_fields: null,
        credit_note_lines: creditNoteLines,
      }

      await axiosInstance.post(`/api/workspaces/${workspaceId}/credit-notes`, {
        invoiceDraftId: invoiceId,
        creditNoteResolutionId: selectedResolutionId,
        locationId: context.invoice.locationId,
        discrepancyResponseCode: discrepancyCode,
        discrepancyResponseDescription: dianDiscrepancyDescription,
        selectedItems,
        notes: dianDiscrepancyDescription,
        creditNotePayload,
        ripsPayload: null, // RIPS will be derived from original invoice on backend
      })

      toast.success(t('creditNoteWizard.success'))
      navigate('/accounting/credit-notes')
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(localizeCreditNoteWorkflowMessage(apiError, t) ?? t('creditNoteWizard.errors.submit'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Render error state
  if (error || !context) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error ?? t('creditNoteWizard.errors.loadContext')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render validation error if cannot create
  if (!context.canCreateCreditNote) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('creditNoteWizard.cannotCreate')}</AlertTitle>
          <AlertDescription>
            {localizeCreditNoteWorkflowMessage(context.validationMessage, t) ?? context.validationMessage}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('creditNoteWizard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('creditNoteWizard.forInvoice', { number: context.invoice.invoiceNumber })}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
          </div>
          <span className="text-sm font-medium">{t('creditNoteWizard.step1.title')}</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
          </div>
          <span className="text-sm font-medium">{t('creditNoteWizard.step2.title')}</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">{t('creditNoteWizard.step3.title')}</span>
        </div>
      </div>

      {/* Step 1: Reason & Resolution */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('creditNoteWizard.step1.title')}</CardTitle>
            <CardDescription>{t('creditNoteWizard.step1.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Summary */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{t('creditNoteWizard.invoiceSummary')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('creditNoteWizard.invoiceNumber')}</p>
                  <p className="font-mono">{context.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteWizard.client')}</p>
                  <p>{context.invoice.clientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteWizard.issueDate')}</p>
                  <p>{formatDate(context.invoice.issueDate, locale)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('creditNoteWizard.totalAmount')}</p>
                  <p className="font-medium">{formatCurrency(context.invoice.totalAmount, locale)}</p>
                </div>
              </div>
            </div>

            {/* Discrepancy Code */}
            <div className="space-y-2">
              <Label>{t('creditNoteWizard.discrepancyCode')}</Label>
              <Select value={discrepancyCode.toString()} onValueChange={handleDiscrepancyCodeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('creditNoteWizard.discrepancy.partial')}</SelectItem>
                  <SelectItem value="2">{t('creditNoteWizard.discrepancy.full')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {discrepancyCode === 1
                  ? t('creditNoteWizard.discrepancy.partialDesc')
                  : t('creditNoteWizard.discrepancy.fullDesc')}
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>{t('creditNoteWizard.reason')}</Label>
              <Textarea
                value={discrepancyDescription}
                readOnly
                rows={3}
              />
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <Label>{t('creditNoteWizard.resolution')}</Label>
              <Select value={selectedResolutionId} onValueChange={setSelectedResolutionId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('creditNoteWizard.selectResolution')} />
                </SelectTrigger>
                <SelectContent>
                  {context.availableResolutions.map((res) => (
                    <SelectItem key={res.id} value={res.id}>
                      {res.prefix} - {res.resolutionNumber} ({res.nextNumber}-{res.toNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedResolutionId}
              >
                {t('common.next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Item Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('creditNoteWizard.step2.title')}</CardTitle>
            <CardDescription>
              {discrepancyCode === 2
                ? t('creditNoteWizard.step2.fullDesc')
                : t('creditNoteWizard.step2.partialDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Total */}
            <div className="p-4 rounded-lg border bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('creditNoteWizard.selectedTotal')}
                </span>
                <span className="text-xl font-bold">{formatCurrency(selectedTotal, locale)}</span>
              </div>
            </div>

            {/* Patient/Service Tree */}
            <div className="space-y-2">
              {context.patients.map((patient) => {
                const patientSelection = selectedPatients.find((p) => p.consecutivo === patient.consecutivo)
                const isExpanded = expandedPatients.has(patient.consecutivo)
                const selectedServiceCount = patientSelection?.services.filter((s) => s.selected).length ?? 0

                return (
                  <Collapsible key={patient.consecutivo} open={isExpanded}>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={patientSelection?.allSelected ?? false}
                          onCheckedChange={() => togglePatient(patient.consecutivo)}
                          disabled={discrepancyCode === 2}
                        />
                        <CollapsibleTrigger
                          onClick={() => toggleExpanded(patient.consecutivo)}
                          className="flex items-center gap-2 flex-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {patient.patientName ?? `${patient.tipoDocumentoIdentificacion} ${patient.numDocumentoIdentificacion}`}
                          </span>
                        </CollapsibleTrigger>
                        <Badge variant="outline">
                          {selectedServiceCount}/{patient.services.length}
                        </Badge>
                        <span className="font-medium">{formatCurrency(patient.totalAmount, locale)}</span>
                      </div>

                      <CollapsibleContent>
                        <Separator className="my-3" />
                        <div className="space-y-2 pl-8">
                          {patient.services.map((service) => {
                            const serviceSelection = patientSelection?.services.find(
                              (s) => s.category === service.category && s.consecutivo === service.consecutivo
                            )
                            return (
                              <div
                                key={`${service.category}-${service.consecutivo}`}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={serviceSelection?.selected ?? false}
                                  onCheckedChange={() =>
                                    toggleService(patient.consecutivo, service.category, service.consecutivo)
                                  }
                                  disabled={discrepancyCode === 2}
                                />
                                <div className="flex-1">
                                  <p className="text-sm">{service.description || service.category}</p>
                                  {service.serviceDate && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(service.serviceDate, locale)}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {service.category}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatCurrency(service.amount, locale)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={selectedTotal === 0}>
                {t('common.next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('creditNoteWizard.step3.title')}</CardTitle>
            <CardDescription>{t('creditNoteWizard.step3.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{t('creditNoteWizard.originalInvoice')}</p>
                  <p className="font-mono text-lg">{context.invoice.invoiceNumber}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{t('creditNoteWizard.creditNoteAmount')}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(selectedTotal, locale)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">{t('creditNoteWizard.type')}</p>
                <Badge className={discrepancyCode === 1 ? 'bg-amber-500/15 text-amber-600' : 'bg-red-500/15 text-red-600'}>
                  {discrepancyCode === 1 ? t('creditNoteWizard.discrepancy.partial') : t('creditNoteWizard.discrepancy.full')}
                </Badge>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">{t('creditNoteWizard.reason')}</p>
                <p>{discrepancyDescription}</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">{t('creditNoteWizard.itemsIncluded')}</p>
                <ul className="text-sm space-y-1">
                  {selectedPatients
                    .filter((p) => p.allSelected || p.services.some((s) => s.selected))
                    .map((p) => {
                      const patient = context.patients.find((pt) => pt.consecutivo === p.consecutivo)
                      if (!patient) return null
                      const count = p.allSelected ? patient.services.length : p.services.filter((s) => s.selected).length
                      return (
                        <li key={p.consecutivo}>
                          {patient.tipoDocumentoIdentificacion} {patient.numDocumentoIdentificacion}: {count} {t('creditNoteWizard.services')}
                        </li>
                      )
                    })}
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('creditNoteWizard.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
