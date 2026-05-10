import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2, Loader2, Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReferenceCombobox, type ReferenceComboboxMessages } from '@/components/reference/ReferenceCombobox'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { useReferenceTableRecords } from '@/context/useReferenceData'
import type {
  RipsAdminApplicationDTOsInvoiceWizardClientDto,
  RipsAdminApplicationDTOsInvoiceWizardLocationDto,
  RipsAdminApplicationDTOsInvoiceWizardResolutionDto,
  RipsAdminApplicationDTOsInvoiceWizardTenantDto,
  RipsAdminApplicationDTOsFevRipsApiLocalDto,
  RipsAdminApplicationDTOsUsuarioDto,
  RipsAdminApplicationDTOsServiciosDto,
  RipsAdminApplicationDTOsTenantServiceSummaryDto,
  RipsAdminApplicationDTOsTenantServiceDetailsDto,
  RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto,
  RipsAdminApplicationServicesModelsInvoiceProviderRequest,
  RipsAdminApplicationServicesModelsInvoiceProviderCustomer,
  RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals,
  RipsAdminApplicationServicesModelsInvoiceLineItem,
  RipsAdminApplicationServicesModelsInvoiceTaxTotal,
  RipsAdminApplicationServicesModelsInvoicePaymentForm,
  RipsAdminApplicationServicesModelsInvoiceHealthFields,
  RipsAdminApplicationServicesModelsInvoiceHealthUserInfo,
} from '@/api'
import { RipsAdminDomainEntitiesInvoiceKind } from '@/api'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption, ReferenceTableName, ReferenceTableRecordMap } from '@/lib/reference-data/types'
import {
  CATEGORY_CONFIG,
  CATEGORY_FIELDS,
  normalizePayload,
  serializePayload,
} from '@/lib/rips/serviceCategories'
import type {
  CategorySlug,
  FieldConfig,
  ServiceCategoryValue,
} from '@/lib/rips/serviceCategories'
import { MassOperationsPanel, type CsvImportResult } from '@/components/rips/MassOperationsPanel'

type WizardStep = 'config' | 'patients' | 'review'

type ServicesDtoKey = keyof RipsAdminApplicationDTOsServiciosDto

interface PatientServiceInstance {
  id: string
  payload: Record<string, unknown>
  sourceServiceId?: string
}

type PatientServicesState = Record<CategorySlug, PatientServiceInstance[]>

interface PatientFormData extends Omit<RipsAdminApplicationDTOsUsuarioDto, 'servicios'> {
  servicios: PatientServicesState
  // Name fields for invoice line item description (not sent to RIPS)
  firstName?: string
  middleName?: string
  lastName?: string
  secondLastName?: string
}

interface SavedServiceOption {
  id: string
  name: string
  category: ServiceCategoryValue
  slug: CategorySlug
}

const MAX_REFERENCE_RESULTS = 50

const SERVICE_CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([slug, config]) => ({
  slug: slug as CategorySlug,
  ...config,
}))

const CATEGORY_VALUE_TO_SLUG = new Map<ServiceCategoryValue, CategorySlug>(
  SERVICE_CATEGORIES.map(({ slug, value }) => [value, slug]),
)

// Map service category name (from CSV) to slug
const CATEGORY_NAME_TO_SLUG: Record<string, CategorySlug> = {
  Consultas: 'consultas',
  Procedimientos: 'procedimientos',
  Urgencias: 'urgencias',
  Hospitalizacion: 'hospitalizacion',
  RecienNacidos: 'recien-nacidos',
  Medicamentos: 'medicamentos',
  OtrosServicios: 'otros-servicios',
}

const SERVICE_DTO_KEYS: Record<CategorySlug, ServicesDtoKey> = {
  consultas: 'consultas',
  procedimientos: 'procedimientos',
  urgencias: 'urgencias',
  hospitalizacion: 'hospitalizacion',
  'recien-nacidos': 'recienNacidos',
  medicamentos: 'medicamentos',
  'otros-servicios': 'otrosServicios',
}

const createEmptyServicesState = (): PatientServicesState => ({
  consultas: [],
  procedimientos: [],
  urgencias: [],
  hospitalizacion: [],
  'recien-nacidos': [],
  medicamentos: [],
  'otros-servicios': [],
})

const generateServiceInstanceId = () =>
  `svc-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`

const SERVICE_VALUE_FIELD: Partial<Record<ServiceCategoryValue, string>> = {
  [CATEGORY_CONFIG.consultas.value]: 'vrServicio',
  [CATEGORY_CONFIG.procedimientos.value]: 'vrServicio',
  [CATEGORY_CONFIG.medicamentos.value]: 'vrServicio',
  [CATEGORY_CONFIG['otros-servicios'].value]: 'vrServicio',
}

const WIZARD_LABEL_KEYS: Record<CategorySlug, { singular: string; add: string }> = {
  consultas: { singular: 'ripsWizard.consultation', add: 'ripsWizard.addConsultation' },
  procedimientos: { singular: 'ripsWizard.procedure', add: 'ripsWizard.addProcedure' },
  urgencias: { singular: 'ripsWizard.emergency', add: 'ripsWizard.addEmergency' },
  hospitalizacion: { singular: 'ripsWizard.hospitalization', add: 'ripsWizard.addHospitalization' },
  'recien-nacidos': { singular: 'ripsWizard.newborn', add: 'ripsWizard.addNewborn' },
  medicamentos: { singular: 'ripsWizard.medication', add: 'ripsWizard.addMedication' },
  'otros-servicios': { singular: 'ripsWizard.otherServices', add: 'ripsWizard.addOtherService' },
}

const tablesWithEnabledFlag = new Set<ReferenceTableName>([
  'serviceGroups',
  'procedureCodes',
  'sexes',
  'documentTypes',
  'careModalities',
  'collectionConcepts',
  'diagnosisCodes',
  'consultationPurposes',
  'serviceCodes',
  'entryRoutes',
  'externalCauses',
  'diagnosisTypes',
  'medicationTypes',
])

const buildReferenceOptions = <TTable extends ReferenceTableName>(
  table: TTable,
  records: ReferenceTableRecordMap[TTable][],
): ReferenceOption[] => {
  const definition = referenceTableDefinitions[table]
  const shouldFilterByEnabled = tablesWithEnabledFlag.has(table)
  return records
    .filter((record) => {
      if (!shouldFilterByEnabled) return true
      return (record as { isEnabled?: boolean }).isEnabled ?? true
    })
    .map((record) => {
      if (definition.toOption) return definition.toOption(record)
      const description = 'description' in record ? (record as { description?: string | null }).description ?? null : null
      return {
        value: record.code,
        label: record.name ? `${record.code} · ${record.name}` : record.code,
        description,
        searchText: [record.code, record.name, description ?? ''].join(' ').trim().toLowerCase(),
      }
    })
}

const resequenceConsecutivo = (services: PatientServiceInstance[]): PatientServiceInstance[] => {
  return services.map((service, index) => {
    const payload = { ...service.payload }
    if (Object.prototype.hasOwnProperty.call(payload, 'consecutivo')) {
      payload.consecutivo = index + 1
    }
    return { ...service, payload }
  })
}

