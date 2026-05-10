import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, Loader2, Save, AlertTriangle } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReferenceCombobox, type ReferenceComboboxMessages } from '@/components/reference/ReferenceCombobox'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { useReferenceTableRecords } from '@/context/useReferenceData'
import { toast } from 'sonner'
import type {
  RipsAdminApplicationDTOsServiciosDto,
  RipsAdminApplicationDTOsTenantServiceSummaryDto,
  RipsAdminApplicationDTOsTenantServiceDetailsDto,
  RipsAdminApplicationDTOsUsuarioDto,
} from '@/api'
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

type ServicesDtoKey = keyof RipsAdminApplicationDTOsServiciosDto

interface PatientServiceInstance {
  id: string
  payload: Record<string, unknown>
  sourceServiceId?: string
}

type PatientServicesState = Record<CategorySlug, PatientServiceInstance[]>

interface PatientFormData {
  tipoDocumentoIdentificacion: string
  numDocumentoIdentificacion: string
  tipoUsuario?: string | null
  fechaNacimiento: string
  codSexo: string
  codPaisResidencia?: string | null
  codPaisOrigen?: string | null
  codMunicipioResidencia?: string | null
  codZonaTerritorialResidencia?: string | null
  incapacidad: string
  consecutivo?: number
  servicios: PatientServicesState
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

interface InvoiceHeaderInfo {
  invoiceNumber?: string | null
  clientName?: string
  totalAmount?: number
  status?: string
  statusMessage?: string | null
  createdAt?: string
}

const MAX_REFERENCE_RESULTS = 50

const SERVICE_CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([slug, config]) => ({
  slug: slug as CategorySlug,
  ...config,
}))

const SERVICE_DTO_KEYS: Record<CategorySlug, ServicesDtoKey> = {
  consultas: 'consultas',
  procedimientos: 'procedimientos',
  urgencias: 'urgencias',
  hospitalizacion: 'hospitalizacion',
  'recien-nacidos': 'recienNacidos',
  medicamentos: 'medicamentos',
  'otros-servicios': 'otrosServicios',
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

// Normalize service payload to camelCase keys for consistent handling
const normalizeServicePayloadCase = (payload: Record<string, unknown>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    // Convert PascalCase to camelCase
    const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1)
    normalized[normalizedKey] = value
  }
  return normalized
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

