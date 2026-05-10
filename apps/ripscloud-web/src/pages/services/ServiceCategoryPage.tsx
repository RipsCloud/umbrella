import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ReferenceCombobox, type ReferenceComboboxMessages } from '@/components/reference/ReferenceCombobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { useAuth } from '@/context/useAuth'
import { useApiClient } from '@/context/ApiClientContext'
import { useReferenceData, useReferenceTableRecords } from '@/context/useReferenceData'

import type {
  RipsAdminApplicationDTOsCreateTenantServiceRequestDto,
  RipsAdminApplicationDTOsTenantServiceDetailsDto,
  RipsAdminApplicationDTOsTenantServiceSummaryDto,
  RipsAdminApplicationDTOsUpdateTenantServiceRequestDto,
} from '@/api'
import {
  CATEGORY_CONFIG,
  CATEGORY_FIELDS,
  CALCULATED_FIELD_KEYS,
  getDefaultPayload,
  isCategorySlug,
  normalizePayload,
  serializePayload,
} from '@/lib/rips/serviceCategories'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption, ReferenceTableName } from '@/lib/reference-data/types'
import type {
  CategorySlug,
  FieldConfig,
  ServiceCategoryValue,
} from '@/lib/rips/serviceCategories'

interface TenantServiceSummary {
  id: string
  tenantId: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string | null
}

interface TenantServiceFormState {
  id?: string
  name: string
  description: string
  isActive: boolean
  payload: Record<string, unknown>
}

const DEFAULT_CATEGORY: CategorySlug = 'consultas'
const DEFAULT_SHOW_INACTIVE = true

const formatDateTime = (value?: string | null): string => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const buildInitialFormState = (category: ServiceCategoryValue): TenantServiceFormState => ({
  id: undefined,
  name: '',
  description: '',
  isActive: true,
  payload: getDefaultPayload(category),
})

