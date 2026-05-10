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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  RipsAdminApplicationDTOsCreateSpecialistRequestDto,
  RipsAdminApplicationDTOsSpecialistDto,
  RipsAdminApplicationDTOsUpdateSpecialistRequestDto,
  RipsAdminApplicationDTOsWorkspaceUserDto,
} from '@/api'

interface Specialist {
  id: string
  tenantId: string
  user: SpecialistUser
  documentType: string
  documentNumber: string
  professionalType: string
  registrationNumber: string
  birthDate: string
  sexCode: string
  countryResidenceCode: string
  municipalityResidenceCode: string
  territorialZoneCode: string
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}

interface SpecialistUser {
  userId: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface SpecialistFormState {
  specialistId?: string
  userId: string
  documentType: string
  documentNumber: string
  professionalType: string
  registrationNumber: string
  birthDate: string
  sexCode: string
  countryResidenceCode: string
  municipalityResidenceCode: string
  territorialZoneCode: string
  isActive: boolean
}

const emptyForm = (): SpecialistFormState => ({
  specialistId: undefined,
  userId: '',
  documentType: '',
  documentNumber: '',
  professionalType: '',
  registrationNumber: '',
  birthDate: '',
  sexCode: '',
  countryResidenceCode: '',
  municipalityResidenceCode: '',
  territorialZoneCode: '',
  isActive: true,
})

const MAX_REFERENCE_RESULTS = 50

const mapSpecialistDto = (dto: RipsAdminApplicationDTOsSpecialistDto): Specialist => ({
  id: dto.id ?? '',
  tenantId: dto.tenantId ?? '',
  user: {
    userId: dto.user?.userId ?? '',
    email: dto.user?.email ?? '',
    firstName: dto.user?.firstName,
    lastName: dto.user?.lastName,
  },
  documentType: dto.documentType ?? '',
  documentNumber: dto.documentNumber ?? '',
  professionalType: dto.professionalType ?? '',
  registrationNumber: dto.registrationNumber ?? '',
  birthDate: dto.birthDate ?? '',
  sexCode: dto.sexCode ?? '',
  countryResidenceCode: dto.countryResidenceCode ?? '',
  municipalityResidenceCode: dto.municipalityResidenceCode ?? '',
  territorialZoneCode: dto.territorialZoneCode ?? '',
  isActive: dto.isActive ?? true,
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? undefined,
})

const formatName = (user: SpecialistUser) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.replace(/\s+/g, ' ').trim() || user.email

const formatDate = (value: string): string => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString()
}

