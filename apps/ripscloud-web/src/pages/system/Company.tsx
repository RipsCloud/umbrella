import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ReferenceCombobox,
  type ReferenceComboboxMessages,
} from '@/components/reference/ReferenceCombobox'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import { useReferenceTableRecords } from '@/context/useReferenceData'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption } from '@/lib/reference-data/types'
import type {
  RipsAdminApplicationDTOsTenantDto,
  RipsAdminApplicationDTOsTenantLocationDto,
  RipsAdminApplicationDTOsTenantLocationUpdateRequestDto,
  RipsAdminApplicationDTOsUpdateTenantRequestDto,
} from '@/api'

interface LocationFormState {
  id?: string
  name: string
  address: string
  departmentCode: string
  municipalityCode: string
  phoneNumber: string
  email: string
  habilitationCode: string
  isActive: boolean
}

interface CompanyFormState {
  tenantId: string
  nit: string
  verificationDigit: string
  companyName: string
  commercialName: string
  taxRegime: string
  economicActivityCode: string
  address: string
  departmentCode: string
  municipalityCode: string
  phoneNumber: string
  email: string
  serviceCode: string
  locations: LocationFormState[]
}

const defaultLocation = (): LocationFormState => ({
  id: undefined,
  name: '',
  address: '',
  departmentCode: '',
  municipalityCode: '',
  phoneNumber: '',
  email: '',
  habilitationCode: '',
  isActive: true,
})

const mapLocation = (location: RipsAdminApplicationDTOsTenantLocationDto): LocationFormState => ({
  id: location.id ?? undefined,
  name: location.name ?? '',
  address: location.address ?? '',
  departmentCode: location.departmentCode ?? '',
  municipalityCode: location.municipalityCode ?? '',
  phoneNumber: location.phoneNumber ?? '',
  email: location.email ?? '',
  habilitationCode: location.habilitationCode ?? '',
  isActive: location.isActive ?? true,
})

const mapCompany = (dto: RipsAdminApplicationDTOsTenantDto): CompanyFormState => ({
  tenantId: dto.id ?? '',
  nit: dto.nit ?? '',
  verificationDigit: dto.verificationDigit ?? '',
  companyName: dto.companyName ?? '',
  commercialName: dto.commercialName ?? '',
  taxRegime: dto.taxRegime ?? '',
  economicActivityCode: dto.economicActivityCode ?? '',
  address: dto.address ?? '',
  departmentCode: dto.departmentCode ?? '',
  municipalityCode: dto.municipalityCode ?? '',
  phoneNumber: dto.phoneNumber ?? '',
  email: dto.email ?? '',
  serviceCode: dto.serviceCode ?? '',
  locations: (dto.locations ?? []).map(mapLocation),
})