export function RipsCorrection() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? ''
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

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
  const { records: zonaTerritorialRecords } = useReferenceTableRecords('zonaTerritorial')
  const { records: paisesRecords } = useReferenceTableRecords('paises')
  const { records: municipiosRecords } = useReferenceTableRecords('municipios')
  const { records: healthTypeUserRecords } = useReferenceTableRecords('healthTypeUsers')

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headerInfo, setHeaderInfo] = useState<InvoiceHeaderInfo>({})
  const [patients, setPatients] = useState<PatientFormData[]>([])
  const [serviceOptions, setServiceOptions] = useState<Partial<Record<ServiceCategoryValue, SavedServiceOption[]>>>({})
  const [servicesLoading, setServicesLoading] = useState(false)
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null)

  // Reference options
  const documentTypeOptions = useMemo<ReferenceOption[]>(() => {
    if (!documentTypeRecords) return []
    return buildReferenceOptions('documentTypes', documentTypeRecords)
  }, [documentTypeRecords])

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

  // Load invoice draft data
  useEffect(() => {
    if (!invoiceId || !workspaceId || !apiClient) return

    const loadDraft = async () => {
      setLoading(true)
      try {
        const response = await apiClient.ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint(workspaceId, invoiceId)
        const draft = response.data
        
        if (draft) {
          setHeaderInfo({
            invoiceNumber: draft.assignedInvoiceNumber,
            clientName: draft.clientName,
            totalAmount: draft.totalAmount,
            status: draft.status,
            statusMessage: draft.statusMessage,
            createdAt: draft.createdAt,
          })
          
          // Prefer ripsPayloadJson from draft if available, otherwise fallback to dispatch history
          let ripsPayloadStr: string | null = null
          if (draft.ripsPayloadJson) {
            ripsPayloadStr = draft.ripsPayloadJson
          } else {
            const lastAttempt = draft.ripsDispatchHistory?.[draft.ripsDispatchHistory.length - 1]
            ripsPayloadStr = lastAttempt?.requestPayload ?? null
          }
          
          if (ripsPayloadStr) {
            const ripsPayload: unknown = JSON.parse(ripsPayloadStr)
            
            // Handle both lowercase and PascalCase property names from API
            const ripsPayloadRecord = isRecord(ripsPayload) ? ripsPayload : null
            const ripsNode = ripsPayloadRecord ? (ripsPayloadRecord.Rips ?? ripsPayloadRecord.rips) : null
            const ripsNodeRecord = isRecord(ripsNode) ? ripsNode : null
            const usuarios = ripsNodeRecord ? (ripsNodeRecord.Usuarios ?? ripsNodeRecord.usuarios) : null
            
            if (Array.isArray(usuarios)) {
              const loadedPatients: PatientFormData[] = usuarios.map((u, idx: number) => {
                const uRecord = isRecord(u) ? u : {}
                const servicesState = createEmptyServicesState()
                
                // Handle both PascalCase and camelCase property names
                const servicios = uRecord.Servicios ?? uRecord.servicios
                const serviciosRecord = isRecord(servicios) ? servicios : null
                Object.entries(SERVICE_DTO_KEYS).forEach(([slug, dtoKey]) => {
                  // Try both cases for service category key
                  const pascalKey = dtoKey.charAt(0).toUpperCase() + dtoKey.slice(1)
                  const serviceList = serviciosRecord?.[dtoKey] ?? serviciosRecord?.[pascalKey]
                  if (Array.isArray(serviceList)) {
                    servicesState[slug as CategorySlug] = serviceList.map((svc) => ({
                      id: generateServiceInstanceId(),
                      payload: normalizeServicePayloadCase(isRecord(svc) ? svc : {})
                    }))
                  }
                })
                
                return {
                  tipoDocumentoIdentificacion: String(uRecord.TipoDocumentoIdentificacion ?? uRecord.tipoDocumentoIdentificacion ?? ''),
                  numDocumentoIdentificacion: String(uRecord.NumDocumentoIdentificacion ?? uRecord.numDocumentoIdentificacion ?? ''),
                  tipoUsuario: String(uRecord.TipoUsuario ?? uRecord.tipoUsuario ?? ''),
                  fechaNacimiento: String(uRecord.FechaNacimiento ?? uRecord.fechaNacimiento ?? ''),
                  codSexo: String(uRecord.CodSexo ?? uRecord.codSexo ?? ''),
                  codPaisResidencia: String(uRecord.CodPaisResidencia ?? uRecord.codPaisResidencia ?? '170'),
                  codPaisOrigen: String(uRecord.CodPaisOrigen ?? uRecord.codPaisOrigen ?? '170'),
                  codMunicipioResidencia: String(uRecord.CodMunicipioResidencia ?? uRecord.codMunicipioResidencia ?? ''),
                  codZonaTerritorialResidencia: String(uRecord.CodZonaTerritorialResidencia ?? uRecord.codZonaTerritorialResidencia ?? ''),
                  incapacidad: String(uRecord.Incapacidad ?? uRecord.incapacidad ?? 'NO'),
                  consecutivo: Number(uRecord.Consecutivo ?? uRecord.consecutivo ?? idx + 1),
                  servicios: servicesState,
                }
              })
              setPatients(loadedPatients)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load draft', err)
        setError(t('ripsCorrection.loadError'))
      } finally {
        setLoading(false)
      }
    }
    
    loadDraft()
  }, [invoiceId, apiClient, t, workspaceId])

  // Load saved services
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
    if (workspaceId) loadServiceOptions()
  }, [workspaceId, loadServiceOptions])

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
      incapacidad: 'NO',
      consecutivo: patients.length + 1,
      servicios: createEmptyServicesState(),
    }
    setPatients((prev) => [...prev, newPatient])
  }

  const removePatient = (index: number) => {
    setPatients((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePatient = <K extends keyof PatientFormData>(index: number, field: K, value: PatientFormData[K]) => {
    setPatients((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  // Service management
  const addServiceToPatient = (patientIndex: number, categorySlug: CategorySlug) => {
    const categoryConfig = CATEGORY_CONFIG[categorySlug]
    const defaultPayload = normalizePayload(categoryConfig.value, {})
    const newService: PatientServiceInstance = {
      id: generateServiceInstanceId(),
      payload: defaultPayload,
    }
    setPatients((prev) =>
      prev.map((p, i) => {
        if (i !== patientIndex) return p
        return {
          ...p,
          servicios: {
            ...p.servicios,
            [categorySlug]: [...(p.servicios[categorySlug] ?? []), newService],
          },
        }
      }),
    )
  }

  const addSavedServiceToPatient = async (patientIndex: number, categoryValue: ServiceCategoryValue, serviceId: string) => {
    setLoadingServiceId(serviceId)
    try {
      const response = await apiClient.ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint(workspaceId, serviceId)
      const serviceDetail = response.data as RipsAdminApplicationDTOsTenantServiceDetailsDto | undefined
      if (!serviceDetail?.payload) return
      const payload = normalizePayload(categoryValue, serviceDetail.payload as Record<string, unknown>)
      const categorySlug = SERVICE_CATEGORIES.find((c) => c.value === categoryValue)?.slug
      if (!categorySlug) return
      const newInstance: PatientServiceInstance = {
        id: generateServiceInstanceId(),
        payload,
        sourceServiceId: serviceId,
      }
      setPatients((prev) =>
        prev.map((p, i) => {
          if (i !== patientIndex) return p
          return {
            ...p,
            servicios: {
              ...p.servicios,
              [categorySlug]: [...(p.servicios[categorySlug] ?? []), newInstance],
            },
          }
        }),
      )
    } finally {
      setLoadingServiceId(null)
    }
  }

  const removeServiceFromPatient = (patientIndex: number, categorySlug: CategorySlug, serviceId: string) => {
    setPatients((prev) =>
      prev.map((p, i) => {
        if (i !== patientIndex) return p
        return {
          ...p,
          servicios: {
            ...p.servicios,
            [categorySlug]: (p.servicios[categorySlug] ?? []).filter((s) => s.id !== serviceId),
          },
        }
      }),
    )
  }

  const handleServiceFieldChange = (
    patientIndex: number,
    categorySlug: CategorySlug,
    serviceId: string,
    field: FieldConfig,
    rawValue: string,
  ) => {
    let value: unknown = rawValue
    if (field.type === 'number') {
      value = rawValue === '' ? null : Number(rawValue)
    }
    setPatients((prev) =>
      prev.map((p, i) => {
        if (i !== patientIndex) return p
        return {
          ...p,
          servicios: {
            ...p.servicios,
            [categorySlug]: (p.servicios[categorySlug] ?? []).map((s) =>
              s.id === serviceId ? { ...s, payload: { ...s.payload, [field.key]: value } } : s,
            ),
          },
        }
      }),
    )
  }

  // Build servicios payload for a patient
  const buildServiciosPayload = (services: PatientServicesState): RipsAdminApplicationDTOsServiciosDto => {
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
        // Set consecutivo if not already set
        if (!basePayload.consecutivo || Number(basePayload.consecutivo) <= 0) {
          basePayload.consecutivo = index + 1
        }
        return serializePayload(value, basePayload)
      })
      ;(result as Record<string, unknown>)[dtoKey] = serialized
    })
    return result as RipsAdminApplicationDTOsServiciosDto
  }

  // Submit correction
  const handleSubmit = async () => {
    if (!invoiceId || !workspaceId) return
    
      setSubmitting(true)
    try {
      // Build usuarios payload
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
          servicios: buildServiciosPayload(patient.servicios),
        } as unknown as RipsAdminApplicationDTOsUsuarioDto
      })

      await apiClient.updateInvoiceDraftRips(
        workspaceId,
        invoiceId,
        { usuarios: usuariosPayload }
      )
      
      toast.success(t('ripsCorrection.submitSuccess'))
      navigate(`/accounting/invoices/${invoiceId}`)
    } catch (err) {
      console.error('Failed to submit correction', err)
      toast.error(t('ripsCorrection.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('ripsCorrection.title')}</CardTitle>
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

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/accounting/invoices/${invoiceId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('invoiceDetails.backToList')}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/accounting/invoices/${invoiceId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('ripsCorrection.title')}</h1>
          <p className="text-muted-foreground">{t('ripsCorrection.description')}</p>
        </div>
      </div>

      {/* Read-only Invoice Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('ripsCorrection.invoiceInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">{t('invoiceDetails.invoiceNumber')}</Label>
              <p className="font-medium">{headerInfo.invoiceNumber ?? t('invoiceDetails.pendingNumber')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{t('ripsWizard.client')}</Label>
              <p className="font-medium">{headerInfo.clientName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{t('ripsWizard.totalAmount')}</Label>
              <p className="font-medium">${headerInfo.totalAmount?.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{t('invoiceDetails.statusMessage')}</Label>
              <Badge variant="destructive">{headerInfo.status}</Badge>
            </div>
          </div>
          {headerInfo.statusMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{headerInfo.statusMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Patients Editor */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('ripsWizard.patients')}</CardTitle>
              <CardDescription>{t('ripsCorrection.patientsDescription')}</CardDescription>
            </div>
            <Button onClick={addPatient}>
              <Plus className="w-4 h-4 mr-2" />
              {t('ripsWizard.addPatient')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('ripsWizard.noPatients')}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {patients.map((patient, patientIndex) => (
                  <Card key={patientIndex}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {t('ripsWizard.patient')} #{patientIndex + 1}
                          {patient.numDocumentoIdentificacion && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              ({patient.tipoDocumentoIdentificacion} {patient.numDocumentoIdentificacion})
                            </span>
                          )}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => removePatient(patientIndex)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                      {/* Services */}
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/accounting/invoices/${invoiceId}`)}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || patients.length === 0}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />{t('ripsCorrection.submit')}</>
          )}
        </Button>
      </div>
    </div>
  )
}
