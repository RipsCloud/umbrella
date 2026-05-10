import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCcw, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ReferenceCombobox,
  type ReferenceComboboxMessages,
} from '@/components/reference/ReferenceCombobox'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { useReferenceData, useReferenceTableRecords } from '@/context/useReferenceData'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption } from '@/lib/reference-data/types'
import type {
  RipsAdminApplicationDTOsCreatePatientRequestDto,
  RipsAdminApplicationDTOsPatientDto,
  RipsAdminApplicationDTOsUpdatePatientRequestDto,
} from '@/api'

interface Patient {
  id: string
  tenantId: string
  documentType: string
  documentNumber: string
  userType: string
  birthDate: string
  sexCode: string
  countryResidenceCode: string
  countryOriginCode: string
  municipalityResidenceCode: string
  territorialZoneCode: string
  disabilityFlag: string
  firstName: string
  middleName?: string | null
  lastName: string
  secondLastName?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}

interface PatientFormState {
  patientId?: string
  documentType: string
  documentNumber: string
  userType: string
  birthDate: string
  sexCode: string
  countryResidenceCode: string
  countryOriginCode: string
  municipalityResidenceCode: string
  territorialZoneCode: string
  disabilityFlag: string
  firstName: string
  middleName: string
  lastName: string
  secondLastName: string
  isActive: boolean
}

const emptyPatientForm = (): PatientFormState => ({
  patientId: undefined,
  documentType: '',
  documentNumber: '',
  userType: '',
  birthDate: '',
  sexCode: '',
  countryResidenceCode: '',
  countryOriginCode: '',
  municipalityResidenceCode: '',
  territorialZoneCode: '',
  disabilityFlag: '',
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  isActive: true,
})

const MAX_REFERENCE_RESULTS = 50

const mapPatientDto = (dto: RipsAdminApplicationDTOsPatientDto): Patient => ({
  id: dto.id ?? '',
  tenantId: dto.tenantId ?? '',
  documentType: dto.documentType ?? '',
  documentNumber: dto.documentNumber ?? '',
  userType: dto.userType ?? '',
  birthDate: dto.birthDate ?? '',
  sexCode: dto.sexCode ?? '',
  countryResidenceCode: dto.countryResidenceCode ?? '',
  countryOriginCode: dto.countryOriginCode ?? '',
  municipalityResidenceCode: dto.municipalityResidenceCode ?? '',
  territorialZoneCode: dto.territorialZoneCode ?? '',
  disabilityFlag: dto.disabilityFlag ?? '',
  firstName: dto.firstName ?? '',
  middleName: dto.middleName ?? undefined,
  lastName: dto.lastName ?? '',
  secondLastName: dto.secondLastName ?? undefined,
  isActive: dto.isActive ?? true,
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? undefined,
})

const formatDate = (value: string): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

