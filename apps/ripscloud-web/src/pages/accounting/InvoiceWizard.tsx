import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { useReferenceTableRecords } from '@/context/useReferenceData'
import { ClientSelector } from '@/components/ClientSelector'
import type {
  RipsAdminApplicationDTOsClientDto,
  RipsAdminApplicationDTOsInvoiceWizardClientDto,
  RipsAdminApplicationDTOsInvoiceWizardLocationDto,
  RipsAdminApplicationDTOsInvoiceWizardResolutionDto,
  RipsAdminApplicationDTOsInvoiceWizardTenantDto,
  RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto,
  RipsAdminApplicationServicesModelsInvoiceProviderRequest,
  RipsAdminApplicationServicesModelsInvoiceProviderCustomer,
  RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals,
  RipsAdminApplicationServicesModelsInvoiceLineItem,
  RipsAdminApplicationServicesModelsInvoiceTaxTotal,
  RipsAdminApplicationServicesModelsInvoicePaymentForm,
} from '@/api'
import { RipsAdminDomainEntitiesInvoiceKind } from '@/api'

type LineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxPercent: number
}

const TAX_OPTIONS = [0, 5, 19]

const createEmptyLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxPercent: 0,
})

const getTypeRegimeId = (taxRegime: string | undefined): number => {
  if (taxRegime === '48') return 1
  return 2
}

const formatCurrency = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP' }).format(value)

type Step = 'configure' | 'review'