const getServiceNumericValue = (categoryValue: ServiceCategoryValue, payload: Record<string, unknown>): number => {
  const fieldKey = SERVICE_VALUE_FIELD[categoryValue]
  if (!fieldKey) return 0
  const raw = payload[fieldKey]
  if (raw === undefined || raw === null || raw === '') return 0
  const numeric = typeof raw === 'number' ? raw : Number(raw)
  return Number.isNaN(numeric) ? 0 : numeric
}

const computePatientServiceTotal = (services: PatientServicesState): number =>
  SERVICE_CATEGORIES.reduce((total, { slug, value }) => {
    const list = services[slug] ?? []
    return total + list.reduce((sum, service) => sum + getServiceNumericValue(value, service.payload), 0)
  }, 0)

const countPatientServices = (services: PatientServicesState): number =>
  SERVICE_CATEGORIES.reduce((total, { slug }) => total + (services[slug]?.length ?? 0), 0)

const SERVICE_DATE_FIELD_KEYS = new Set([
  'fechainicioatencion',
  'fechaegreso',
  'fechadispensadmon',
  'fechasuministrotecnologia',
  // Backward-compatible aliases found in legacy imports/templates
  'fechaprocedimiento',
  'fechaconsulta',
  'fechaingreso',
])

const normalizeServiceDateFieldKey = (fieldName: string): string =>
  fieldName.replace(/[_\s-]/g, '').toLowerCase()

const extractIsoDatePrefix = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  if (value.length < 10) return null
  const dateStr = value.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : null
}

const collectServiceDates = (payload: Record<string, unknown>): string[] => {
  const dates: string[] = []
  for (const [fieldName, rawValue] of Object.entries(payload)) {
    if (!SERVICE_DATE_FIELD_KEYS.has(normalizeServiceDateFieldKey(fieldName))) continue
    const date = extractIsoDatePrefix(rawValue)
    if (date) {
      dates.push(date)
    }
  }
  return dates
}

const buildServiciosPayload = (
  services: PatientServicesState,
  codPrestador: string
): RipsAdminApplicationDTOsServiciosDto => {
  const result: Partial<RipsAdminApplicationDTOsServiciosDto> = {}
  SERVICE_CATEGORIES.forEach(({ slug, value }) => {
    const list = services[slug] ?? []
    const dtoKey = SERVICE_DTO_KEYS[slug]
    if (!list || list.length === 0) {
      (result as Record<string, unknown>)[dtoKey] = []
      return
    }
    const serialized = list.map((service, index) => {
      const basePayload = { ...service.payload }
      // Only set calculated fields; keep service document fields as entered for the professional.
      basePayload.codPrestador = codPrestador
      if (!basePayload.consecutivo || Number(basePayload.consecutivo) <= 0) {
        basePayload.consecutivo = index + 1
      }
      return serializePayload(value, basePayload)
    })
    ;(result as Record<string, unknown>)[dtoKey] = serialized
  })
  return result as RipsAdminApplicationDTOsServiciosDto
}

const normalizeRequiredText = (value: string | null | undefined): string => (value ?? '').trim()

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = normalizeRequiredText(value)
  return trimmed.length === 0 ? null : trimmed
}

const normalizeRequiredCode = (value: string | null | undefined): string => normalizeRequiredText(value).toUpperCase()

const normalizeOptionalCode = (value: string | null | undefined): string | null => {
  const trimmed = normalizeRequiredText(value)
  return trimmed.length === 0 ? null : trimmed.toUpperCase()
}

const normalizeDocumentNumber = (value: string | null | undefined): string => normalizeRequiredText(value).replace(/\s+/g, '')

const normalizeDateOnly = (value: string | null | undefined): string => {
  const trimmed = normalizeRequiredText(value)
  return trimmed.length > 10 ? trimmed.slice(0, 10) : trimmed
}