export function Patients() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace, roles } = useAuth()
  const { errors: referenceSyncErrors } = useReferenceData()
  const { records: documentTypeRecords, error: documentTypeLoadError } =
    useReferenceTableRecords('documentTypes')
  const documentTypeDefinition = referenceTableDefinitions.documentTypes
  const { records: zonaTerritorialRecords, error: zonaTerritorialLoadError } =
    useReferenceTableRecords('zonaTerritorial')
  const zonaTerritorialDefinition = referenceTableDefinitions.zonaTerritorial
  const { records: paisesRecords, error: paisesLoadError } = useReferenceTableRecords('paises')
  const paisesDefinition = referenceTableDefinitions.paises
  const { records: municipiosRecords, error: municipiosLoadError } =
    useReferenceTableRecords('municipios')
  const municipiosDefinition = referenceTableDefinitions.municipios
  const { records: healthTypeUserRecords } =
    useReferenceTableRecords('healthTypeUsers')
  const healthTypeUserDefinition = referenceTableDefinitions.healthTypeUsers
  const documentTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      documentTypeRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          documentTypeDefinition.toOption
            ? documentTypeDefinition.toOption(record)
            : {
                value: record.code,
                label: `${record.code} · ${record.name}`,
                description: record.description ?? null,
                searchText: [record.code, record.name, record.description ?? '']
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [documentTypeDefinition, documentTypeRecords],
  )
  const zonaTerritorialReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      zonaTerritorialRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          zonaTerritorialDefinition.toOption
            ? zonaTerritorialDefinition.toOption(record)
            : {
                value: record.code,
                label: `${record.code} · ${record.name}`,
                description: record.description ?? null,
                searchText: [record.code, record.name, record.description ?? '']
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [zonaTerritorialDefinition, zonaTerritorialRecords],
  )
  const paisesReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      paisesRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          paisesDefinition.toOption
            ? paisesDefinition.toOption(record)
            : {
                value: record.code,
                label: record.name,
                searchText: [record.code, record.name]
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [paisesDefinition, paisesRecords],
  )
  const municipiosReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      municipiosRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          municipiosDefinition.toOption
            ? municipiosDefinition.toOption(record)
            : {
                value: record.code,
                label: record.name,
                searchText: [record.code, record.name]
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [municipiosDefinition, municipiosRecords],
  )
  const userTypeReferenceOptions = useMemo<ReferenceOption[]>(
    () =>
      healthTypeUserRecords
        .filter((record) => record.isEnabled)
        .map((record) =>
          healthTypeUserDefinition.toOption
            ? healthTypeUserDefinition.toOption(record)
            : {
                value: record.code,
                label: `${record.code} · ${record.name}`,
                description: record.description ?? null,
                searchText: [record.code, record.name, record.description ?? '']
                  .join(' ')
                  .trim()
                  .toLowerCase(),
              },
        ),
    [healthTypeUserDefinition, healthTypeUserRecords],
  )
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
  const documentTypeTableLabel = t(documentTypeDefinition.labelKey)
  const documentTypeErrorMessage =
    referenceSyncErrors?.documentTypes || documentTypeLoadError
      ? t('referenceData.errors.loadTable', { table: documentTypeTableLabel })
      : null

  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState<PatientFormState>(emptyPatientForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const workspaceId = currentWorkspace?.id ?? ''
  const hasAdminAccess = useMemo(
    () => roles.includes('SuperAdmin') || roles.includes('Admin'),
    [roles],
  )

  const resetFeedback = () => {
    setError(null)
    setSuccess(null)
  }

  const fetchPatients = useCallback(async () => {
    if (!workspaceId) {
      setPatients([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      resetFeedback()

      const response = await apiClient.ripsAdminPresentationEndpointsPatientsListPatientsEndpoint(workspaceId)
      const data = response.data ?? []
      const mapped = data.map(mapPatientDto).sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      })
      setPatients(mapped)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('patientsPage.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, t, workspaceId])

  useEffect(() => {
    void fetchPatients()
  }, [fetchPatients])

  const openCreateDialog = () => {
    setIsEditing(false)
    setFormState(emptyPatientForm())
    resetFeedback()
    setIsDialogOpen(true)
  }

  const openEditDialog = (patient: Patient) => {
    setIsEditing(true)
    setFormState({
      patientId: patient.id,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      userType: patient.userType,
      birthDate: patient.birthDate,
      sexCode: patient.sexCode,
      countryResidenceCode: patient.countryResidenceCode,
      countryOriginCode: patient.countryOriginCode,
      municipalityResidenceCode: patient.municipalityResidenceCode,
      territorialZoneCode: patient.territorialZoneCode,
      disabilityFlag: patient.disabilityFlag,
      firstName: patient.firstName,
      middleName: patient.middleName ?? '',
      lastName: patient.lastName,
      secondLastName: patient.secondLastName ?? '',
      isActive: patient.isActive,
    })
    resetFeedback()
    setIsDialogOpen(true)
  }

  const handleFieldChange = (field: keyof PatientFormState, value: PatientFormState[typeof field]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspaceId) return

    const payload:
      | RipsAdminApplicationDTOsCreatePatientRequestDto
      | RipsAdminApplicationDTOsUpdatePatientRequestDto = {
      documentType: formState.documentType,
      documentNumber: formState.documentNumber,
      userType: formState.userType,
      birthDate: formState.birthDate,
      sexCode: formState.sexCode,
      countryResidenceCode: formState.countryResidenceCode,
      countryOriginCode: formState.countryOriginCode,
      municipalityResidenceCode: formState.municipalityResidenceCode,
      territorialZoneCode: formState.territorialZoneCode,
      disabilityFlag: formState.disabilityFlag,
      firstName: formState.firstName,
      middleName: formState.middleName || null,
      lastName: formState.lastName,
      secondLastName: formState.secondLastName || null,
      isActive: formState.isActive,
    }

    try {
      setIsSubmitting(true)
      resetFeedback()

      if (isEditing && formState.patientId) {
        const response = await apiClient.ripsAdminPresentationEndpointsPatientsUpdatePatientEndpoint(
          workspaceId,
          formState.patientId,
          payload as RipsAdminApplicationDTOsUpdatePatientRequestDto,
        )
        const updated = mapPatientDto(response.data ?? {})
        setPatients((prev) =>
          prev
            .map((patient) => (patient.id === updated.id ? updated : patient))
            .sort((a, b) => {
              const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
              const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
              return nameA.localeCompare(nameB)
            }),
        )
        setSuccess(t('patientsPage.updateSuccess'))
      } else {
        const response = await apiClient.ripsAdminPresentationEndpointsPatientsCreatePatientEndpoint(
          workspaceId,
          payload as RipsAdminApplicationDTOsCreatePatientRequestDto,
        )
        const created = mapPatientDto(response.data ?? {})
        setPatients((prev) =>
          [...prev, created].sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
            const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
            return nameA.localeCompare(nameB)
          }),
        )
        setSuccess(t('patientsPage.createSuccess'))
      }

      setIsDialogOpen(false)
      setFormState(emptyPatientForm())
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('patientsPage.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('patientsPage.emptyWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('patientsPage.emptyWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-72" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('patientsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('patientsPage.description')}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>{t('common.success')}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t('patientsPage.listTitle')}</CardTitle>
            <CardDescription>{t('patientsPage.listDescription')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void fetchPatients()}>
              <RefreshCcw className="h-4 w-4" />
              {t('patientsPage.actions.refresh')}
            </Button>
            {hasAdminAccess ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    {t('patientsPage.actions.addPatient')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? t('patientsPage.dialog.editTitle') : t('patientsPage.dialog.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? t('patientsPage.dialog.editDescription')
                        : t('patientsPage.dialog.createDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="documentType">{t('patientsPage.form.documentType')}</Label>
                        <ReferenceCombobox
                          id="documentType"
                          value={formState.documentType}
                          selectedOption={
                            documentTypeReferenceOptions.find(
                              (option) => option.value === formState.documentType,
                            ) ?? null
                          }
                          options={documentTypeReferenceOptions}
                          onChange={(value) => handleFieldChange('documentType', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={documentTypeTableLabel}
                          disabled={documentTypeReferenceOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {documentTypeErrorMessage ? (
                          <p className="text-xs text-destructive">{documentTypeErrorMessage}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documentNumber">{t('patientsPage.form.documentNumber')}</Label>
                        <Input
                          id="documentNumber"
                          value={formState.documentNumber}
                          onChange={(event) => handleFieldChange('documentNumber', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userType">{t('patientsPage.form.userType')}</Label>
                        <ReferenceCombobox
                          id="userType"
                          value={formState.userType}
                          selectedOption={userTypeReferenceOptions.find((o) => o.value === formState.userType) ?? null}
                          options={userTypeReferenceOptions}
                          onChange={(value) => handleFieldChange('userType', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={t('patientsPage.form.userType')}
                          disabled={userTypeReferenceOptions.length === 0}
                          maxResults={50}
                          messages={referenceComboboxMessages}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">{t('patientsPage.form.birthDate')}</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formState.birthDate}
                          onChange={(event) => handleFieldChange('birthDate', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sexCode">{t('patientsPage.form.sexCode')}</Label>
                        <Input
                          id="sexCode"
                          value={formState.sexCode}
                          onChange={(event) => handleFieldChange('sexCode', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disabilityFlag">{t('patientsPage.form.disabilityFlag')}</Label>
                        <Input
                          id="disabilityFlag"
                          value={formState.disabilityFlag}
                          onChange={(event) => handleFieldChange('disabilityFlag', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t('patientsPage.form.firstName')}</Label>
                        <Input
                          id="firstName"
                          value={formState.firstName}
                          onChange={(event) => handleFieldChange('firstName', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName">{t('patientsPage.form.middleName')}</Label>
                        <Input
                          id="middleName"
                          value={formState.middleName}
                          onChange={(event) => handleFieldChange('middleName', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t('patientsPage.form.lastName')}</Label>
                        <Input
                          id="lastName"
                          value={formState.lastName}
                          onChange={(event) => handleFieldChange('lastName', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondLastName">{t('patientsPage.form.secondLastName')}</Label>
                        <Input
                          id="secondLastName"
                          value={formState.secondLastName}
                          onChange={(event) => handleFieldChange('secondLastName', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="countryResidenceCode">{t('patientsPage.form.countryResidenceCode')}</Label>
                        <ReferenceCombobox
                          id="countryResidenceCode"
                          value={formState.countryResidenceCode}
                          selectedOption={
                            paisesReferenceOptions.find(
                              (option) => option.value === formState.countryResidenceCode,
                            ) ?? null
                          }
                          options={paisesReferenceOptions}
                          onChange={(value) => handleFieldChange('countryResidenceCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={t(paisesDefinition.labelKey)}
                          disabled={paisesReferenceOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {paisesLoadError || referenceSyncErrors?.paises ? (
                          <p className="text-xs text-destructive">
                            {t('referenceData.errors.loadTable', { table: t(paisesDefinition.labelKey) })}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="countryOriginCode">{t('patientsPage.form.countryOriginCode')}</Label>
                        <ReferenceCombobox
                          id="countryOriginCode"
                          value={formState.countryOriginCode}
                          selectedOption={
                            paisesReferenceOptions.find(
                              (option) => option.value === formState.countryOriginCode,
                            ) ?? null
                          }
                          options={paisesReferenceOptions}
                          onChange={(value) => handleFieldChange('countryOriginCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={t(paisesDefinition.labelKey)}
                          disabled={paisesReferenceOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {paisesLoadError || referenceSyncErrors?.paises ? (
                          <p className="text-xs text-destructive">
                            {t('referenceData.errors.loadTable', { table: t(paisesDefinition.labelKey) })}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="municipalityResidenceCode">
                          {t('patientsPage.form.municipalityResidenceCode')}
                        </Label>
                        <ReferenceCombobox
                          id="municipalityResidenceCode"
                          value={formState.municipalityResidenceCode}
                          selectedOption={
                            municipiosReferenceOptions.find(
                              (option) => option.value === formState.municipalityResidenceCode,
                            ) ?? null
                          }
                          options={municipiosReferenceOptions}
                          onChange={(value) => handleFieldChange('municipalityResidenceCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={t(municipiosDefinition.labelKey)}
                          disabled={municipiosReferenceOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {municipiosLoadError || referenceSyncErrors?.municipios ? (
                          <p className="text-xs text-destructive">
                            {t('referenceData.errors.loadTable', { table: t(municipiosDefinition.labelKey) })}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="territorialZoneCode">{t('patientsPage.form.territorialZoneCode')}</Label>
                        <ReferenceCombobox
                          id="territorialZoneCode"
                          value={formState.territorialZoneCode}
                          selectedOption={
                            zonaTerritorialReferenceOptions.find(
                              (option) => option.value === formState.territorialZoneCode,
                            ) ?? null
                          }
                          options={zonaTerritorialReferenceOptions}
                          onChange={(value) => handleFieldChange('territorialZoneCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={t(zonaTerritorialDefinition.labelKey)}
                          disabled={zonaTerritorialReferenceOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {zonaTerritorialLoadError || referenceSyncErrors?.zonaTerritorial ? (
                          <p className="text-xs text-destructive">
                            {t('referenceData.errors.loadTable', { table: t(zonaTerritorialDefinition.labelKey) })}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-muted-foreground/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{t('patientsPage.form.statusLabel')}</p>
                        <p className="text-xs text-muted-foreground">{t('patientsPage.form.statusHint')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="patient-status"
                          checked={formState.isActive}
                          onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                        />
                        <Label htmlFor="patient-status">
                          {formState.isActive ? t('patientsPage.statusActive') : t('patientsPage.statusInactive')}
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t('patientsPage.dialog.cancel')}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t('patientsPage.dialog.saving') : t('patientsPage.dialog.submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t('patientsPage.emptyState.title')}</p>
              <p className="text-xs text-muted-foreground">{t('patientsPage.emptyState.description')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('patientsPage.table.document')}</TableHead>
                    <TableHead>{t('patientsPage.table.fullName')}</TableHead>
                    <TableHead>{t('patientsPage.table.birthDate')}</TableHead>
                    <TableHead>{t('patientsPage.table.sex')}</TableHead>
                    <TableHead>{t('patientsPage.table.residence')}</TableHead>
                    <TableHead>{t('patientsPage.table.status')}</TableHead>
                    {hasAdminAccess ? (
                      <TableHead className="text-right">{t('patientsPage.table.actions')}</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {patient.documentType} {patient.documentNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('patientsPage.table.userType', { code: patient.userType })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}
                            {patient.lastName} {patient.secondLastName ?? ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('patientsPage.table.disability', { flag: patient.disabilityFlag })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(patient.birthDate)}</TableCell>
                      <TableCell>{patient.sexCode}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{patient.countryResidenceCode}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('patientsPage.table.municipality', { code: patient.municipalityResidenceCode })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                          {patient.isActive ? t('patientsPage.statusActive') : t('patientsPage.statusInactive')}
                        </Badge>
                      </TableCell>
                      {hasAdminAccess ? (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditDialog(patient)}
                          >
                            <PencilLine className="h-4 w-4" />
                            {t('patientsPage.table.edit')}
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