export function ServiceCategoryPage() {
  const { category: categoryParam } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()

  const workspaceId = currentWorkspace?.id ?? ''
  const api = apiClient

  const categorySlug = useMemo<CategorySlug>(() => {
    if (!categoryParam) return DEFAULT_CATEGORY
    const normalized = categoryParam.toLowerCase()
    if (isCategorySlug(normalized)) return normalized
    return DEFAULT_CATEGORY
  }, [categoryParam])

  useEffect(() => {
    if (!categoryParam || !isCategorySlug(categoryParam.toLowerCase())) {
      navigate(`/services/${DEFAULT_CATEGORY}`, { replace: true })
    }
  }, [categoryParam, navigate])

  const categoryConfig = CATEGORY_CONFIG[categorySlug]
  const categoryLabel = t(categoryConfig.labelKey)
  const fieldConfigs = CATEGORY_FIELDS[categoryConfig.value]
  const referenceTablesUsed = useMemo<ReferenceTableName[]>(() => {
    const tables = new Set<ReferenceTableName>()
    fieldConfigs.forEach((field) => {
      if (field.referenceTable) {
        tables.add(field.referenceTable)
      }
    })
    return Array.from(tables)
  }, [fieldConfigs])
  const usesServiceGroups = referenceTablesUsed.includes('serviceGroups')
  const usesProcedureCodes = referenceTablesUsed.includes('procedureCodes')
  const usesSexes = referenceTablesUsed.includes('sexes')
  const usesDocumentTypes = referenceTablesUsed.includes('documentTypes')
  const usesCareModalities = referenceTablesUsed.includes('careModalities')
  const usesCollectionConcepts = referenceTablesUsed.includes('collectionConcepts')
  const usesDiagnosisCodes = referenceTablesUsed.includes('diagnosisCodes')
  const usesConsultationPurposes = referenceTablesUsed.includes('consultationPurposes')
  const usesServiceCodes = referenceTablesUsed.includes('serviceCodes')
  const usesEntryRoutes = referenceTablesUsed.includes('entryRoutes')
  const usesExternalCauses = referenceTablesUsed.includes('externalCauses')
  const usesDiagnosisTypes = referenceTablesUsed.includes('diagnosisTypes')
  const usesMedicationTypes = referenceTablesUsed.includes('medicationTypes')

  const [services, setServices] = useState<TenantServiceSummary[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState<boolean>(DEFAULT_SHOW_INACTIVE)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [nameError, setNameError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [editingServiceId, setEditingServiceId] = useState<string | undefined>(undefined)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)

  const [formState, setFormState] = useState<TenantServiceFormState>(() =>
    buildInitialFormState(categoryConfig.value),
  )
  const {
    status: referenceSyncStatus,
    progress: referenceSyncProgress,
    activeTable: referenceActiveTable,
    errors: referenceSyncErrors,
  } = useReferenceData()
  const { records: serviceGroupRecords, error: serviceGroupsLoadingError } =
    useReferenceTableRecords('serviceGroups', { enabled: usesServiceGroups })
  const { records: procedureCodeRecords, error: procedureCodesLoadingError } =
    useReferenceTableRecords('procedureCodes', { enabled: usesProcedureCodes })
  const { records: sexRecords, error: sexLoadingError } = useReferenceTableRecords('sexes', {
    enabled: usesSexes,
  })
  const { records: documentTypeRecords, error: documentTypesError } = useReferenceTableRecords(
    'documentTypes',
    { enabled: usesDocumentTypes },
  )
  const { records: careModalityRecords, error: careModalitiesError } = useReferenceTableRecords(
    'careModalities',
    { enabled: usesCareModalities },
  )
  const { records: collectionConceptRecords, error: collectionConceptError } =
    useReferenceTableRecords('collectionConcepts', { enabled: usesCollectionConcepts })
  const { records: diagnosisRecords, error: diagnosisCodesError } = useReferenceTableRecords(
    'diagnosisCodes',
    { enabled: usesDiagnosisCodes },
  )
  const {
    records: consultationPurposeRecords,
    error: consultationPurposeError,
  } = useReferenceTableRecords('consultationPurposes', { enabled: usesConsultationPurposes })
  const { records: serviceCodeRecords, error: serviceCodesError } = useReferenceTableRecords(
    'serviceCodes',
    { enabled: usesServiceCodes },
  )
  const { records: entryRouteRecords, error: entryRoutesError } = useReferenceTableRecords(
    'entryRoutes',
    { enabled: usesEntryRoutes },
  )
  const { records: externalCauseRecords, error: externalCausesError } = useReferenceTableRecords(
    'externalCauses',
    { enabled: usesExternalCauses },
  )
  const { records: diagnosisTypeRecords, error: diagnosisTypesError } = useReferenceTableRecords(
    'diagnosisTypes',
    { enabled: usesDiagnosisTypes },
  )
  const { records: medicationTypeRecords, error: medicationTypesError } = useReferenceTableRecords(
    'medicationTypes',
    { enabled: usesMedicationTypes },
  )
  const serviceGroupDefinition = referenceTableDefinitions.serviceGroups
  const procedureCodeDefinition = referenceTableDefinitions.procedureCodes
  const sexDefinition = referenceTableDefinitions.sexes
  const documentTypeDefinition = referenceTableDefinitions.documentTypes
  const careModalityDefinition = referenceTableDefinitions.careModalities
  const collectionConceptDefinition = referenceTableDefinitions.collectionConcepts
  const diagnosisDefinition = referenceTableDefinitions.diagnosisCodes
  const consultationPurposeDefinition = referenceTableDefinitions.consultationPurposes
  const serviceCodeDefinition = referenceTableDefinitions.serviceCodes
  const entryRouteDefinition = referenceTableDefinitions.entryRoutes
  const externalCauseDefinition = referenceTableDefinitions.externalCauses
  const diagnosisTypeDefinition = referenceTableDefinitions.diagnosisTypes
  const medicationTypeDefinition = referenceTableDefinitions.medicationTypes
  const serviceGroupRecordsPrepared = useMemo(
    () => {
      if (!usesServiceGroups) {
        return []
      }
      return serviceGroupRecords
        .filter((group) => group.isEnabled)
        .sort((a, b) => a.code.localeCompare(b.code))
    },
    [serviceGroupRecords, usesServiceGroups],
  )
  const procedureCodeRecordsPrepared = useMemo(
    () => {
      if (!usesProcedureCodes) {
        return []
      }
      return procedureCodeRecords.filter((procedure) => procedure.isEnabled)
    },
    [procedureCodeRecords, usesProcedureCodes],
  )
  const sexRecordsPrepared = useMemo(
    () => {
      if (!usesSexes) {
        return []
      }
      return sexRecords.filter((sex) => sex.isEnabled)
    },
    [sexRecords, usesSexes],
  )
  const documentTypeRecordsPrepared = useMemo(
    () => {
      if (!usesDocumentTypes) {
        return []
      }
      return documentTypeRecords.filter((documentType) => documentType.isEnabled)
    },
    [documentTypeRecords, usesDocumentTypes],
  )
  const careModalityRecordsPrepared = useMemo(
    () => {
      if (!usesCareModalities) {
        return []
      }
      return careModalityRecords.filter((modality) => modality.isEnabled)
    },
    [careModalityRecords, usesCareModalities],
  )
  const collectionConceptRecordsPrepared = useMemo(
    () => {
      if (!usesCollectionConcepts) {
        return []
      }
      return collectionConceptRecords.filter((concept) => concept.isEnabled)
    },
    [collectionConceptRecords, usesCollectionConcepts],
  )
  const diagnosisRecordsPrepared = useMemo(
    () => {
      if (!usesDiagnosisCodes) {
        return []
      }
      return diagnosisRecords.filter((diagnosis) => diagnosis.isEnabled)
    },
    [diagnosisRecords, usesDiagnosisCodes],
  )
  const consultationPurposeRecordsPrepared = useMemo(
    () => {
      if (!usesConsultationPurposes) {
        return []
      }
      return consultationPurposeRecords.filter((purpose) => purpose.isEnabled)
    },
    [consultationPurposeRecords, usesConsultationPurposes],
  )
  const serviceCodeRecordsPrepared = useMemo(
    () => {
      if (!usesServiceCodes) {
        return []
      }
      return serviceCodeRecords.filter((code) => code.isEnabled)
    },
    [serviceCodeRecords, usesServiceCodes],
  )
  const entryRouteRecordsPrepared = useMemo(
    () => {
      if (!usesEntryRoutes) {
        return []
      }
      return entryRouteRecords.filter((route) => route.isEnabled)
    },
    [entryRouteRecords, usesEntryRoutes],
  )
  const externalCauseRecordsPrepared = useMemo(
    () => {
      if (!usesExternalCauses) {
        return []
      }
      return externalCauseRecords.filter((cause) => cause.isEnabled)
    },
    [externalCauseRecords, usesExternalCauses],
  )
  const diagnosisTypeRecordsPrepared = useMemo(
    () => {
      if (!usesDiagnosisTypes) {
        return []
      }
      return diagnosisTypeRecords.filter((type) => type.isEnabled)
    },
    [diagnosisTypeRecords, usesDiagnosisTypes],
  )
  const medicationTypeRecordsPrepared = useMemo(
    () => {
      if (!usesMedicationTypes) {
        return []
      }
      return medicationTypeRecords.filter((type) => type.isEnabled)
    },
    [medicationTypeRecords, usesMedicationTypes],
  )
  const serviceGroupReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      serviceGroupRecordsPrepared.map((group) =>
        serviceGroupDefinition.toOption
          ? serviceGroupDefinition.toOption(group)
          : {
              value: group.code,
              label: `${group.code} · ${group.name}`,
              description: group.description ?? null,
              searchText: `${group.code} ${group.name} ${group.description ?? ''}`.toLowerCase(),
            },
      ),
    [serviceGroupDefinition, serviceGroupRecordsPrepared],
  )
  const procedureCodeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      procedureCodeRecordsPrepared.map((procedure) =>
        procedureCodeDefinition.toOption
          ? procedureCodeDefinition.toOption(procedure)
          : {
              value: procedure.code,
              label: `${procedure.code} · ${procedure.name}`,
              description: procedure.section ?? null,
              searchText: [procedure.code, procedure.name, procedure.section ?? '', procedure.tags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [procedureCodeDefinition, procedureCodeRecordsPrepared],
  )
  const sexReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      sexRecordsPrepared.map((sex) =>
        sexDefinition.toOption
          ? sexDefinition.toOption(sex)
          : {
              value: sex.code,
              label: `${sex.code} · ${sex.name}`,
              description: sex.description ?? null,
              searchText: [sex.code, sex.name, sex.description ?? '', sex.numericCode ?? '', sex.categoryCode ?? '', sex.letterCode ?? '']
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [sexDefinition, sexRecordsPrepared],
  )
  const documentTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      documentTypeRecordsPrepared.map((documentType) =>
        documentTypeDefinition.toOption
          ? documentTypeDefinition.toOption(documentType)
          : {
              value: documentType.code,
              label: `${documentType.code} · ${documentType.name}`,
              description: documentType.description ?? null,
              searchText: [documentType.code, documentType.name, documentType.description ?? '']
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [documentTypeDefinition, documentTypeRecordsPrepared],
  )
  const careModalityReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      careModalityRecordsPrepared.map((modality) =>
        careModalityDefinition.toOption
          ? careModalityDefinition.toOption(modality)
          : {
              value: modality.code,
              label: `${modality.code} · ${modality.name}`,
              description: modality.description ?? null,
              searchText: [modality.code, modality.name, modality.description ?? '', modality.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [careModalityDefinition, careModalityRecordsPrepared],
  )
  const collectionConceptReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      collectionConceptRecordsPrepared.map((concept) =>
        collectionConceptDefinition.toOption
          ? collectionConceptDefinition.toOption(concept)
          : {
              value: concept.code,
              label: `${concept.code} · ${concept.name}`,
              description: concept.description ?? null,
              searchText: [concept.code, concept.name, concept.description ?? '', concept.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [collectionConceptDefinition, collectionConceptRecordsPrepared],
  )
  const diagnosisReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      diagnosisRecordsPrepared.map((diagnosis) =>
        diagnosisDefinition.toOption
          ? diagnosisDefinition.toOption(diagnosis)
          : {
              value: diagnosis.cieCode,
              label: `${diagnosis.cieCode} · ${diagnosis.name}`,
              description: diagnosis.description ?? null,
              searchText: [
                diagnosis.cieCode,
                diagnosis.code,
                diagnosis.name,
                diagnosis.description ?? '',
                diagnosis.year ?? '',
                diagnosis.tags.join(' '),
              ]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [diagnosisDefinition, diagnosisRecordsPrepared],
  )
  const consultationPurposeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      consultationPurposeRecordsPrepared.map((purpose) =>
        consultationPurposeDefinition.toOption
          ? consultationPurposeDefinition.toOption(purpose)
          : {
              value: purpose.code,
              label: `${purpose.code} · ${purpose.name}`,
              description: purpose.description ?? null,
              searchText: [purpose.code, purpose.name, purpose.description ?? '', purpose.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [consultationPurposeDefinition, consultationPurposeRecordsPrepared],
  )
  const serviceCodeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      serviceCodeRecordsPrepared.map((service) =>
        serviceCodeDefinition.toOption
          ? serviceCodeDefinition.toOption(service)
          : {
              value: service.code,
              label: `${service.code} · ${service.name}`,
              description: service.category ?? null,
              searchText: [service.code, service.name, service.category ?? '', service.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [serviceCodeDefinition, serviceCodeRecordsPrepared],
  )
  const entryRouteReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      entryRouteRecordsPrepared.map((route) =>
        entryRouteDefinition.toOption
          ? entryRouteDefinition.toOption(route)
          : {
              value: route.code,
              label: `${route.code} · ${route.name}`,
              description: route.description ?? null,
              searchText: [route.code, route.name, route.description ?? '', route.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [entryRouteDefinition, entryRouteRecordsPrepared],
  )
  const externalCauseReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      externalCauseRecordsPrepared.map((cause) =>
        externalCauseDefinition.toOption
          ? externalCauseDefinition.toOption(cause)
          : {
              value: cause.code,
              label: `${cause.code} · ${cause.name}`,
              description: cause.description ?? null,
              searchText: [cause.code, cause.name, cause.description ?? '', cause.flags.join(' ')]
                .join(' ')
                .trim()
                .toLowerCase(),
            },
      ),
    [externalCauseDefinition, externalCauseRecordsPrepared],
  )
  const diagnosisTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      diagnosisTypeRecordsPrepared.map((type) =>
        diagnosisTypeDefinition.toOption
          ? diagnosisTypeDefinition.toOption(type)
          : {
              value: type.code,
              label: `${type.code} · ${type.name}`,
              description: type.description ?? null,
              searchText: [type.code, type.name, type.description ?? ''].join(' ').trim().toLowerCase(),
            },
      ),
    [diagnosisTypeDefinition, diagnosisTypeRecordsPrepared],
  )
  const medicationTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      medicationTypeRecordsPrepared.map((type) =>
        medicationTypeDefinition.toOption
          ? medicationTypeDefinition.toOption(type)
          : {
              value: type.code,
              label: `${type.code} · ${type.name}`,
              description: type.description ?? null,
              searchText: [type.code, type.name, type.description ?? ''].join(' ').trim().toLowerCase(),
            },
      ),
    [medicationTypeDefinition, medicationTypeRecordsPrepared],
  )
  const MAX_REFERENCE_RESULTS = 50
  const serviceGroupsLabel = t(serviceGroupDefinition.labelKey)
  const referenceComboboxMessages = useMemo<ReferenceComboboxMessages>(
    () => ({
      searchPlaceholder: t('referenceData.searchPlaceholder'),
      noResults: t('referenceData.noResultsDefault'),
      noResultsForQuery: (query: string) => t('referenceData.noResultsForQuery', { query }),
      resultsLimited: (count: number, total: number) =>
        t('referenceData.resultsLimited', { count, total }),
    }),
    [t],
  )
  const referenceOptionsByTable = useMemo<Partial<Record<ReferenceTableName, ReferenceOption[]>>>(
    () => ({
      serviceGroups: serviceGroupReferenceOptions,
      procedureCodes: procedureCodeReferenceOptions,
      sexes: sexReferenceOptions,
      documentTypes: documentTypeReferenceOptions,
      careModalities: careModalityReferenceOptions,
      collectionConcepts: collectionConceptReferenceOptions,
      diagnosisCodes: diagnosisReferenceOptions,
      consultationPurposes: consultationPurposeReferenceOptions,
      serviceCodes: serviceCodeReferenceOptions,
      entryRoutes: entryRouteReferenceOptions,
      externalCauses: externalCauseReferenceOptions,
      diagnosisTypes: diagnosisTypeReferenceOptions,
      medicationTypes: medicationTypeReferenceOptions,
    }),
    [
      entryRouteReferenceOptions,
      consultationPurposeReferenceOptions,
      externalCauseReferenceOptions,
      diagnosisTypeReferenceOptions,
      medicationTypeReferenceOptions,
      serviceCodeReferenceOptions,
      collectionConceptReferenceOptions,
      diagnosisReferenceOptions,
      procedureCodeReferenceOptions,
      serviceGroupReferenceOptions,
      documentTypeReferenceOptions,
      careModalityReferenceOptions,
      sexReferenceOptions,
    ],
  )
  const serviceGroupReferenceError =
    referenceSyncErrors?.serviceGroups ?? serviceGroupsLoadingError ?? null
  const procedureCodesReferenceError =
    referenceSyncErrors?.procedureCodes ?? procedureCodesLoadingError ?? null
  const sexReferenceError = referenceSyncErrors?.sexes ?? sexLoadingError ?? null
  const documentTypesReferenceError =
    referenceSyncErrors?.documentTypes ?? documentTypesError ?? null
  const careModalityReferenceError =
    referenceSyncErrors?.careModalities ?? careModalitiesError ?? null
  const collectionConceptReferenceError =
    referenceSyncErrors?.collectionConcepts ?? collectionConceptError ?? null
  const diagnosisReferenceError =
    referenceSyncErrors?.diagnosisCodes ?? diagnosisCodesError ?? null
  const consultationPurposeReferenceError =
    referenceSyncErrors?.consultationPurposes ?? consultationPurposeError ?? null
  const serviceCodesReferenceError =
    referenceSyncErrors?.serviceCodes ?? serviceCodesError ?? null
  const entryRoutesReferenceError = referenceSyncErrors?.entryRoutes ?? entryRoutesError ?? null
  const externalCausesReferenceError =
    referenceSyncErrors?.externalCauses ?? externalCausesError ?? null
  const diagnosisTypesReferenceError =
    referenceSyncErrors?.diagnosisTypes ?? diagnosisTypesError ?? null
  const medicationTypesReferenceError =
    referenceSyncErrors?.medicationTypes ?? medicationTypesError ?? null
  const referenceErrorByTable = useMemo<Partial<Record<ReferenceTableName, string | null>>>(
    () => ({
      serviceGroups: serviceGroupReferenceError,
      procedureCodes: procedureCodesReferenceError,
      sexes: sexReferenceError,
      documentTypes: documentTypesReferenceError,
      careModalities: careModalityReferenceError,
      collectionConcepts: collectionConceptReferenceError,
      diagnosisCodes: diagnosisReferenceError,
      consultationPurposes: consultationPurposeReferenceError,
      serviceCodes: serviceCodesReferenceError,
      entryRoutes: entryRoutesReferenceError,
      externalCauses: externalCausesReferenceError,
      diagnosisTypes: diagnosisTypesReferenceError,
      medicationTypes: medicationTypesReferenceError,
    }),
    [
      entryRoutesReferenceError,
      consultationPurposeReferenceError,
      externalCausesReferenceError,
      diagnosisTypesReferenceError,
      medicationTypesReferenceError,
      serviceCodesReferenceError,
      collectionConceptReferenceError,
      diagnosisReferenceError,
      procedureCodesReferenceError,
      serviceGroupReferenceError,
      documentTypesReferenceError,
      careModalityReferenceError,
      sexReferenceError,
    ],
  )
  const defaultReferenceTableLabel =
    referenceTablesUsed.length > 0
      ? t(referenceTableDefinitions[referenceTablesUsed[0]].labelKey)
      : serviceGroupsLabel
  const activeReferenceTableLabel = referenceActiveTable
    ? t(referenceTableDefinitions[referenceActiveTable].labelKey)
    : defaultReferenceTableLabel
  const referenceSyncPercent = Math.min(100, Math.max(0, Math.round(referenceSyncProgress * 100)))
  const referenceSyncErrorTable = referenceTablesUsed.find(
    (table) => referenceErrorByTable[table],
  )
  const resetForm = useCallback(() => {
    setFormState(buildInitialFormState(categoryConfig.value))
    setEditingServiceId(undefined)
    setFieldErrors({})
    setNameError(null)
    setError(null)
  }, [categoryConfig.value])

  const loadServices = useCallback(async () => {
    if (!workspaceId) return

    try {
      setLoading(true)
      setError(null)

      const response = await api.ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint(
        workspaceId,
        {
          params: {
            category: categoryConfig.value,
            includeInactive: showInactive,
          },
        },
      )

      const data =
        (response?.data as RipsAdminApplicationDTOsTenantServiceSummaryDto[] | undefined) ?? []

      const mapped = data
        .filter((item): item is RipsAdminApplicationDTOsTenantServiceSummaryDto & { id: string } =>
          Boolean(item?.id),
        )
        .map((item) => ({
          id: item.id!,
          tenantId: item.tenantId ?? workspaceId,
          name: item.name ?? '',
          description: item.description ?? null,
          isActive: item.isActive ?? true,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))

      setServices(mapped)
    } catch (err) {
      console.error('Failed to load tenant services', err)
      setError(t('servicesManager.notifications.loadError'))
    } finally {
      setLoading(false)
    }
  }, [api, categoryConfig.value, showInactive, t, workspaceId])

  useEffect(() => {
    resetForm()
  }, [categoryConfig.value, resetForm])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const openCreateDialog = () => {
    resetForm()
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = async (serviceId: string) => {
    if (!workspaceId) return

    try {
      setLoading(true)
      const response = await api.ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint(
        workspaceId,
        serviceId,
      )
      const details = response?.data as RipsAdminApplicationDTOsTenantServiceDetailsDto | undefined

      if (!details) {
        return
      }

      setFormState({
        id: details.id ?? serviceId,
        name: details.name ?? '',
        description: details.description ?? '',
        isActive: details.isActive ?? true,
        payload: normalizePayload(categoryConfig.value, details.payload),
      })
      setEditingServiceId(serviceId)
      setFieldErrors({})
      setNameError(null)
      setError(null)
      setDialogOpen(true)
    } catch (err) {
      console.error('Failed to load service details', err)
      setError(t('servicesManager.notifications.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handlePayloadFieldChange = (field: FieldConfig, rawValue: string) => {
    setFormState((prev) => {
      const nextPayload = { ...prev.payload }

      if (field.type === 'number') {
        if (rawValue === '') {
          nextPayload[field.key] = null
        } else {
          const numericValue = Number(rawValue)
          nextPayload[field.key] = Number.isNaN(numericValue) ? prev.payload[field.key] : numericValue
        }
      } else if (field.type === 'datetime') {
        nextPayload[field.key] = rawValue
      } else {
        nextPayload[field.key] = rawValue
      }

      return {
        ...prev,
        payload: nextPayload,
      }
    })

    setFieldErrors((prev) => {
      if (!prev[field.key]) {
        return prev
      }
      const next = { ...prev }
      delete next[field.key]
      return next
    })
  }

  const validatePayloadFields = (): boolean => {
    const nextErrors: Record<string, string> = {}

    fieldConfigs.forEach((field) => {
      const value = formState.payload[field.key]
      const isCalculated = CALCULATED_FIELD_KEYS.has(field.key)
      const isEmptyString = typeof value === 'string' && value.trim().length === 0
      const isEmpty = value === undefined || value === null || isEmptyString

      if (field.required && !isCalculated && isEmpty) {
        nextErrors[field.key] = t('servicesManager.form.errors.required')
        return
      }

      if (isEmpty) {
        return
      }

      if (field.type === 'number') {
        const numericValue = typeof value === 'number' ? value : Number(value)
        if (Number.isNaN(numericValue)) {
          nextErrors[field.key] = t('servicesManager.form.errors.number')
          return
        }

        if (field.min !== undefined && numericValue < field.min) {
          nextErrors[field.key] = t('servicesManager.form.errors.min', { min: field.min })
          return
        }

        if (field.max !== undefined && numericValue > field.max) {
          nextErrors[field.key] = t('servicesManager.form.errors.max', { max: field.max })
          return
        }

        return
      }

      const textValue = String(value)

      if (field.minLength !== undefined && textValue.length < field.minLength) {
        nextErrors[field.key] = t('servicesManager.form.errors.minLength', { min: field.minLength })
        return
      }

      if (field.maxLength !== undefined && textValue.length > field.maxLength) {
        nextErrors[field.key] = t('servicesManager.form.errors.maxLength', { max: field.maxLength })
        return
      }

      if (field.pattern && !field.pattern.test(textValue)) {
        nextErrors[field.key] = t('servicesManager.form.errors.pattern')
        return
      }

      if (field.type === 'datetime') {
        const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
        if (!datetimePattern.test(textValue)) {
          nextErrors[field.key] = t('servicesManager.form.errors.pattern')
        }
      }
    })

    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setError(t('servicesManager.form.validationError'))
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!workspaceId) return

    setError(null)
    setNameError(null)

    if (!formState.name.trim()) {
      setNameError(t('servicesManager.form.errors.required'))
      return
    }

    if (!validatePayloadFields()) {
      return
    }

    setIsSaving(true)
    setError(null)

    const requestPayload = {
      category: categoryConfig.value,
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      isActive: formState.isActive,
      payload: serializePayload(categoryConfig.value, formState.payload),
    }

    try {
      if (editingServiceId) {
        await api.ripsAdminPresentationEndpointsServicesUpdateTenantServiceEndpoint(
          workspaceId,
          editingServiceId,
          requestPayload as RipsAdminApplicationDTOsUpdateTenantServiceRequestDto,
        )
        setError(null)
      } else {
        await api.ripsAdminPresentationEndpointsServicesCreateTenantServiceEndpoint(
          workspaceId,
          requestPayload as RipsAdminApplicationDTOsCreateTenantServiceRequestDto,
        )
      }

      setDialogOpen(false)
      resetForm()
      await loadServices()
    } catch (err) {
      console.error('Failed to save tenant service', err)
      setError(t('servicesManager.notifications.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workspaceId || !deleteCandidateId) return

    try {
      await api.ripsAdminPresentationEndpointsServicesDeleteTenantServiceEndpoint(
        workspaceId,
        deleteCandidateId,
      )
      setDeleteCandidateId(null)
      await loadServices()
    } catch (err) {
      console.error('Failed to delete tenant service', err)
      setError(t('servicesManager.notifications.deleteError'))
    }
  }

  const hasServices = services.length > 0
  const shouldShowReferenceSyncBanner =
    referenceTablesUsed.length > 0 && referenceSyncStatus === 'syncing'
  const referenceSyncErrorLabel = referenceSyncErrorTable
    ? t(referenceTableDefinitions[referenceSyncErrorTable].labelKey)
    : defaultReferenceTableLabel
  const referenceSyncErrorMessage = referenceSyncErrorTable
    ? referenceErrorByTable[referenceSyncErrorTable]
    : null
  const shouldShowReferenceSyncError = Boolean(referenceSyncErrorTable)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('servicesManager.header.title', { category: categoryLabel })}
          </h1>
          <p className="text-muted-foreground">
            {t(categoryConfig.descriptionKey)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('servicesManager.actions.create')}
          </Button>
          <Button variant="outline" onClick={loadServices} size="sm" disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('servicesManager.actions.refresh')}
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="include-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
              aria-label={t('servicesManager.filters.showInactive')}
            />
            <Label htmlFor="include-inactive" className="text-sm text-muted-foreground">
              {t('servicesManager.filters.showInactive')}
            </Label>
          </div>
        </div>
      </div>

      {shouldShowReferenceSyncBanner ? (
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('referenceData.syncingTitle')}
          </AlertTitle>
          <AlertDescription>
            {t('referenceData.syncingDescription', {
              table: activeReferenceTableLabel,
              progress: referenceSyncPercent,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      {shouldShowReferenceSyncError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('referenceData.syncErrorTitle')}</AlertTitle>
          <AlertDescription>
            {t('referenceData.errors.loadTable', { table: referenceSyncErrorLabel })}
            {referenceSyncErrorMessage ? (
              <span className="block text-xs mt-1 text-muted-foreground">
                {referenceSyncErrorMessage}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('servicesManager.table.title')}</CardTitle>
          <CardDescription>{t('servicesManager.table.description', { category: categoryLabel })}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : hasServices ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('servicesManager.table.columns.name')}</TableHead>
                  <TableHead>{t('servicesManager.table.columns.description')}</TableHead>
                  <TableHead className="w-[120px] text-center">
                    {t('servicesManager.table.columns.status')}
                  </TableHead>
                  <TableHead>{t('servicesManager.table.columns.updatedAt')}</TableHead>
                  <TableHead className="w-[140px] text-right">
                    {t('servicesManager.table.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{service.name}</span>
                        {service.description ? (
                          <span className="text-xs text-muted-foreground">{service.description}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {service.description ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.isActive ? 'default' : 'outline'}>
                        {service.isActive
                          ? t('servicesManager.status.active')
                          : t('servicesManager.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(service.updatedAt ?? service.createdAt)}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(service.id)}
                        aria-label={t('servicesManager.actions.edit')}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('servicesManager.actions.delete')}
                            onClick={() => setDeleteCandidateId(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('servicesManager.dialogs.delete.title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('servicesManager.dialogs.delete.description', { name: service.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteCandidateId(null)}>
                              {t('servicesManager.dialogs.delete.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('servicesManager.dialogs.delete.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-lg font-medium">
                {t('servicesManager.empty.title', { category: categoryLabel })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('servicesManager.empty.description')}
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('servicesManager.actions.create')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl sm:max-h-[90vh] p-0">
          <div className="flex h-full max-h-[90vh] flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>
                {editingServiceId
                  ? t('servicesManager.dialogs.editTitle', { category: categoryLabel })
                  : t('servicesManager.dialogs.createTitle', { category: categoryLabel })}
              </DialogTitle>
              <DialogDescription>
                {t('servicesManager.dialogs.description', { category: categoryLabel })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="service-name">{t('servicesManager.form.name')}</Label>
                  <Input
                    id="service-name"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder={t('servicesManager.form.namePlaceholder')}
                  />
                  {nameError ? (
                    <p className="text-sm text-destructive">{nameError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-description">{t('servicesManager.form.description')}</Label>
                  <Textarea
                    id="service-description"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder={t('servicesManager.form.descriptionPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="service-active">
                      {t('servicesManager.form.isActive')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="service-active"
                        checked={formState.isActive}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({ ...prev, isActive: checked }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {t('servicesManager.form.isActiveDescription')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>{t('servicesManager.form.payload', { category: categoryLabel })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('servicesManager.form.payloadHelp', { category: categoryLabel })}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {fieldConfigs.map((field) => {
                      const fieldId = `service-field-${field.key}`
                      const rawValue = formState.payload[field.key]
                      const value =
                        field.type === 'number'
                          ? rawValue === null || rawValue === undefined
                            ? ''
                            : String(rawValue)
                          : typeof rawValue === 'string'
                            ? field.type === 'datetime'
                              ? rawValue.includes('T')
                                ? rawValue
                                : rawValue.replace(' ', 'T')
                              : rawValue
                            : ''
                      const inputType =
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'datetime'
                              ? 'datetime-local'
                              : 'text'

                      const isCalculated = CALCULATED_FIELD_KEYS.has(field.key)
                      const referenceTable = field.referenceTable

                      if (referenceTable) {
                        const referenceOptions = referenceOptionsByTable[referenceTable] ?? []
                        const selectedReferenceValue =
                          rawValue === null || rawValue === undefined ? '' : String(rawValue)
                        const selectedReferenceOption =
                          referenceOptions.find((option) => option.value === selectedReferenceValue) ??
                          null
                        const disabled = referenceOptions.length === 0
                        const placeholder = t(
                          `servicesManager.form.referenceOptions.${field.key}Placeholder`,
                          { defaultValue: referenceComboboxMessages.searchPlaceholder },
                        )
                        const referenceTableLabel = t(
                          referenceTableDefinitions[referenceTable].labelKey,
                        )

                        return (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={fieldId}>
                              {t(`servicesManager.form.fields.${field.key}`)}
                            </Label>
                            <ReferenceCombobox
                              id={fieldId}
                              value={selectedReferenceValue}
                              selectedOption={selectedReferenceOption}
                              options={referenceOptions}
                              onChange={(selected) => handlePayloadFieldChange(field, selected)}
                              placeholder={placeholder}
                              tableLabel={referenceTableLabel}
                              disabled={disabled}
                              maxResults={MAX_REFERENCE_RESULTS}
                              messages={referenceComboboxMessages}
                            />
                            {fieldErrors[field.key] ? (
                              <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>
                            ) : null}
                          </div>
                        )
                      }

                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={fieldId}>
                            {t(`servicesManager.form.fields.${field.key}`)}
                          </Label>
                          <Input
                            id={fieldId}
                            type={inputType}
                            value={value}
                            step={field.type === 'number' ? 'any' : undefined}
                            onChange={(event) => handlePayloadFieldChange(field, event.target.value)}
                            readOnly={isCalculated}
                            disabled={isCalculated}
                          />
                          {isCalculated ? (
                            <p className="text-xs text-muted-foreground">
                              {t('servicesManager.form.calculatedFieldNote')}
                            </p>
                          ) : null}
                          {fieldErrors[field.key] ? (
                            <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-0 px-6 pb-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                {t('servicesManager.dialogs.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t('servicesManager.dialogs.saving') : t('servicesManager.dialogs.save')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