export function RipsWizard() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? ''

  // Reference data hooks
  const { records: documentTypeRecords } = useReferenceTableRecords('documentTypes')
  const { records: procedureCodeRecords } = useReferenceTableRecords('procedureCodes')
  const { records: serviceGroupRecords } = useReferenceTableRecords('serviceGroups')
  const { records: sexRecords } = useReferenceTableRecords('sexes')
  const { records: careModalityRecords } = useReferenceTableRecords('careModalities')
  const { records: collectionConceptRecords } = useReferenceTableRecords('collectionConcepts')
  const { records: diagnosisRecords } = useReferenceTableRecords('diagnosisCodes')
  const { records: consultationPurposeRecords } = useReferenceTableRecords('consultationPurposes')
  const { records: serviceCodeRecords } = useReferenceTableRecords('serviceCodes')
  const { records: entryRouteRecords } = useReferenceTableRecords('entryRoutes')
  const { records: externalCauseRecords } = useReferenceTableRecords('externalCauses')
  const { records: diagnosisTypeRecords } = useReferenceTableRecords('diagnosisTypes')
  const { records: medicationTypeRecords } = useReferenceTableRecords('medicationTypes')
  const { records: invoiceMunicipalityRecords } = useReferenceTableRecords('invoiceMunicipalities')
  const { records: healthTypeOperationRecords } = useReferenceTableRecords('healthTypeOperations')
  const { records: healthCoverageRecords } = useReferenceTableRecords('healthCoverages')
  const { records: healthContractingPaymentMethodRecords } = useReferenceTableRecords('healthContractingPaymentMethods')
  const { records: healthTypeUserRecords } = useReferenceTableRecords('healthTypeUsers')
  const { records: zonaTerritorialRecords } = useReferenceTableRecords('zonaTerritorial')
  const { records: paisesRecords } = useReferenceTableRecords('paises')
  const { records: municipiosRecords } = useReferenceTableRecords('municipios')

  // Patient form options
  const zonaTerritorialOptions = useMemo<ReferenceOption[]>(() => {
    if (!zonaTerritorialRecords) return []
    const def = referenceTableDefinitions.zonaTerritorial
    return zonaTerritorialRecords
      .filter(r => r.isEnabled)
      .map(r => def.toOption?.(r) ?? { value: r.code, label: `${r.code} · ${r.name}` })
  }, [zonaTerritorialRecords])

  const paisesOptions = useMemo<ReferenceOption[]>(() => {
    if (!paisesRecords) return []
    const def = referenceTableDefinitions.paises
    return paisesRecords
      .filter(r => r.isEnabled)
      .map(r => def.toOption?.(r) ?? { value: r.code, label: r.name })
  }, [paisesRecords])

  const municipiosOptions = useMemo<ReferenceOption[]>(() => {
    if (!municipiosRecords) return []
    const def = referenceTableDefinitions.municipios
    return municipiosRecords
      .filter(r => r.isEnabled)
      .map(r => def.toOption?.(r) ?? { value: r.code, label: r.name })
  }, [municipiosRecords])

  const userTypeReferenceOptions = useMemo<ReferenceOption[]>(() => {
    if (!healthTypeUserRecords) return []
    const def = referenceTableDefinitions.healthTypeUsers
    return healthTypeUserRecords
      .filter(r => r.isEnabled)
      .map(r => def.toOption?.(r) ?? { value: r.code, label: `${r.code} · ${r.name}` })
  }, [healthTypeUserRecords])

  // Health field options
  const healthTypeOperationOptions = useMemo<ReferenceOption[]>(() => {
    if (!healthTypeOperationRecords) return []
    const def = referenceTableDefinitions.healthTypeOperations
    return healthTypeOperationRecords.map(r => def.toOption?.(r) ?? { value: r.code, label: r.name })
  }, [healthTypeOperationRecords])

  const healthCoverageOptions = useMemo<ReferenceOption[]>(() => {
    if (!healthCoverageRecords) return []
    const def = referenceTableDefinitions.healthCoverages
    return healthCoverageRecords.map(r => def.toOption?.(r) ?? { value: r.code, label: r.name })
  }, [healthCoverageRecords])

  const healthContractingPaymentMethodOptions = useMemo<ReferenceOption[]>(() => {
    if (!healthContractingPaymentMethodRecords) return []
    const def = referenceTableDefinitions.healthContractingPaymentMethods
    return healthContractingPaymentMethodRecords.map(r => def.toOption?.(r) ?? { value: r.code, label: r.name })
  }, [healthContractingPaymentMethodRecords])

  // Helper to look up invoice municipality_id from Colombian municipality code
  const getMunicipalityId = useCallback((municipalityCode: string | undefined): number | undefined => {
    if (!municipalityCode || !invoiceMunicipalityRecords) return undefined
    const record = invoiceMunicipalityRecords.find(r => r.code === municipalityCode)
    return record?.id ?? undefined
  }, [invoiceMunicipalityRecords])

  // Helper to get type_regime_id from tax regime code (48=Responsable IVA=1, 49=No Responsable=2)
  const getTypeRegimeId = (taxRegime: string | undefined): number => {
    if (taxRegime === '48') return 1 // Responsable de IVA
    return 2 // No Responsable de IVA (default)
  }

  const referenceComboboxMessages = useMemo<ReferenceComboboxMessages>(() => ({
    searchPlaceholder: t('referenceData.searchPlaceholder'),
    noResults: t('referenceData.noResultsDefault'),
    noResultsForQuery: (query: string) => t('referenceData.noResultsForQuery', { query }),
    resultsLimited: (count: number, total: number) => t('referenceData.resultsLimited', { count, total }),
  }), [t])

  const referenceOptionsByTable = useMemo<Partial<Record<ReferenceTableName, ReferenceOption[]>>>(() => ({
    serviceGroups: buildReferenceOptions('serviceGroups', serviceGroupRecords),
    procedureCodes: buildReferenceOptions('procedureCodes', procedureCodeRecords),
    sexes: buildReferenceOptions('sexes', sexRecords),
    documentTypes: buildReferenceOptions('documentTypes', documentTypeRecords),
    careModalities: buildReferenceOptions('careModalities', careModalityRecords),
    collectionConcepts: buildReferenceOptions('collectionConcepts', collectionConceptRecords),
    diagnosisCodes: buildReferenceOptions('diagnosisCodes', diagnosisRecords),
    consultationPurposes: buildReferenceOptions('consultationPurposes', consultationPurposeRecords),
    serviceCodes: buildReferenceOptions('serviceCodes', serviceCodeRecords),
    entryRoutes: buildReferenceOptions('entryRoutes', entryRouteRecords),
    externalCauses: buildReferenceOptions('externalCauses', externalCauseRecords),
    diagnosisTypes: buildReferenceOptions('diagnosisTypes', diagnosisTypeRecords),
    medicationTypes: buildReferenceOptions('medicationTypes', medicationTypeRecords),
  }), [
    serviceGroupRecords, procedureCodeRecords, sexRecords, documentTypeRecords,
    careModalityRecords, collectionConceptRecords, diagnosisRecords,
    consultationPurposeRecords, serviceCodeRecords, entryRouteRecords,
    externalCauseRecords, diagnosisTypeRecords, medicationTypeRecords,
  ])

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('config')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  // Context data from API
  const [tenant, setTenant] = useState<RipsAdminApplicationDTOsInvoiceWizardTenantDto | null>(null)
  const [clients, setClients] = useState<RipsAdminApplicationDTOsInvoiceWizardClientDto[]>([])
  const [locations, setLocations] = useState<RipsAdminApplicationDTOsInvoiceWizardLocationDto[]>([])
  const [resolutions, setResolutions] = useState<RipsAdminApplicationDTOsInvoiceWizardResolutionDto[]>([])

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedResolutionId, setSelectedResolutionId] = useState<string>('')

  // Client combobox state
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')

  // Client combobox helpers
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null
    return clients.find((c) => c.id === selectedClientId) ?? null
  }, [clients, selectedClientId])

  const filteredClients = useMemo(() => {
    const query = clientSearchTerm.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) => {
      const searchText = `${client.displayName ?? ''} ${client.nit ?? ''}`.toLowerCase()
      return searchText.includes(query)
    })
  }, [clients, clientSearchTerm])

  const handleClientComboboxOpenChange = useCallback((open: boolean) => {
    setClientComboboxOpen(open)
    if (!open) {
      setClientSearchTerm('')
    }
  }, [])

  // Health fields state
  const [healthTypeOperationId, setHealthTypeOperationId] = useState<string>('01')
  const [healthCoverageId, setHealthCoverageId] = useState<string>('05')
  const [healthContractingPaymentMethodId, setHealthContractingPaymentMethodId] = useState<string>('04')
  const [invoicePeriodStartDate, setInvoicePeriodStartDate] = useState<string>('')
  const [invoicePeriodEndDate, setInvoicePeriodEndDate] = useState<string>('')
  const [policyNumber, setPolicyNumber] = useState<string>('')
  const [contractNumber, setContractNumber] = useState<string>('')

  // Patient/services state
  const [patients, setPatients] = useState<PatientFormData[]>([])

  // Saved services
  const [serviceOptions, setServiceOptions] = useState<Partial<Record<ServiceCategoryValue, SavedServiceOption[]>>>({})
  const [servicesLoading, setServicesLoading] = useState(false)
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null)

  // Calculate min/max fechaInicioAtencion from patients' services
  useEffect(() => {
    const dates: string[] = []

    for (const patient of patients) {
      for (const categorySlug of Object.keys(patient.servicios) as CategorySlug[]) {
        const services = patient.servicios[categorySlug] ?? []
        for (const service of services) {
          dates.push(...collectServiceDates(service.payload))
        }
      }
    }

    if (dates.length > 0) {
      dates.sort()
      setInvoicePeriodStartDate(dates[0])
      setInvoicePeriodEndDate(dates[dates.length - 1])
    } else {
      // No service dates found — default to today
      const today = new Date().toISOString().split('T')[0]
      setInvoicePeriodStartDate(today)
      setInvoicePeriodEndDate(today)
    }
  }, [patients])

  // Load wizard context
  const loadWizardContext = useCallback(async () => {
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
        // Auto-select first options if available
        if (data.clients && data.clients.length > 0) setSelectedClientId(data.clients[0].id ?? '')
        if (data.locations && data.locations.length > 0) setSelectedLocationId(data.locations[0].id ?? '')
        if (data.resolutions && data.resolutions.length > 0) setSelectedResolutionId(data.resolutions[0].id ?? '')
      }
    } catch (err) {
      console.error('Failed to load wizard context:', err)
      setError(t('ripsWizard.loadInvoicesError'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, apiClient, t])

  const loadServiceOptions = useCallback(async () => {
    if (!workspaceId) return
    try {
      setServicesLoading(true)
      const results = await Promise.all(
        SERVICE_CATEGORIES.map(async ({ slug, value }) => {
          try {
            const response = await apiClient.ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint(
              workspaceId,
              { params: { category: value, includeInactive: false } },
            )
            const data = (response?.data as RipsAdminApplicationDTOsTenantServiceSummaryDto[] | undefined) ?? []
            const mapped: SavedServiceOption[] = data
              .filter((item): item is RipsAdminApplicationDTOsTenantServiceSummaryDto & { id: string } => Boolean(item?.id))
              .map((item) => ({ id: item.id!, name: item.name ?? t('ripsWizard.unnamedService'), category: value, slug }))
            return [value, mapped] as const
          } catch {
            return [value, []] as const
          }
        }),
      )
      const next: Partial<Record<ServiceCategoryValue, SavedServiceOption[]>> = {}
      results.forEach(([category, items]) => { next[category] = [...items] })
      setServiceOptions(next)
    } finally {
      setServicesLoading(false)
    }
  }, [apiClient, t, workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    loadWizardContext()
    loadServiceOptions()
  }, [workspaceId, loadWizardContext, loadServiceOptions])

  // Patient management
  const addPatient = () => {
    const newPatient: PatientFormData = {
      tipoDocumentoIdentificacion: '',
      numDocumentoIdentificacion: '',
      tipoUsuario: '',
      fechaNacimiento: '',
      codSexo: '',
      codPaisResidencia: '170',
      codPaisOrigen: '170',
      codMunicipioResidencia: '',
      codZonaTerritorialResidencia: '',
      incapacidad: '',
      consecutivo: patients.length + 1,
      servicios: createEmptyServicesState(),
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
    }
    setPatients((prev) => [...prev, newPatient])
  }

  // Handle CSV import - populate patients from parsed CSV rows
  const handleCsvImport = useCallback((result: CsvImportResult) => {
    if (!result.parsedRows || result.parsedRows.length === 0) return

    const newPatients: PatientFormData[] = result.parsedRows.map((row, idx) => {
      // Create services state with the imported service
      const servicios = createEmptyServicesState()
      
      // Map service category name to slug
      const categorySlug = CATEGORY_NAME_TO_SLUG[row.serviceCategory]
      if (categorySlug && Object.keys(row.servicePayload).length > 0) {
        const serviceInstance: PatientServiceInstance = {
          id: generateServiceInstanceId(),
          payload: row.servicePayload,
        }
        servicios[categorySlug] = [serviceInstance]
      }

      return {
        tipoDocumentoIdentificacion: row.tipoDocumentoIdentificacion,
        numDocumentoIdentificacion: row.numDocumentoIdentificacion,
        tipoUsuario: row.tipoUsuario,
        fechaNacimiento: row.fechaNacimiento,
        codSexo: row.codSexo,
        codPaisResidencia: row.codPaisResidencia || '170',
        codPaisOrigen: row.codPaisOrigen || '170',
        codMunicipioResidencia: row.codMunicipioResidencia,
        codZonaTerritorialResidencia: row.codZonaTerritorialResidencia,
        incapacidad: row.incapacidad,
        consecutivo: patients.length + idx + 1,
        servicios,
        firstName: row.firstName || '',
        middleName: row.middleName || '',
        lastName: row.lastName || '',
        secondLastName: row.secondLastName || '',
      }
    })

    setPatients((prev) => [...prev, ...newPatients])
  }, [patients.length])

  const removePatient = (index: number) => {
    setPatients((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePatient = <K extends keyof PatientFormData>(index: number, field: K, value: PatientFormData[K]) => {
    setPatients((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addServiceToPatient = (patientIndex: number, slug: CategorySlug, preset?: Record<string, unknown>, sourceServiceId?: string) => {
    setPatients((prev) => {
      if (patientIndex < 0 || patientIndex >= prev.length) return prev
      const next = [...prev]
      const patient = { ...next[patientIndex] }
      const services = { ...patient.servicios }
      const categoryValue = CATEGORY_CONFIG[slug].value
      const normalized = normalizePayload(categoryValue, preset)
      const currentList = services[slug] ?? []
      const payload = { ...normalized }
      if (!payload.consecutivo || Number(payload.consecutivo) <= 0) {
        payload.consecutivo = currentList.length + 1
      }
      const instance: PatientServiceInstance = { id: generateServiceInstanceId(), payload, sourceServiceId }
      services[slug] = [...currentList, instance]
      next[patientIndex] = { ...patient, servicios: services }
      return next
    })
  }

  const addSavedServiceToPatient = async (patientIndex: number, category: ServiceCategoryValue, serviceId: string) => {
    if (!workspaceId) return
    const slug = CATEGORY_VALUE_TO_SLUG.get(category)
    if (!slug) return
    try {
      setError(null)
      setLoadingServiceId(serviceId)
      const response = await apiClient.ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint(workspaceId, serviceId)
      const details = response?.data as RipsAdminApplicationDTOsTenantServiceDetailsDto | undefined
      if (!details) {
        setError(t('ripsWizard.loadServicesError'))
        return
      }
      addServiceToPatient(patientIndex, slug, details.payload, serviceId)
    } catch {
      setError(t('ripsWizard.loadServicesError'))
    } finally {
      setLoadingServiceId(null)
    }
  }

  const removeServiceFromPatient = (patientIndex: number, slug: CategorySlug, serviceId: string) => {
    setPatients((prev) => {
      if (patientIndex < 0 || patientIndex >= prev.length) return prev
      const next = [...prev]
      const patient = { ...next[patientIndex] }
      const services = { ...patient.servicios }
      const currentList = services[slug] ?? []
      if (currentList.length === 0) return prev
      const nextList = currentList.filter((service) => service.id !== serviceId)
      if (nextList.length === currentList.length) return prev
      services[slug] = resequenceConsecutivo(nextList)
      next[patientIndex] = { ...patient, servicios: services }
      return next
    })
  }

  const handleServiceFieldChange = (patientIndex: number, slug: CategorySlug, serviceId: string, field: FieldConfig, rawValue: string) => {
    setPatients((prev) => {
      if (patientIndex < 0 || patientIndex >= prev.length) return prev
      const next = [...prev]
      const patient = { ...next[patientIndex] }
      const services = { ...patient.servicios }
      const currentList = services[slug] ?? []
      const serviceIndex = currentList.findIndex((service) => service.id === serviceId)
      if (serviceIndex === -1) return prev
      const currentService = currentList[serviceIndex]
      const nextPayload = { ...currentService.payload }
      if (field.type === 'number') {
        if (rawValue === '') nextPayload[field.key] = null
        else {
          const numericValue = Number(rawValue)
          if (!Number.isNaN(numericValue)) nextPayload[field.key] = numericValue
        }
      } else {
        nextPayload[field.key] = rawValue
      }
      const updatedService: PatientServiceInstance = { ...currentService, payload: nextPayload }
      const nextList = [...currentList]
      nextList[serviceIndex] = updatedService
      services[slug] = nextList
      next[patientIndex] = { ...patient, servicios: services }
      return next
    })
  }

  // Build and submit unified payload
  const handleSubmit = async () => {
    if (!workspaceId || !selectedClientId || !selectedLocationId || !selectedResolutionId || !tenant) {
      setError(t('ripsWizard.missingConfiguration'))
      return
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId)
    const selectedLocation = locations.find((l) => l.id === selectedLocationId)
    const selectedResolution = resolutions.find((r) => r.id === selectedResolutionId)

    if (!selectedClient || !selectedLocation || !selectedResolution) {
      setError(t('ripsWizard.missingConfiguration'))
      return
    }

    if (!selectedClient.email?.trim()) {
      setError(t('ripsWizard.missingClientEmail'))
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const totalAmount = patients.reduce((sum, patient) => sum + computePatientServiceTotal(patient.servicios), 0)
      const totalStr = totalAmount.toFixed(2)
      const currentDate = new Date()
      const dateStr = currentDate.toISOString().split('T')[0]
      const timeStr = currentDate.toTimeString().split(' ')[0]

      // Helper to look up service name from reference records
      const getServiceName = (serviceCode: string | number | null | undefined): string => {
        if (!serviceCode) return ''
        const codeStr = String(serviceCode).trim()
        // Try procedure codes first (CUPS)
        const procedureRecord = procedureCodeRecords.find(r => r.code === codeStr)
        if (procedureRecord?.name) return procedureRecord.name
        // Then try service codes
        const serviceRecord = serviceCodeRecords.find(r => r.code === codeStr)
        if (serviceRecord?.name) return serviceRecord.name
        return ''
      }

      // Build a line description per service category, using the correct fields from each entity
      const buildLineDescription = (
        categorySlug: CategorySlug,
        payload: Record<string, unknown>,
        patientLabel: string,
      ): string => {
        const s = (v: unknown) => String(v ?? '').trim()
        const date = (v: unknown) => s(v).split('T')[0]

        switch (categorySlug) {
          case 'consultas': {
            const code = s(payload.codConsulta)
            const name = getServiceName(code)
            return [patientLabel, `CUPS: ${code} ${name}`.trim(), `Auth: ${s(payload.numAutorizacion)}`, date(payload.fechaInicioAtencion)].filter(Boolean).join(' - ')
          }
          case 'procedimientos': {
            const code = s(payload.codProcedimiento)
            const name = getServiceName(code)
            return [patientLabel, `CUPS: ${code} ${name}`.trim(), `Auth: ${s(payload.numAutorizacion)}`, date(payload.fechaInicioAtencion)].filter(Boolean).join(' - ')
          }
          case 'urgencias': {
            const diag = s(payload.codDiagnosticoPrincipal)
            return [patientLabel, `Dx: ${diag}`, date(payload.fechaInicioAtencion)].filter(Boolean).join(' - ')
          }
          case 'hospitalizacion': {
            const diag = s(payload.codDiagnosticoPrincipal)
            return [patientLabel, `Dx: ${diag}`, `Auth: ${s(payload.numAutorizacion)}`, date(payload.fechaInicioAtencion)].filter(Boolean).join(' - ')
          }
          case 'recien-nacidos': {
            const diag = s(payload.codDiagnosticoPrincipal)
            return [patientLabel, `Dx: ${diag}`, date(payload.fechaNacimiento)].filter(Boolean).join(' - ')
          }
          case 'medicamentos': {
            const tech = s(payload.nomTecnologiaSalud) || s(payload.codTecnologiaSalud)
            return [patientLabel, tech, `Auth: ${s(payload.numAutorizacion)}`, date(payload.fechaDispensAdmon)].filter(Boolean).join(' - ')
          }
          case 'otros-servicios': {
            const tech = s(payload.nomTecnologiaSalud) || s(payload.codTecnologiaSalud)
            return [patientLabel, tech, `Auth: ${s(payload.numAutorizacion)}`, date(payload.fechaSuministroTecnologia)].filter(Boolean).join(' - ')
          }
        }
      }

      // Build invoice lines from patient services
      const invoiceLines: RipsAdminApplicationServicesModelsInvoiceLineItem[] = []
      patients.forEach((patient) => {
        const patientFullName = [patient.firstName, patient.middleName, patient.lastName, patient.secondLastName]
          .filter(Boolean).join(' ').trim()
        const patientLabel = `${patientFullName} - ${patient.tipoDocumentoIdentificacion}${patient.numDocumentoIdentificacion}`

        SERVICE_CATEGORIES.forEach(({ slug, value }) => {
          const serviceList = patient.servicios[slug] ?? []
          serviceList.forEach((service) => {
            const vrServicio = getServiceNumericValue(value, service.payload)
            if (vrServicio > 0) {
              const description = buildLineDescription(slug, service.payload, patientLabel)
              invoiceLines.push({
                unit_measure_id: 70,
                invoiced_quantity: '1',
                line_extension_amount: vrServicio.toFixed(2),
                free_of_charge_indicator: false,
                description,
                code: '100',
                type_item_identification_id: 4,
                price_amount: vrServicio.toFixed(2),
                base_quantity: '1',
                tax_totals: [{ tax_id: 1, tax_amount: '0.00', percent: '0.00', taxable_amount: vrServicio.toFixed(2) }],
              })
            }
          })
        })
      })

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

      const legalMonetaryTotals: RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals = {
        line_extension_amount: totalStr,
        tax_exclusive_amount: totalStr,
        tax_inclusive_amount: totalStr,
        payable_amount: totalStr,
      }

      const taxTotals: RipsAdminApplicationServicesModelsInvoiceTaxTotal[] = [
        { tax_id: 1, tax_amount: '0.00', percent: '0.00', taxable_amount: totalStr },
      ]

      const paymentForm: RipsAdminApplicationServicesModelsInvoicePaymentForm = {
        payment_form_id: 1,
        payment_method_id: 10,
        payment_due_date: dateStr,
        duration_measure: '0',
      }

      // Full habilitation code for RIPS codPrestador (12 digits: prestador + sede)
      const codPrestador = (selectedLocation.habilitationCode ?? '').trim()

      const healthUserInfo: RipsAdminApplicationServicesModelsInvoiceHealthUserInfo = {
        provider_code: tenant.serviceCode ?? '',
        health_coverage_id: healthCoverageId,
        contract_number: contractNumber || selectedClient.email || '',
        policy_number: policyNumber,
        co_payment: '0.00',
        moderating_fee: '0.00',
        recovery_fee: '0.00',
        shared_payment: '0.00',
        health_contracting_payment_method_id: healthContractingPaymentMethodId,
      }

      // Recalculate invoice period from service dates at submit time to ensure correctness
      const allServiceDates: string[] = []
      for (const patient of patients) {
        for (const categorySlug of Object.keys(patient.servicios) as CategorySlug[]) {
          const services = patient.servicios[categorySlug] ?? []
          for (const service of services) {
            allServiceDates.push(...collectServiceDates(service.payload))
          }
        }
      }
      let periodStart = invoicePeriodStartDate
      let periodEnd = invoicePeriodEndDate
      if (allServiceDates.length > 0) {
        allServiceDates.sort()
        periodStart = allServiceDates[0]
        periodEnd = allServiceDates[allServiceDates.length - 1]
      }
      // Fallback to today if still empty
      if (!periodStart || !periodEnd) {
        periodStart = periodStart || dateStr
        periodEnd = periodEnd || dateStr
      }

      const healthFields: RipsAdminApplicationServicesModelsInvoiceHealthFields = {
        invoice_period_start_date: periodStart,
        invoice_period_end_date: periodEnd,
        health_type_operation_id: healthTypeOperationId,
        users_info: [healthUserInfo],
      }

      const invoicePayload: RipsAdminApplicationServicesModelsInvoiceProviderRequest = {
        prefix: selectedResolution.prefix ?? '',
        number: '', // Will be assigned by backend
        type_document_id: 1,
        date: dateStr,
        time: timeStr,
        resolution_number: selectedResolution.resolutionNumber ?? '',
        customer,
        legal_monetary_totals: legalMonetaryTotals,
        invoice_lines: invoiceLines,
        tax_totals: taxTotals,
        payment_form: paymentForm,
        health_fields: healthFields,
      }

      // Build RIPS payload
      const usuariosPayload = patients.map((patient, idx) => {
        const tipoDocumentoIdentificacion = normalizeRequiredCode(patient.tipoDocumentoIdentificacion)
        const numDocumentoIdentificacion = normalizeDocumentNumber(patient.numDocumentoIdentificacion)

        return {
          tipoDocumentoIdentificacion,
          numDocumentoIdentificacion,
          tipoUsuario: normalizeOptionalCode(patient.tipoUsuario),
          fechaNacimiento: normalizeDateOnly(patient.fechaNacimiento),
          codSexo: normalizeRequiredCode(patient.codSexo),
          codPaisResidencia: normalizeOptionalText(patient.codPaisResidencia),
          codPaisOrigen: normalizeOptionalText(patient.codPaisOrigen),
          codMunicipioResidencia: normalizeOptionalText(patient.codMunicipioResidencia),
          codZonaTerritorialResidencia: normalizeOptionalCode(patient.codZonaTerritorialResidencia),
          incapacidad: normalizeRequiredCode(patient.incapacidad),
          consecutivo: idx + 1,
          servicios: buildServiciosPayload(
            patient.servicios,
            codPrestador
          ),
        } as unknown as RipsAdminApplicationDTOsUsuarioDto
      })

      const ripsPayload: RipsAdminApplicationDTOsFevRipsApiLocalDto = {
        rips: {
          numDocumentoIdObligado: tenant.nit ?? '',
          numFactura: '', // Will be updated after invoice creation
          tipoNota: null,
          numNota: null,
          usuarios: usuariosPayload,
        },
        xmlFevFile: null, // Will be fetched from DIAN after invoice is validated
      }

      const createRequest: RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto = {
        clientId: selectedClientId,
        locationId: selectedLocationId,
        invoiceResolutionId: selectedResolutionId,
        totalAmount,
        metadata: { documentPrefix: selectedResolution.prefix },
        kind: RipsAdminDomainEntitiesInvoiceKind.Health,
        ripsPayload,
        invoicePayload,
      }

      const response = await apiClient.ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint(workspaceId, createRequest)
      
      setDraftId(response.data?.id ?? null)
      setSuccess(true)
      setCurrentStep('review')
    } catch (err) {
      console.error('Failed to submit invoice + RIPS:', err)
      setError(t('ripsWizard.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep('config')
    setPatients([])
    setSuccess(false)
    setDraftId(null)
    setError(null)
  }

  // Step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'config', label: t('ripsWizard.configuration') },
      { key: 'patients', label: t('ripsWizard.addPatients') },
      { key: 'review', label: t('ripsWizard.reviewSubmit') },
    ]
    const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

    return (
      <div className="mb-6">
        <ol className="flex items-center gap-3 text-sm font-medium">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            return (
              <li key={step.key} className="flex items-center gap-2">
                <span className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  isActive ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted-foreground/40 text-muted-foreground',
                ].join(' ')}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </span>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                {index < steps.length - 1 && <span className="h-px w-8 bg-muted-foreground/30" aria-hidden />}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  // Step 1: Configuration
  const renderConfigStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('ripsWizard.configuration')}</CardTitle>
        <CardDescription>{t('ripsWizard.configurationDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('ripsWizard.invoiceConfig')}</h3>
          
          <div className="space-y-2">
            <Label>{t('ripsWizard.client')}</Label>
            <Popover open={clientComboboxOpen} onOpenChange={handleClientComboboxOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientComboboxOpen}
                  className="w-full justify-between font-normal h-9"
                >
                  {selectedClient ? (
                    <span className="flex items-center gap-2 truncate">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selectedClient.displayName}</span>
                      {selectedClient.nit && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({selectedClient.nit})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t('ripsWizard.selectClient')}</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    value={clientSearchTerm}
                    onValueChange={setClientSearchTerm}
                    placeholder={t('ripsWizard.searchClient', 'Buscar cliente...')}
                  />
                  <CommandList className="max-h-60">
                    <CommandEmpty>{t('ripsWizard.noClientsFound', 'No se encontraron clientes')}</CommandEmpty>
                    <CommandGroup>
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id ?? ''}
                          onSelect={() => {
                            setSelectedClientId(client.id ?? '')
                            handleClientComboboxOpenChange(false)
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">{client.displayName}</span>
                            {client.nit && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({client.nit})
                              </span>
                            )}
                          </div>
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4 shrink-0',
                              selectedClientId === client.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {clients.length === 0 && <p className="text-sm text-muted-foreground">{t('ripsWizard.noClients')}</p>}
            {selectedClient && !selectedClient.email?.trim() && (
              <p className="text-sm text-destructive">{t('ripsWizard.missingClientEmail')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('ripsWizard.location')}</Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger><SelectValue placeholder={t('ripsWizard.selectLocation')} /></SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id ?? ''}>
                    {location.name} - {location.habilitationCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {locations.length === 0 && <p className="text-sm text-muted-foreground">{t('ripsWizard.noLocations')}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('ripsWizard.resolution')}</Label>
            <Select value={selectedResolutionId} onValueChange={setSelectedResolutionId}>
              <SelectTrigger><SelectValue placeholder={t('ripsWizard.selectResolution')} /></SelectTrigger>
              <SelectContent>
                {resolutions.map((res) => (
                  <SelectItem key={res.id} value={res.id ?? ''}>
                    {res.prefix} - {res.resolutionNumber} ({res.nextNumber}/{res.toNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resolutions.length === 0 && <p className="text-sm text-muted-foreground">{t('ripsWizard.noResolutions')}</p>}
          </div>
        </div>

        <Separator />

        {/* Health Sector Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('ripsWizard.healthSectorConfig')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('ripsWizard.healthTypeOperation')}</Label>
              <ReferenceCombobox
                options={healthTypeOperationOptions}
                value={healthTypeOperationId}
                onChange={setHealthTypeOperationId}
                placeholder={t('ripsWizard.selectOption')}
                tableLabel={t('ripsWizard.healthTypeOperation')}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ripsWizard.healthCoverage')}</Label>
              <ReferenceCombobox
                options={healthCoverageOptions}
                value={healthCoverageId}
                onChange={setHealthCoverageId}
                placeholder={t('ripsWizard.selectOption')}
                tableLabel={t('ripsWizard.healthCoverage')}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ripsWizard.healthContractingPaymentMethod')}</Label>
              <ReferenceCombobox
                options={healthContractingPaymentMethodOptions}
                value={healthContractingPaymentMethodId}
                onChange={setHealthContractingPaymentMethodId}
                placeholder={t('ripsWizard.selectOption')}
                tableLabel={t('ripsWizard.healthContractingPaymentMethod')}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('ripsWizard.invoicePeriodStartDate')}</Label>
              <Input
                type="date"
                value={invoicePeriodStartDate}
                onChange={(e) => setInvoicePeriodStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ripsWizard.invoicePeriodEndDate')}</Label>
              <Input
                type="date"
                value={invoicePeriodEndDate}
                onChange={(e) => setInvoicePeriodEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('ripsWizard.policyNumber')}</Label>
              <Input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder={t('ripsWizard.policyNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ripsWizard.contractNumber')}</Label>
              <Input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder={t('ripsWizard.contractNumberPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setCurrentStep('patients')}
            disabled={!selectedClientId || !selectedLocationId || !selectedResolutionId || !selectedClient?.email?.trim()}
          >
            {t('ripsWizard.next')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Step 2: Add Patients (simplified version)
  const documentTypeOptions = referenceOptionsByTable.documentTypes ?? []

  const renderPatientsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('ripsWizard.addPatients')}</CardTitle>
        <CardDescription>{t('ripsWizard.patientInfo')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mass Operations Panel */}
        <MassOperationsPanel 
          workspaceId={workspaceId} 
          savedServices={serviceOptions}
          servicesLoading={servicesLoading}
          onImportComplete={handleCsvImport}
        />

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('ripsWizard.patientList')}</h3>
          <Button onClick={addPatient}>
            <Plus className="w-4 h-4 mr-2" />
            {t('ripsWizard.addPatient')}
          </Button>
        </div>

        {patients.length === 0 ? (
          <Alert><AlertDescription>{t('ripsWizard.noPatients')}</AlertDescription></Alert>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {patients.map((patient, patientIndex) => (
                <Card key={patientIndex}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{t('ripsWizard.patientInfo')} #{patientIndex + 1}</CardTitle>
                      <Button variant="ghost" onClick={() => removePatient(patientIndex)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Row 0: Patient Names (for invoice only, not RIPS) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.firstName')}</Label>
                        <Input
                          value={patient.firstName ?? ''}
                          onChange={(e) => updatePatient(patientIndex, 'firstName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.middleName')}</Label>
                        <Input
                          value={patient.middleName ?? ''}
                          onChange={(e) => updatePatient(patientIndex, 'middleName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.lastName')}</Label>
                        <Input
                          value={patient.lastName ?? ''}
                          onChange={(e) => updatePatient(patientIndex, 'lastName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.secondLastName')}</Label>
                        <Input
                          value={patient.secondLastName ?? ''}
                          onChange={(e) => updatePatient(patientIndex, 'secondLastName', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 1: Document Type, Document Number, User Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.documentType')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-doctype`}
                          value={patient.tipoDocumentoIdentificacion ?? ''}
                          selectedOption={documentTypeOptions.find((o) => o.value === patient.tipoDocumentoIdentificacion) ?? null}
                          options={documentTypeOptions}
                          onChange={(value) => updatePatient(patientIndex, 'tipoDocumentoIdentificacion', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('referenceData.documentTypes')}
                          disabled={documentTypeOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.documentNumber')}</Label>
                        <Input value={patient.numDocumentoIdentificacion} onChange={(e) => updatePatient(patientIndex, 'numDocumentoIdentificacion', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.userType')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-usertype`}
                          value={patient.tipoUsuario ?? ''}
                          selectedOption={userTypeReferenceOptions.find((o) => o.value === patient.tipoUsuario) ?? null}
                          options={userTypeReferenceOptions}
                          onChange={(value) => updatePatient(patientIndex, 'tipoUsuario', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('ripsWizard.userType')}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                    </div>

                    {/* Row 2: Birth Date, Gender, Disability */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.birthDate')}</Label>
                        <Input type="date" value={patient.fechaNacimiento} onChange={(e) => updatePatient(patientIndex, 'fechaNacimiento', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.gender')}</Label>
                        <Select value={patient.codSexo ?? ''} onValueChange={(v) => updatePatient(patientIndex, 'codSexo', v)}>
                          <SelectTrigger><SelectValue placeholder={t('ripsWizard.selectOption')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">M - Masculino</SelectItem>
                            <SelectItem value="F">F - Femenino</SelectItem>
                            <SelectItem value="I">I - Indeterminado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.disability')}</Label>
                        <Select value={patient.incapacidad ?? ''} onValueChange={(v) => updatePatient(patientIndex, 'incapacidad', v)}>
                          <SelectTrigger><SelectValue placeholder={t('ripsWizard.selectOption')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NO">No</SelectItem>
                            <SelectItem value="01">01 - Discapacidad física</SelectItem>
                            <SelectItem value="02">02 - Discapacidad intelectual</SelectItem>
                            <SelectItem value="03">03 - Discapacidad auditiva</SelectItem>
                            <SelectItem value="04">04 - Discapacidad visual</SelectItem>
                            <SelectItem value="05">05 - Discapacidad mental</SelectItem>
                            <SelectItem value="06">06 - Discapacidad múltiple</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 3: Country Residence, Country Origin */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.countryResidence')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-country-residence`}
                          value={patient.codPaisResidencia ?? ''}
                          selectedOption={paisesOptions.find((o) => o.value === patient.codPaisResidencia) ?? null}
                          options={paisesOptions}
                          onChange={(value) => updatePatient(patientIndex, 'codPaisResidencia', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('ripsWizard.countryResidence')}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.countryOrigin')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-country-origin`}
                          value={patient.codPaisOrigen ?? ''}
                          selectedOption={paisesOptions.find((o) => o.value === patient.codPaisOrigen) ?? null}
                          options={paisesOptions}
                          onChange={(value) => updatePatient(patientIndex, 'codPaisOrigen', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('ripsWizard.countryOrigin')}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                    </div>

                    {/* Row 4: Municipality Residence, Territorial Zone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.municipalityResidence')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-municipality`}
                          value={patient.codMunicipioResidencia ?? ''}
                          selectedOption={municipiosOptions.find((o) => o.value === patient.codMunicipioResidencia) ?? null}
                          options={municipiosOptions}
                          onChange={(value) => updatePatient(patientIndex, 'codMunicipioResidencia', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('ripsWizard.municipalityResidence')}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ripsWizard.territorialZone')}</Label>
                        <ReferenceCombobox
                          id={`patient-${patientIndex}-zone`}
                          value={patient.codZonaTerritorialResidencia ?? ''}
                          selectedOption={zonaTerritorialOptions.find((o) => o.value === patient.codZonaTerritorialResidencia) ?? null}
                          options={zonaTerritorialOptions}
                          onChange={(value) => updatePatient(patientIndex, 'codZonaTerritorialResidencia', value)}
                          placeholder={t('ripsWizard.selectOption')}
                          tableLabel={t('ripsWizard.territorialZone')}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold">{t('ripsWizard.addServices')}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Plus className="w-3 h-3 mr-1" />{t('ripsWizard.addServices')}</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            {SERVICE_CATEGORIES.map(({ slug, value, labelKey }, index) => {
                              const savedItems = serviceOptions[value] ?? []
                              return (
                                <div key={slug}>
                                  <DropdownMenuLabel>{t(labelKey)}</DropdownMenuLabel>
                                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); addServiceToPatient(patientIndex, slug) }}>
                                    {t(WIZARD_LABEL_KEYS[slug].add)}
                                  </DropdownMenuItem>
                                  {savedItems.length > 0 ? savedItems.map((service) => (
                                    <DropdownMenuItem
                                      key={service.id}
                                      onSelect={(e) => { e.preventDefault(); void addSavedServiceToPatient(patientIndex, value, service.id) }}
                                      disabled={loadingServiceId === service.id}
                                    >
                                      {loadingServiceId === service.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                      {service.name}
                                    </DropdownMenuItem>
                                  )) : (
                                    <DropdownMenuItem disabled>{servicesLoading ? t('ripsWizard.savedServicesLoading') : t('ripsWizard.noSavedServices')}</DropdownMenuItem>
                                  )}
                                  {index < SERVICE_CATEGORIES.length - 1 && <DropdownMenuSeparator />}
                                </div>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-4">
                        {SERVICE_CATEGORIES.map(({ slug, value, labelKey }) => {
                          const serviceList = patient.servicios[slug] ?? []
                          if (serviceList.length === 0) return null
                          const fieldConfigs = CATEGORY_FIELDS[value]
                          return (
                            <div key={slug} className="space-y-2">
                              <Badge variant="secondary">{t(labelKey)} ({serviceList.length})</Badge>
                              {serviceList.map((service, svcIdx) => (
                                <Card key={service.id} className="bg-muted/30">
                                  <CardContent className="pt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Badge variant="outline">#{svcIdx + 1}</Badge>
                                      <Button variant="ghost" size="sm" onClick={() => removeServiceFromPatient(patientIndex, slug, service.id)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      {fieldConfigs.map((field) => {
                                        const rawValue = service.payload[field.key]
                                        let value = ''
                                        if (field.type === 'number') value = rawValue === null || rawValue === undefined ? '' : String(rawValue)
                                        else if (typeof rawValue === 'string') value = rawValue
                                        const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'

                                        if (field.referenceTable) {
                                          const refOptions = referenceOptionsByTable[field.referenceTable] ?? []
                                          const selectedOpt = refOptions.find((o) => o.value === String(rawValue ?? '')) ?? null
                                          return (
                                            <div key={field.key} className="space-y-1">
                                              <Label className="text-xs">{t(`servicesManager.form.fields.${field.key}`)}</Label>
                                              <ReferenceCombobox
                                                id={`svc-${service.id}-${field.key}`}
                                                value={String(rawValue ?? '')}
                                                selectedOption={selectedOpt}
                                                options={refOptions}
                                                onChange={(v) => handleServiceFieldChange(patientIndex, slug, service.id, field, v)}
                                                placeholder={t('common.selectOption')}
                                                tableLabel={t(referenceTableDefinitions[field.referenceTable].labelKey)}
                                                disabled={refOptions.length === 0}
                                                maxResults={MAX_REFERENCE_RESULTS}
                                                messages={referenceComboboxMessages}
                                              />
                                            </div>
                                          )
                                        }
                                        return (
                                          <div key={field.key} className="space-y-1">
                                            <Label className="text-xs">{t(`servicesManager.form.fields.${field.key}`)}</Label>
                                            <Input
                                              type={inputType}
                                              value={value}
                                              step={field.type === 'number' ? 'any' : undefined}
                                              onChange={(e) => handleServiceFieldChange(patientIndex, slug, service.id, field, e.target.value)}
                                            />
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setCurrentStep('config')}>
            <ArrowLeft className="w-4 h-4 mr-2" />{t('ripsWizard.previous')}
          </Button>
          <Button onClick={() => setCurrentStep('review')} disabled={patients.length === 0}>
            {t('ripsWizard.next')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Step 3: Review and Submit
  const renderReviewStep = () => {
    const selectedClient = clients.find((c) => c.id === selectedClientId)
    const selectedLocation = locations.find((l) => l.id === selectedLocationId)
    const selectedResolution = resolutions.find((r) => r.id === selectedResolutionId)
    const totalServices = patients.reduce((sum, p) => sum + countPatientServices(p.servicios), 0)
    const totalAmount = patients.reduce((sum, p) => sum + computePatientServiceTotal(p.servicios), 0)

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('ripsWizard.review')}</CardTitle>
          <CardDescription>{t('ripsWizard.reviewDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('ripsWizard.submitSuccess')}</h3>
              <p className="text-muted-foreground mb-4">{t('ripsWizard.draftQueued')}</p>
              {draftId && <p className="text-sm">Draft ID: {draftId}</p>}
              <Button onClick={resetWizard} className="mt-4">{t('ripsWizard.createNewRips')}</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.client')}</Label>
                  <p className="font-semibold">{selectedClient?.displayName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.location')}</Label>
                  <p className="font-semibold">{selectedLocation?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.resolution')}</Label>
                  <p className="font-semibold">{selectedResolution?.prefix} - {selectedResolution?.resolutionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.totalAmount')}</Label>
                  <p className="font-semibold">${totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.totalPatients')}</Label>
                  <p className="font-semibold">{patients.length}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('ripsWizard.totalServices')}</Label>
                  <p className="font-semibold">{totalServices}</p>
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {patients.map((patient, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <p className="font-semibold">{patient.tipoDocumentoIdentificacion} {patient.numDocumentoIdentificacion}</p>
                        <div className="flex gap-2 mt-1">
                          {SERVICE_CATEGORIES.map(({ slug }) => {
                            const count = patient.servicios[slug]?.length ?? 0
                            if (count === 0) return null
                            return <Badge key={slug} variant="secondary">{count} {t(WIZARD_LABEL_KEYS[slug].singular)}</Badge>
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('patients')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />{t('ripsWizard.previous')}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('ripsWizard.submitting')}</>
                  ) : (
                    t('ripsWizard.submitInvoiceAndRips')
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('ripsWizard.title')}</CardTitle>
            <CardDescription>{t('companyPage.emptyWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('ripsWizard.title')}</h1>
        <p className="text-muted-foreground">{t('ripsWizard.unifiedDescription')}</p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {renderStepIndicator()}

      {currentStep === 'config' && renderConfigStep()}
      {currentStep === 'patients' && renderPatientsStep()}
      {currentStep === 'review' && renderReviewStep()}
    </div>
  )
}