export function InvoiceWizard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()

  const locale = i18n.language ?? 'es'
  const workspaceId = currentWorkspace?.id ?? ''

  // Wizard context
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenant, setTenant] = useState<RipsAdminApplicationDTOsInvoiceWizardTenantDto | null>(null)
  const [clients, setClients] = useState<RipsAdminApplicationDTOsInvoiceWizardClientDto[]>([])
  const [locations, setLocations] = useState<RipsAdminApplicationDTOsInvoiceWizardLocationDto[]>([])
  const [resolutions, setResolutions] = useState<RipsAdminApplicationDTOsInvoiceWizardResolutionDto[]>([])

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [selectedResolutionId, setSelectedResolutionId] = useState('')
  const [paymentFormId, setPaymentFormId] = useState(1) // 1=Contado, 2=Credito
  const [paymentMethodId, setPaymentMethodId] = useState(10) // 10=Efectivo, 42=Transferencia
  const [dueDays, setDueDays] = useState(0)
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()])

  // Submission
  const [currentStep, setCurrentStep] = useState<Step>('configure')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  // Reference data for municipality lookup
  const { records: invoiceMunicipalityRecords } = useReferenceTableRecords('invoiceMunicipalities')

  const getMunicipalityId = useCallback((municipalityCode: string | undefined): number | undefined => {
    if (!municipalityCode || !invoiceMunicipalityRecords) return undefined
    const record = invoiceMunicipalityRecords.find(r => r.code === municipalityCode)
    return record?.id ?? undefined
  }, [invoiceMunicipalityRecords])

  // Derived data
  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  )
  const selectedLocation = useMemo(
    () => locations.find(l => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  )
  const selectedResolution = useMemo(
    () => resolutions.find(r => r.id === selectedResolutionId) ?? null,
    [resolutions, selectedResolutionId]
  )

  const { subtotal, taxTotal, grandTotal } = useMemo(() => {
    let sub = 0
    let tax = 0
    for (const item of lineItems) {
      const lineSubtotal = item.quantity * item.unitPrice
      sub += lineSubtotal
      tax += lineSubtotal * (item.taxPercent / 100)
    }
    return { subtotal: sub, taxTotal: tax, grandTotal: sub + tax }
  }, [lineItems])

  // Load wizard context
  const loadContext = useCallback(async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.ripsAdminPresentationEndpointsInvoiceGetInvoiceWizardContextEndpoint(workspaceId)
      const data = response.data
      if (data) {
        setTenant(data.tenant ?? null)
        setClients(data.clients ?? [])
        setLocations(data.locations ?? [])
        setResolutions(data.resolutions ?? [])
        if (data.locations && data.locations.length > 0) setSelectedLocationId(data.locations[0].id ?? '')
        if (data.resolutions && data.resolutions.length > 0) setSelectedResolutionId(data.resolutions[0].id ?? '')
      }
    } catch {
      setError(t('invoiceWizard.errors.loadContext'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, apiClient, t])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  // Line item handlers
  const addLineItem = () => setLineItems(prev => [...prev, createEmptyLineItem()])

  const removeLineItem = (id: string) => {
    setLineItems(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(item => item.id !== id)
    })
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Validation (reactive — drives the disabled state of the Next button)
  const step1Error = useMemo((): string | null => {
    if (!selectedClientId) return t('invoiceWizard.errors.noClient')
    if (!selectedClient?.email?.trim()) return t('invoiceWizard.errors.noClientEmail')
    if (!selectedLocationId) return t('invoiceWizard.errors.noLocation')
    if (!selectedResolutionId) return t('invoiceWizard.errors.noResolution')
    if (lineItems.length === 0) return t('invoiceWizard.errors.noLineItems')
    const invalidLine = lineItems.some(li => !li.description.trim() || li.unitPrice <= 0 || li.quantity <= 0)
    if (invalidLine) return t('invoiceWizard.errors.invalidLineItem')
    return null
  }, [selectedClientId, selectedClient, selectedLocationId, selectedResolutionId, lineItems, t])

  const handleNext = () => {
    if (step1Error) {
      setSubmitError(step1Error)
      return
    }
    setSubmitError(null)
    setCurrentStep('review')
  }

  // Submit
  const handleSubmit = async () => {
    if (!workspaceId || !selectedClient || !selectedResolution || !tenant) return
    if (step1Error) {
      setSubmitError(step1Error)
      setCurrentStep('configure')
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0]

      const customer: RipsAdminApplicationServicesModelsInvoiceProviderCustomer = {
        name: selectedClient.displayName ?? '',
        identification_number: selectedClient.nit ?? '',
        dv: selectedClient.verificationDigit || undefined,
        type_document_identification_id: selectedClient.typeDocumentIdentificationId,
        email: selectedClient.email ?? '',
        address: selectedClient.address ?? '',
        phone: selectedClient.phoneNumber ?? '',
        type_organization_id: selectedClient.typeOrganizationId,
        type_regime_id: getTypeRegimeId(selectedClient.taxRegime),
        municipality_id: getMunicipalityId(selectedClient.municipalityCode),
      }

      const invoiceLines: RipsAdminApplicationServicesModelsInvoiceLineItem[] = lineItems.map(li => {
        const lineAmount = li.quantity * li.unitPrice
        const lineTax = lineAmount * (li.taxPercent / 100)
        return {
          unit_measure_id: 70,
          invoiced_quantity: li.quantity.toString(),
          line_extension_amount: lineAmount.toFixed(2),
          free_of_charge_indicator: false,
          description: li.description.trim(),
          code: '100',
          type_item_identification_id: 4,
          price_amount: li.unitPrice.toFixed(2),
          base_quantity: li.quantity.toString(),
          tax_totals: [{
            tax_id: li.taxPercent > 0 ? 1 : 1,
            tax_amount: lineTax.toFixed(2),
            percent: li.taxPercent.toFixed(2),
            taxable_amount: lineAmount.toFixed(2),
          }],
        }
      })

      // Aggregate tax totals by percent
      const taxMap = new Map<number, { taxAmount: number; taxableAmount: number }>()
      for (const li of lineItems) {
        const lineAmount = li.quantity * li.unitPrice
        const lineTax = lineAmount * (li.taxPercent / 100)
        const existing = taxMap.get(li.taxPercent) ?? { taxAmount: 0, taxableAmount: 0 }
        taxMap.set(li.taxPercent, {
          taxAmount: existing.taxAmount + lineTax,
          taxableAmount: existing.taxableAmount + lineAmount,
        })
      }
      const taxTotals: RipsAdminApplicationServicesModelsInvoiceTaxTotal[] = Array.from(taxMap.entries()).map(
        ([percent, { taxAmount, taxableAmount }]) => ({
          tax_id: 1,
          tax_amount: taxAmount.toFixed(2),
          percent: percent.toFixed(2),
          taxable_amount: taxableAmount.toFixed(2),
        })
      )

      const legalMonetaryTotals: RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals = {
        line_extension_amount: subtotal.toFixed(2),
        tax_exclusive_amount: subtotal.toFixed(2),
        tax_inclusive_amount: grandTotal.toFixed(2),
        payable_amount: grandTotal.toFixed(2),
      }

      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + dueDays)
      const dueDateStr = dueDate.toISOString().split('T')[0]

      const paymentForm: RipsAdminApplicationServicesModelsInvoicePaymentForm = {
        payment_form_id: paymentFormId,
        payment_method_id: paymentMethodId,
        payment_due_date: paymentFormId === 2 ? dueDateStr : dateStr,
        duration_measure: paymentFormId === 2 ? dueDays.toString() : '0',
      }

      const invoicePayload: RipsAdminApplicationServicesModelsInvoiceProviderRequest = {
        prefix: selectedResolution.prefix ?? '',
        number: '',
        type_document_id: 1,
        date: dateStr,
        time: timeStr,
        resolution_number: selectedResolution.resolutionNumber ?? '',
        customer,
        legal_monetary_totals: legalMonetaryTotals,
        invoice_lines: invoiceLines,
        tax_totals: taxTotals,
        payment_form: paymentForm,
        health_fields: null,
      }

      const createRequest: RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto = {
        clientId: selectedClientId,
        locationId: selectedLocationId,
        invoiceResolutionId: selectedResolutionId,
        totalAmount: grandTotal,
        metadata: { documentPrefix: selectedResolution.prefix },
        kind: RipsAdminDomainEntitiesInvoiceKind.Commercial,
        ripsPayload: undefined,
        invoicePayload,
      }

      const response = await apiClient.ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint(workspaceId, createRequest)
      setDraftId(response.data?.id ?? null)
      setSuccess(true)
    } catch {
      setSubmitError(t('invoiceWizard.errors.submit'))
    } finally {
      setSubmitting(false)
    }
  }

  // Client created handler for ClientSelector
  const handleClientCreated = (client: RipsAdminApplicationDTOsClientDto) => {
    if (!client.id) return
    const newClient: RipsAdminApplicationDTOsInvoiceWizardClientDto = {
      id: client.id,
      displayName: client.companyName,
      nit: client.nit,
      verificationDigit: client.verificationDigit,
      email: client.email,
      address: client.address,
      phoneNumber: client.phoneNumber,
      taxRegime: client.taxRegime,
      municipalityCode: client.municipalityCode,
      typeOrganizationId: client.typeOrganizationId,
      typeDocumentIdentificationId: client.typeDocumentIdentificationId,
    }
    setClients(prev => [...prev, newClient])
    setSelectedClientId(client.id)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/accounting/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('invoiceDetails.backToList')}
        </Button>
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t('invoiceWizard.success')}</h2>
          <div className="flex gap-3 mt-4">
            {draftId && (
              <Button onClick={() => navigate(`/accounting/invoices/${draftId}`)}>
                {t('invoiceWizard.viewInvoice')}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/accounting/invoices')}>
              {t('invoiceDetails.backToList')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounting/invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('invoiceWizard.title')}</h1>
          <p className="text-muted-foreground">{t('invoiceWizard.description')}</p>
        </div>
      </div>

      {/* Commercial-only notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t('invoiceWizard.commercialNotice')}</AlertDescription>
      </Alert>

      {/* Step indicator */}
      <div className="flex gap-2">
        <Button
          variant={currentStep === 'configure' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCurrentStep('configure'); setSubmitError(null) }}
        >
          1. {t('invoiceWizard.steps.configure')}
        </Button>
        <Button
          variant={currentStep === 'review' ? 'default' : 'outline'}
          size="sm"
          disabled={currentStep === 'configure'}
        >
          2. {t('invoiceWizard.steps.review')}
        </Button>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {currentStep === 'configure' && (
        <div className="space-y-6">
          {/* Client, Location, Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('invoiceWizard.steps.configure')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <ClientSelector
                clients={clients.map(c => ({
                  id: c.id ?? '',
                  displayName: c.displayName ?? '',
                  nit: c.nit,
                  verificationDigit: c.verificationDigit,
                }))}
                selectedClientId={selectedClientId}
                onClientSelect={setSelectedClientId}
                onClientCreated={handleClientCreated}
                workspaceId={workspaceId}
                apiClient={apiClient}
              />

              {/* Location */}
              <div className="space-y-2">
                <Label>{t('invoiceWizard.location')}</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('invoiceWizard.locationPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id ?? ''}>
                        {loc.name} — {loc.habilitationCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <Label>{t('invoiceWizard.resolution')}</Label>
                <Select value={selectedResolutionId} onValueChange={setSelectedResolutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('invoiceWizard.resolutionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutions.map(res => (
                      <SelectItem key={res.id} value={res.id ?? ''}>
                        {res.prefix} ({res.resolutionNumber}) · {res.fromNumber} - {res.toNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('invoiceWizard.payment.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoiceWizard.payment.type')}</Label>
                  <Select
                    value={paymentFormId.toString()}
                    onValueChange={v => {
                      const id = parseInt(v)
                      setPaymentFormId(id)
                      if (id === 1) setDueDays(0)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('invoiceWizard.payment.contado')}</SelectItem>
                      <SelectItem value="2">{t('invoiceWizard.payment.credito')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('invoiceWizard.payment.method')}</Label>
                  <Select value={paymentMethodId.toString()} onValueChange={v => setPaymentMethodId(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">{t('invoiceWizard.payment.efectivo')}</SelectItem>
                      <SelectItem value="42">{t('invoiceWizard.payment.transferencia')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentFormId === 2 && (
                  <div className="space-y-2">
                    <Label>{t('invoiceWizard.payment.dueDays')}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={dueDays}
                      onChange={e => setDueDays(parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{t('invoiceWizard.lineItems.title')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                {t('invoiceWizard.lineItems.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      {index === 0 && <Label className="text-xs">{t('invoiceWizard.lineItems.description')}</Label>}
                      <Input
                        placeholder={t('invoiceWizard.lineItems.descriptionPlaceholder')}
                        value={item.description}
                        onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      {index === 0 && <Label className="text-xs">{t('invoiceWizard.lineItems.quantity')}</Label>}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs">{t('invoiceWizard.lineItems.unitPrice')}</Label>}
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      {index === 0 && <Label className="text-xs">{t('invoiceWizard.lineItems.taxPercent')}</Label>}
                      <Select
                        value={item.taxPercent.toString()}
                        onValueChange={v => updateLineItem(item.id, 'taxPercent', parseInt(v))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAX_OPTIONS.map(tax => (
                            <SelectItem key={tax} value={tax.toString()}>{tax}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs">{t('invoiceWizard.lineItems.lineTotal')}</Label>}
                      <div className="h-9 flex items-center px-3 text-sm font-medium bg-muted rounded-md">
                        {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxPercent / 100), locale)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        disabled={lineItems.length <= 1}
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-2">
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('invoiceWizard.totals.subtotal')}</span>
                    <span>{formatCurrency(subtotal, locale)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('invoiceWizard.totals.tax')}</span>
                    <span>{formatCurrency(taxTotal, locale)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('invoiceWizard.totals.total')}</span>
                    <span>{formatCurrency(grandTotal, locale)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {step1Error && (
              <p className="text-sm text-muted-foreground">{step1Error}</p>
            )}
            <Button onClick={handleNext} disabled={!!step1Error}>
              {t('invoiceWizard.next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('invoiceWizard.review.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{t('invoiceWizard.review.clientInfo')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('invoiceWizard.client')}: </span>
                    <span className="font-medium">{selectedClient?.displayName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NIT: </span>
                    <span className="font-medium">{selectedClient?.nit}-{selectedClient?.verificationDigit}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configuration */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{t('invoiceWizard.review.invoiceConfig')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('invoiceWizard.location')}: </span>
                    <span className="font-medium">{selectedLocation?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('invoiceWizard.resolution')}: </span>
                    <span className="font-medium">{selectedResolution?.prefix} ({selectedResolution?.resolutionNumber})</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{t('invoiceWizard.review.paymentInfo')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('invoiceWizard.payment.type')}: </span>
                    <span className="font-medium">
                      {paymentFormId === 1 ? t('invoiceWizard.payment.contado') : t('invoiceWizard.payment.credito')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('invoiceWizard.payment.method')}: </span>
                    <span className="font-medium">
                      {paymentMethodId === 10 ? t('invoiceWizard.payment.efectivo') : t('invoiceWizard.payment.transferencia')}
                    </span>
                  </div>
                  {paymentFormId === 2 && (
                    <div>
                      <span className="text-muted-foreground">{t('invoiceWizard.payment.dueDays')}: </span>
                      <span className="font-medium">{dueDays}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Line Items Table */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{t('invoiceWizard.review.items')}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoiceWizard.lineItems.description')}</TableHead>
                      <TableHead className="text-center">{t('invoiceWizard.lineItems.quantity')}</TableHead>
                      <TableHead className="text-right">{t('invoiceWizard.lineItems.unitPrice')}</TableHead>
                      <TableHead className="text-center">{t('invoiceWizard.lineItems.taxPercent')}</TableHead>
                      <TableHead className="text-right">{t('invoiceWizard.lineItems.lineTotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice, locale)}</TableCell>
                        <TableCell className="text-center">{item.taxPercent}%</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxPercent / 100), locale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('invoiceWizard.totals.subtotal')}</span>
                      <span>{formatCurrency(subtotal, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('invoiceWizard.totals.tax')}</span>
                      <span>{formatCurrency(taxTotal, locale)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{t('invoiceWizard.totals.total')}</span>
                      <span>{formatCurrency(grandTotal, locale)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setCurrentStep('configure'); setSubmitError(null) }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('invoiceWizard.back')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !!step1Error}>
              {submitting ? t('invoiceWizard.submitting') : t('invoiceWizard.submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