export function Company() {
  const { t } = useTranslation()
  const { currentWorkspace } = useAuth()
  const { apiClient } = useApiClient()

  // Reference table hooks for department, municipality, and tax regime
  const {
    records: departmentRecords,
    loading: departmentLoading,
    error: departmentLoadError,
  } = useReferenceTableRecords('invoiceDepartments')
  const {
    records: municipalityRecords,
    loading: municipalityLoading,
    error: municipalityLoadError,
  } = useReferenceTableRecords('invoiceMunicipalities')
  const {
    records: taxRegimeRecords,
    loading: taxRegimeLoading,
    error: taxRegimeLoadError,
  } = useReferenceTableRecords('invoiceRegimes')

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

  const departmentDefinition = referenceTableDefinitions.invoiceDepartments
  const municipalityDefinition = referenceTableDefinitions.invoiceMunicipalities
  const taxRegimeDefinition = referenceTableDefinitions.invoiceRegimes

  const departmentTableLabel = t(departmentDefinition.labelKey)
  const municipalityTableLabel = t(municipalityDefinition.labelKey)
  const taxRegimeTableLabel = t(taxRegimeDefinition.labelKey)

  const departmentOptions = useMemo<ReferenceOption[]>(() => {
    if (!departmentRecords.length) {
      return []
    }
    return departmentRecords
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((record) =>
        departmentDefinition.toOption
          ? departmentDefinition.toOption(record)
          : {
              value: record.code,
              label: `${record.code} · ${record.name}`,
              searchText: `${record.code} ${record.name}`.toLowerCase(),
            },
      )
  }, [departmentDefinition, departmentRecords])

  const municipalityOptions = useMemo<ReferenceOption[]>(() => {
    if (!municipalityRecords.length) {
      return []
    }
    return municipalityRecords
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((record) =>
        municipalityDefinition.toOption
          ? municipalityDefinition.toOption(record)
          : {
              value: record.code,
              label: `${record.code} · ${record.name}`,
              searchText: `${record.code} ${record.name}`.toLowerCase(),
            },
      )
  }, [municipalityDefinition, municipalityRecords])

  const taxRegimeOptions = useMemo<ReferenceOption[]>(() => {
    if (!taxRegimeRecords.length) {
      return []
    }
    return taxRegimeRecords.map((record) =>
      taxRegimeDefinition.toOption
        ? taxRegimeDefinition.toOption(record)
        : {
            value: record.code,
            label: `${record.code} · ${record.name}`,
            searchText: `${record.code} ${record.name}`.toLowerCase(),
          },
    )
  }, [taxRegimeDefinition, taxRegimeRecords])

  const departmentErrorMessage = departmentLoadError
    ? t('referenceData.errors.loadTable', { table: departmentTableLabel })
    : null
  const municipalityErrorMessage = municipalityLoadError
    ? t('referenceData.errors.loadTable', { table: municipalityTableLabel })
    : null
  const taxRegimeErrorMessage = taxRegimeLoadError
    ? t('referenceData.errors.loadTable', { table: taxRegimeTableLabel })
    : null

  const MAX_REFERENCE_RESULTS = 50

  const [company, setCompany] = useState<CompanyFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const workspaceId = currentWorkspace?.id ?? ''

  const hasCompanyData = useMemo(() => company !== null, [company])

  const handleError = useCallback(
    (error: unknown, fallbackKey: string) => {
      const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(responseError ?? t(fallbackKey))
      setSuccess(null)
    },
    [t],
  )

  const fetchCompany = useCallback(async () => {
    if (!workspaceId) {
      setCompany(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await apiClient.ripsAdminPresentationEndpointsCompanyGetCompanyEndpoint(workspaceId)
      const dto = response.data
      if (dto) {
        const mapped = mapCompany(dto)
        setCompany({
          ...mapped,
          locations: mapped.locations.length > 0 ? mapped.locations : [defaultLocation()],
        })
      } else {
        setCompany({
          tenantId: workspaceId,
          nit: '',
          verificationDigit: '',
          companyName: '',
          commercialName: '',
          taxRegime: '',
          economicActivityCode: '',
          address: '',
          departmentCode: '',
          municipalityCode: '',
          phoneNumber: '',
          email: '',
          serviceCode: '',
          locations: [defaultLocation()],
        })
      }
    } catch (err) {
      handleError(err, 'companyPage.loadError')
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, handleError, workspaceId])

  useEffect(() => {
    void fetchCompany()
  }, [fetchCompany])

  const updateCompanyField = <K extends keyof CompanyFormState>(key: K, value: CompanyFormState[K]) => {
    if (!company) return

    setCompany({
      ...company,
      [key]: value,
    })
  }

  const updateLocationField = (index: number, key: keyof LocationFormState, value: LocationFormState[typeof key]) => {
    if (!company) return
    const updatedLocations = company.locations.map((location, idx) =>
      idx === index ? { ...location, [key]: value } : location,
    )
    setCompany({ ...company, locations: updatedLocations })
  }

  const addLocation = () => {
    if (!company) return
    setCompany({
      ...company,
      locations: [...company.locations, defaultLocation()],
    })
  }

  const removeLocation = (index: number) => {
    if (!company) return
    setCompany({
      ...company,
      locations: company.locations.filter((_, idx) => idx !== index),
    })
  }

  const handleSave = async () => {
    if (!company || !workspaceId) return

    if (company.locations.length === 0) {
      setError(t('companyPage.requiredLocations'))
      setSuccess(null)
      return
    }

    const payload: RipsAdminApplicationDTOsUpdateTenantRequestDto = {
      tenantId: company.tenantId,
      nit: company.nit,
      verificationDigit: company.verificationDigit,
      companyName: company.companyName,
      commercialName: company.commercialName,
      taxRegime: company.taxRegime,
      economicActivityCode: company.economicActivityCode,
      address: company.address,
      departmentCode: company.departmentCode,
      municipalityCode: company.municipalityCode,
      phoneNumber: company.phoneNumber,
      email: company.email,
      serviceCode: company.serviceCode,
      locations: company.locations.map<RipsAdminApplicationDTOsTenantLocationUpdateRequestDto>((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        departmentCode: location.departmentCode,
        municipalityCode: location.municipalityCode,
        phoneNumber: location.phoneNumber,
        email: location.email,
        habilitationCode: location.habilitationCode,
        isActive: location.isActive,
      })),
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await apiClient.ripsAdminPresentationEndpointsCompanyUpdateCompanyEndpoint(workspaceId, payload)
      if (response.data) {
        const mapped = mapCompany(response.data)
        setCompany({
          ...mapped,
          locations: mapped.locations.length > 0 ? mapped.locations : [defaultLocation()],
        })
        setSuccess(t('companyPage.saveSuccess'))
      }
    } catch (err) {
      handleError(err, 'companyPage.saveError')
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('companyPage.emptyWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('companyPage.emptyWorkspaceDescription')}</CardDescription>
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
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold">{t('sidebar.company')}</h1>
        <p className="text-sm text-muted-foreground">{t('companyPage.description')}</p>
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

      {hasCompanyData && company ? (
        <>
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t('companyPage.generalInfo')}</CardTitle>
              <CardDescription>{t('companyPage.generalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <div className="space-y-2">
                  <Label htmlFor="nit">{t('companyPage.nit')}</Label>
                  <Input
                    id="nit"
                    value={company.nit}
                    onChange={(event) => updateCompanyField('nit', event.target.value)}
                    placeholder="900123456"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationDigit">{t('companyPage.verificationDigit')}</Label>
                  <Input
                    id="verificationDigit"
                    value={company.verificationDigit}
                    onChange={(event) => updateCompanyField('verificationDigit', event.target.value)}
                    placeholder="4"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('companyPage.companyName')}</Label>
                  <Input
                    id="companyName"
                    value={company.companyName}
                    onChange={(event) => updateCompanyField('companyName', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercialName">{t('companyPage.commercialName')}</Label>
                  <Input
                    id="commercialName"
                    value={company.commercialName}
                    onChange={(event) => updateCompanyField('commercialName', event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxRegime">{t('companyPage.taxRegime')}</Label>
                  <ReferenceCombobox
                    id="taxRegime"
                    value={company.taxRegime ?? ''}
                    selectedOption={
                      taxRegimeOptions.find((option) => option.value === company.taxRegime) ?? null
                    }
                    options={taxRegimeOptions}
                    onChange={(value) => updateCompanyField('taxRegime', value)}
                    placeholder={t('common.selectOption')}
                    tableLabel={taxRegimeTableLabel}
                    disabled={taxRegimeLoading || taxRegimeOptions.length === 0}
                    maxResults={MAX_REFERENCE_RESULTS}
                    messages={referenceComboboxMessages}
                  />
                  {taxRegimeErrorMessage ? (
                    <p className="text-xs text-destructive mt-1">{taxRegimeErrorMessage}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="economicActivityCode">{t('companyPage.economicActivityCode')}</Label>
                  <Input
                    id="economicActivityCode"
                    value={company.economicActivityCode}
                    onChange={(event) => updateCompanyField('economicActivityCode', event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('companyPage.address')}</Label>
                <Textarea
                  id="address"
                  value={company.address}
                  onChange={(event) => updateCompanyField('address', event.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="departmentCode">{t('companyPage.departmentCode')}</Label>
                  <ReferenceCombobox
                    id="departmentCode"
                    value={company.departmentCode ?? ''}
                    selectedOption={
                      departmentOptions.find((option) => option.value === company.departmentCode) ?? null
                    }
                    options={departmentOptions}
                    onChange={(value) => updateCompanyField('departmentCode', value)}
                    placeholder={t('common.selectOption')}
                    tableLabel={departmentTableLabel}
                    disabled={departmentLoading || departmentOptions.length === 0}
                    maxResults={MAX_REFERENCE_RESULTS}
                    messages={referenceComboboxMessages}
                  />
                  {departmentErrorMessage ? (
                    <p className="text-xs text-destructive mt-1">{departmentErrorMessage}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipalityCode">{t('companyPage.municipalityCode')}</Label>
                  <ReferenceCombobox
                    id="municipalityCode"
                    value={company.municipalityCode ?? ''}
                    selectedOption={
                      municipalityOptions.find((option) => option.value === company.municipalityCode) ?? null
                    }
                    options={municipalityOptions}
                    onChange={(value) => updateCompanyField('municipalityCode', value)}
                    placeholder={t('common.selectOption')}
                    tableLabel={municipalityTableLabel}
                    disabled={municipalityLoading || municipalityOptions.length === 0}
                    maxResults={MAX_REFERENCE_RESULTS}
                    messages={referenceComboboxMessages}
                  />
                  {municipalityErrorMessage ? (
                    <p className="text-xs text-destructive mt-1">{municipalityErrorMessage}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceCode">{t('companyPage.serviceCode')}</Label>
                  <Input
                    id="serviceCode"
                    value={company.serviceCode}
                    onChange={(event) => updateCompanyField('serviceCode', event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t('companyPage.contactInfo')}</CardTitle>
              <CardDescription>{t('companyPage.contactInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t('companyPage.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={company.email}
                  onChange={(event) => updateCompanyField('email', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('companyPage.phoneNumber')}</Label>
                <Input
                  id="phoneNumber"
                  value={company.phoneNumber}
                  onChange={(event) => updateCompanyField('phoneNumber', event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>{t('companyPage.locations')}</CardTitle>
                <CardDescription>{t('companyPage.locationsDescription')}</CardDescription>
              </div>
              <Button onClick={addLocation} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('companyPage.addLocation')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {company.locations.map((location, index) => (
                <div key={location.id ?? `new-${index}`} className="rounded-lg border border-muted-foreground/20 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-lg font-semibold">
                      {location.name || t('companyPage.locationFallback', { index: index + 1 })}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`location-active-${index}`}
                        checked={location.isActive}
                        onCheckedChange={(checked) => updateLocationField(index, 'isActive', checked)}
                      />
                      <Label htmlFor={`location-active-${index}`}>
                        {location.isActive ? t('companyPage.statusActive') : t('companyPage.statusInactive')}
                      </Label>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        disabled={company.locations.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`location-name-${index}`}>{t('companyPage.locationName')}</Label>
                        <Input
                          id={`location-name-${index}`}
                          value={location.name}
                          onChange={(event) => updateLocationField(index, 'name', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`location-habilitation-${index}`}>{t('companyPage.habilitationCode')}</Label>
                        <Input
                          id={`location-habilitation-${index}`}
                          value={location.habilitationCode}
                          onChange={(event) =>
                            updateLocationField(index, 'habilitationCode', event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`location-address-${index}`}>{t('companyPage.address')}</Label>
                      <Textarea
                        id={`location-address-${index}`}
                        value={location.address}
                        onChange={(event) => updateLocationField(index, 'address', event.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`location-department-${index}`}>{t('companyPage.departmentCode')}</Label>
                        <ReferenceCombobox
                          id={`location-department-${index}`}
                          value={location.departmentCode ?? ''}
                          selectedOption={departmentOptions.find((option) => option.value === location.departmentCode) ?? null}
                          options={departmentOptions}
                          onChange={(value) => updateLocationField(index, 'departmentCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={departmentTableLabel}
                          disabled={departmentLoading || departmentOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {departmentErrorMessage && (
                          <p className="mt-1 text-sm text-destructive">{departmentErrorMessage}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`location-municipality-${index}`}>{t('companyPage.municipalityCode')}</Label>
                        <ReferenceCombobox
                          id={`location-municipality-${index}`}
                          value={location.municipalityCode ?? ''}
                          selectedOption={municipalityOptions.find((option) => option.value === location.municipalityCode) ?? null}
                          options={municipalityOptions}
                          onChange={(value) => updateLocationField(index, 'municipalityCode', value)}
                          placeholder={t('common.selectOption')}
                          tableLabel={municipalityTableLabel}
                          disabled={municipalityLoading || municipalityOptions.length === 0}
                          maxResults={MAX_REFERENCE_RESULTS}
                          messages={referenceComboboxMessages}
                        />
                        {municipalityErrorMessage && (
                          <p className="mt-1 text-sm text-destructive">{municipalityErrorMessage}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`location-phone-${index}`}>{t('companyPage.phoneNumber')}</Label>
                        <Input
                          id={`location-phone-${index}`}
                          value={location.phoneNumber}
                          onChange={(event) => updateLocationField(index, 'phoneNumber', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`location-email-${index}`}>{t('companyPage.email')}</Label>
                      <Input
                        id={`location-email-${index}`}
                        type="email"
                        value={location.email}
                        onChange={(event) => updateLocationField(index, 'email', event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('companyPage.saving') : t('companyPage.saveChanges')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