export function Specialists() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace, roles } = useAuth()
  const { errors: referenceSyncErrors } = useReferenceData()
  const { records: documentTypeRecords, error: documentTypeLoadError } =
    useReferenceTableRecords('documentTypes')
  const documentTypeDefinition = referenceTableDefinitions.documentTypes
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

  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [workspaceUsers, setWorkspaceUsers] = useState<RipsAdminApplicationDTOsWorkspaceUserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState<SpecialistFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const workspaceId = currentWorkspace?.id ?? ''
  const hasAdminAccess = useMemo(() => roles.includes('SuperAdmin') || roles.includes('Admin'), [roles])

  const resetFeedback = () => {
    setError(null)
    setSuccess(null)
  }

  const fetchWorkspaceUsers = useCallback(async () => {
    if (!workspaceId) {
      setWorkspaceUsers([])
      setUsersLoading(false)
      return
    }

    try {
      setUsersLoading(true)
      const response = await apiClient.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint(workspaceId)
      setWorkspaceUsers(response.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setUsersLoading(false)
    }
  }, [apiClient, workspaceId])

  const fetchSpecialists = useCallback(async () => {
    if (!workspaceId) {
      setSpecialists([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      resetFeedback()

      const response = await apiClient.ripsAdminPresentationEndpointsSpecialistsListSpecialistsEndpoint(workspaceId)
      const data = response.data ?? []
      const mapped = data.map(mapSpecialistDto).sort((a, b) => formatName(a.user).localeCompare(formatName(b.user)))
      setSpecialists(mapped)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('specialistsPage.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, t, workspaceId])

  useEffect(() => {
    void fetchWorkspaceUsers()
  }, [fetchWorkspaceUsers])

  useEffect(() => {
    void fetchSpecialists()
  }, [fetchSpecialists])

  const openCreateDialog = () => {
    setIsEditing(false)
    setFormState(emptyForm())
    resetFeedback()
    setIsDialogOpen(true)
  }

  const openEditDialog = (specialist: Specialist) => {
    setIsEditing(true)
    setFormState({
      specialistId: specialist.id,
      userId: specialist.user.userId,
      documentType: specialist.documentType,
      documentNumber: specialist.documentNumber,
      professionalType: specialist.professionalType,
      registrationNumber: specialist.registrationNumber,
      birthDate: specialist.birthDate,
      sexCode: specialist.sexCode,
      countryResidenceCode: specialist.countryResidenceCode,
      municipalityResidenceCode: specialist.municipalityResidenceCode,
      territorialZoneCode: specialist.territorialZoneCode,
      isActive: specialist.isActive,
    })
    resetFeedback()
    setIsDialogOpen(true)
  }

  const handleFieldChange = <K extends keyof SpecialistFormState>(field: K, value: SpecialistFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(specialists.map((specialist) => specialist.user.userId))
    return workspaceUsers.filter((user) => !assignedUserIds.has(user.userId ?? '') || formState.userId === user.userId)
  }, [formState.userId, specialists, workspaceUsers])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspaceId) return

    try {
      setIsSubmitting(true)
      resetFeedback()

      if (isEditing && formState.specialistId) {
        const payload: RipsAdminApplicationDTOsUpdateSpecialistRequestDto = {
          documentType: formState.documentType,
          documentNumber: formState.documentNumber,
          professionalType: formState.professionalType,
          registrationNumber: formState.registrationNumber,
          birthDate: formState.birthDate,
          sexCode: formState.sexCode,
          countryResidenceCode: formState.countryResidenceCode,
          municipalityResidenceCode: formState.municipalityResidenceCode,
          territorialZoneCode: formState.territorialZoneCode,
          isActive: formState.isActive,
        }

        const response = await apiClient.ripsAdminPresentationEndpointsSpecialistsUpdateSpecialistEndpoint(
          workspaceId,
          formState.specialistId,
          payload,
        )

        const updated = mapSpecialistDto(response.data ?? {})
        setSpecialists((prev) =>
          prev
            .map((specialist) => (specialist.id === updated.id ? updated : specialist))
            .sort((a, b) => formatName(a.user).localeCompare(formatName(b.user))),
        )
        setSuccess(t('specialistsPage.updateSuccess'))
      } else {
        const payload: RipsAdminApplicationDTOsCreateSpecialistRequestDto = {
          userId: formState.userId,
          documentType: formState.documentType,
          documentNumber: formState.documentNumber,
          professionalType: formState.professionalType,
          registrationNumber: formState.registrationNumber,
          birthDate: formState.birthDate,
          sexCode: formState.sexCode,
          countryResidenceCode: formState.countryResidenceCode,
          municipalityResidenceCode: formState.municipalityResidenceCode,
          territorialZoneCode: formState.territorialZoneCode,
          isActive: formState.isActive,
        }

        const response = await apiClient.ripsAdminPresentationEndpointsSpecialistsCreateSpecialistEndpoint(
          workspaceId,
          payload,
        )

        const created = mapSpecialistDto(response.data ?? {})
        setSpecialists((prev) =>
          [...prev, created].sort((a, b) => formatName(a.user).localeCompare(formatName(b.user))),
        )
        setSuccess(t('specialistsPage.createSuccess'))
      }

      setIsDialogOpen(false)
      setFormState(emptyForm())
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('specialistsPage.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('specialistsPage.emptyWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('specialistsPage.emptyWorkspaceDescription')}</CardDescription>
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
        <h1 className="text-4xl font-bold">{t('specialistsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('specialistsPage.description')}</p>
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
            <CardTitle>{t('specialistsPage.listTitle')}</CardTitle>
            <CardDescription>{t('specialistsPage.listDescription')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void fetchSpecialists()}>
              <RefreshCcw className="h-4 w-4" />
              {t('specialistsPage.actions.refresh')}
            </Button>
            {hasAdminAccess ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    {t('specialistsPage.actions.addSpecialist')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? t('specialistsPage.dialog.editTitle') : t('specialistsPage.dialog.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? t('specialistsPage.dialog.editDescription')
                        : t('specialistsPage.dialog.createDescription')}
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="userId">{t('specialistsPage.form.user')}</Label>
                      <Select
                        value={formState.userId}
                        onValueChange={(value) => handleFieldChange('userId', value)}
                        disabled={isEditing}
                      >
                        <SelectTrigger id="userId">
                          <SelectValue placeholder={usersLoading ? t('specialistsPage.form.loadingUsers') : t('specialistsPage.form.selectUser')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.userId} value={user.userId ?? ''}>
                              {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="documentType">{t('specialistsPage.form.documentType')}</Label>
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
                        <Label htmlFor="documentNumber">{t('specialistsPage.form.documentNumber')}</Label>
                        <Input
                          id="documentNumber"
                          value={formState.documentNumber}
                          onChange={(event) => handleFieldChange('documentNumber', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="professionalType">{t('specialistsPage.form.professionalType')}</Label>
                        <Input
                          id="professionalType"
                          value={formState.professionalType}
                          onChange={(event) => handleFieldChange('professionalType', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">{t('specialistsPage.form.registrationNumber')}</Label>
                        <Input
                          id="registrationNumber"
                          value={formState.registrationNumber}
                          onChange={(event) => handleFieldChange('registrationNumber', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">{t('specialistsPage.form.birthDate')}</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formState.birthDate}
                          onChange={(event) => handleFieldChange('birthDate', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sexCode">{t('specialistsPage.form.sexCode')}</Label>
                        <Input
                          id="sexCode"
                          value={formState.sexCode}
                          onChange={(event) => handleFieldChange('sexCode', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="territorialZoneCode">{t('specialistsPage.form.territorialZoneCode')}</Label>
                        <Input
                          id="territorialZoneCode"
                          value={formState.territorialZoneCode}
                          onChange={(event) => handleFieldChange('territorialZoneCode', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="countryResidenceCode">{t('specialistsPage.form.countryResidenceCode')}</Label>
                        <Input
                          id="countryResidenceCode"
                          value={formState.countryResidenceCode}
                          onChange={(event) => handleFieldChange('countryResidenceCode', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="municipalityResidenceCode">
                          {t('specialistsPage.form.municipalityResidenceCode')}
                        </Label>
                        <Input
                          id="municipalityResidenceCode"
                          value={formState.municipalityResidenceCode}
                          onChange={(event) => handleFieldChange('municipalityResidenceCode', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-muted-foreground/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{t('specialistsPage.form.statusLabel')}</p>
                        <p className="text-xs text-muted-foreground">{t('specialistsPage.form.statusHint')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="specialist-status"
                          checked={formState.isActive}
                          onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                        />
                        <Label htmlFor="specialist-status">
                          {formState.isActive ? t('specialistsPage.statusActive') : t('specialistsPage.statusInactive')}
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t('specialistsPage.dialog.cancel')}
                      </Button>
                      <Button type="submit" disabled={isSubmitting || (!isEditing && !formState.userId)}>
                        {isSubmitting ? t('specialistsPage.dialog.saving') : t('specialistsPage.dialog.submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {specialists.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {t('specialistsPage.emptyState.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('specialistsPage.emptyState.description')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('specialistsPage.table.user')}</TableHead>
                    <TableHead>{t('specialistsPage.table.document')}</TableHead>
                    <TableHead>{t('specialistsPage.table.professionalType')}</TableHead>
                    <TableHead>{t('specialistsPage.table.birthDate')}</TableHead>
                    <TableHead>{t('specialistsPage.table.status')}</TableHead>
                    {hasAdminAccess ? (
                      <TableHead className="text-right">{t('specialistsPage.table.actions')}</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialists.map((specialist) => (
                    <TableRow key={specialist.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatName(specialist.user)}</span>
                          <span className="text-xs text-muted-foreground">{specialist.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {specialist.documentType} {specialist.documentNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('specialistsPage.table.registration', { registration: specialist.registrationNumber })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{specialist.professionalType}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('specialistsPage.table.country', { code: specialist.countryResidenceCode })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(specialist.birthDate)}</TableCell>
                      <TableCell>
                        <Badge variant={specialist.isActive ? 'default' : 'secondary'}>
                          {specialist.isActive ? t('specialistsPage.statusActive') : t('specialistsPage.statusInactive')}
                        </Badge>
                      </TableCell>
                      {hasAdminAccess ? (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditDialog(specialist)}
                          >
                            <PencilLine className="h-4 w-4" />
                            {t('specialistsPage.table.edit')}
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
