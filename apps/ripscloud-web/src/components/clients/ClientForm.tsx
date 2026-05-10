import { useEffect, useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import { useReferenceData, useReferenceTableRecords } from '@/context/useReferenceData'
import { referenceTableDefinitions } from '@/lib/reference-data/referenceTables'
import type { ReferenceOption } from '@/lib/reference-data/types'
import type { ClientFormValues } from './clientForm.schema'

const MAX_REFERENCE_RESULTS = 100

export interface ClientFormLabels {
  nit: string
  verificationDigit: string
  companyName: string
  commercialName: string
  taxRegime: string
  taxRegimePlaceholder: string
  economicActivityCode: string
  address: string
  departmentCode: string
  departmentPlaceholder: string
  municipalityCode: string
  municipalityPlaceholder: string
  municipalityDisabledPlaceholder: string
  phoneNumber: string
  email: string
  typeOrganizationId: string
  typeOrganizationIdPlaceholder: string
  typeDocumentIdentificationId: string
  typeDocumentIdentificationIdPlaceholder: string
  isActive: string
  statusHint?: string
}

interface ClientFormProps {
  form: UseFormReturn<ClientFormValues>
  labels: ClientFormLabels
  disabled?: boolean
}

export function ClientForm({ form, labels, disabled = false }: ClientFormProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form

  const { errors: referenceSyncErrors } = useReferenceData()
  const {
    records: taxRegimeRecords,
    loading: taxRegimeLoading,
    error: taxRegimeLoadError,
  } = useReferenceTableRecords('invoiceRegimes')
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
    records: organizationTypeRecords,
    loading: organizationTypeLoading,
  } = useReferenceTableRecords('invoiceOrganizationTypes')
  const {
    records: documentIdentificationRecords,
    loading: documentIdentificationLoading,
  } = useReferenceTableRecords('invoiceDocumentIdentifications')

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

  const invoiceRegimeDefinition = referenceTableDefinitions.invoiceRegimes
  const invoiceDepartmentDefinition = referenceTableDefinitions.invoiceDepartments
  const invoiceMunicipalityDefinition = referenceTableDefinitions.invoiceMunicipalities

  const selectedDepartmentCode = watch('departmentCode')
  const selectedMunicipalityCode = watch('municipalityCode')

  const departmentById = useMemo(() => {
    const map = new Map<number, (typeof departmentRecords)[number]>()
    departmentRecords.forEach((record) => {
      map.set(record.id, record)
    })
    return map
  }, [departmentRecords])

  const selectedDepartment = useMemo(
    () => departmentRecords.find((record) => record.code === selectedDepartmentCode),
    [departmentRecords, selectedDepartmentCode],
  )

  const taxRegimeOptions = useMemo<ReferenceOption[]>(() => {
    if (!taxRegimeRecords.length) {
      return []
    }
    return taxRegimeRecords.map((record) =>
      invoiceRegimeDefinition.toOption
        ? invoiceRegimeDefinition.toOption(record)
        : {
            value: record.code,
            label: `${record.code} · ${record.name}`,
            searchText: `${record.code} ${record.name}`.toLowerCase(),
          },
    )
  }, [invoiceRegimeDefinition, taxRegimeRecords])

  const departmentOptions = useMemo<ReferenceOption[]>(() => {
    if (!departmentRecords.length) {
      return []
    }
    return [...departmentRecords]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((record) =>
        invoiceDepartmentDefinition.toOption
          ? invoiceDepartmentDefinition.toOption(record)
          : {
              value: record.code,
              label: `${record.code} · ${record.name}`,
              searchText: `${record.code} ${record.name}`.toLowerCase(),
            },
      )
  }, [departmentRecords, invoiceDepartmentDefinition])

  const filteredMunicipalityRecords = useMemo(() => {
    if (!selectedDepartment) {
      return []
    }
    return municipalityRecords
      .filter((record) => record.departmentId === selectedDepartment.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [municipalityRecords, selectedDepartment])

  const municipalityOptions = useMemo<ReferenceOption[]>(() => {
    if (!filteredMunicipalityRecords.length) {
      return []
    }
    return filteredMunicipalityRecords.map((record) => {
      const department = departmentById.get(record.departmentId)
      const description = department ? `${department.code} · ${department.name}` : null
      const searchParts = [
        record.code,
        record.name,
        department?.name ?? '',
        department?.code ?? '',
      ]
      return {
        value: record.code,
        label: `${record.code} · ${record.name}`,
        description,
        searchText: searchParts
          .join(' ')
          .trim()
          .toLowerCase(),
      }
    })
  }, [departmentById, filteredMunicipalityRecords])

  const taxRegimeTableLabel = t(invoiceRegimeDefinition.labelKey)
  const departmentTableLabel = t(invoiceDepartmentDefinition.labelKey)
  const municipalityTableLabel = t(invoiceMunicipalityDefinition.labelKey)

  const taxRegimeErrorMessage =
    referenceSyncErrors?.invoiceRegimes || taxRegimeLoadError
      ? t('referenceData.errors.loadTable', { table: taxRegimeTableLabel })
      : null
  const departmentErrorMessage =
    referenceSyncErrors?.invoiceDepartments || departmentLoadError
      ? t('referenceData.errors.loadTable', { table: departmentTableLabel })
      : null
  const municipalityErrorMessage =
    referenceSyncErrors?.invoiceMunicipalities || municipalityLoadError
      ? t('referenceData.errors.loadTable', { table: municipalityTableLabel })
      : null

  const municipalityPlaceholder = selectedDepartmentCode
    ? labels.municipalityPlaceholder
    : labels.municipalityDisabledPlaceholder

  useEffect(() => {
    if (!selectedDepartmentCode) {
      if (selectedMunicipalityCode) {
        setValue('municipalityCode', '', { shouldValidate: true, shouldDirty: true })
      }
      return
    }
    const departmentRecord = departmentRecords.find((record) => record.code === selectedDepartmentCode)
    if (!departmentRecord) {
      return
    }
    if (!selectedMunicipalityCode) {
      return
    }
    const municipalityRecord = municipalityRecords.find((record) => record.code === selectedMunicipalityCode)
    if (municipalityRecord && municipalityRecord.departmentId !== departmentRecord.id) {
      setValue('municipalityCode', '', { shouldValidate: true, shouldDirty: true })
    }
  }, [
    departmentRecords,
    municipalityRecords,
    selectedDepartmentCode,
    selectedMunicipalityCode,
    setValue,
  ])

  const isMunicipalityDisabled =
    disabled ||
    !selectedDepartment ||
    municipalityLoading ||
    municipalityOptions.length === 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="nit">{labels.nit}</Label>
          <Input id="nit" disabled={disabled} {...register('nit')} />
          {errors.nit && <p className="text-xs text-destructive mt-1">{errors.nit.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="verificationDigit">{labels.verificationDigit}</Label>
          <Input id="verificationDigit" maxLength={2} disabled={disabled} {...register('verificationDigit')} />
          {errors.verificationDigit && (
            <p className="text-xs text-destructive mt-1">{errors.verificationDigit.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">{labels.companyName}</Label>
          <Input id="companyName" disabled={disabled} {...register('companyName')} />
          {errors.companyName && (
            <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="commercialName">{labels.commercialName}</Label>
          <Input id="commercialName" disabled={disabled} {...register('commercialName')} />
          {errors.commercialName && (
            <p className="text-xs text-destructive mt-1">{errors.commercialName.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="taxRegime">{labels.taxRegime}</Label>
          <Controller
            control={control}
            name="taxRegime"
            render={({ field }) => (
              <ReferenceCombobox
                id="taxRegime"
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
                options={taxRegimeOptions}
                tableLabel={taxRegimeTableLabel}
                placeholder={labels.taxRegimePlaceholder}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
                disabled={disabled || taxRegimeLoading || taxRegimeOptions.length === 0}
              />
            )}
          />
          {taxRegimeErrorMessage ? (
            <p className="text-xs text-destructive mt-1">{taxRegimeErrorMessage}</p>
          ) : null}
          {errors.taxRegime && (
            <p className="text-xs text-destructive mt-1">{errors.taxRegime.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="economicActivityCode">{labels.economicActivityCode}</Label>
          <Input id="economicActivityCode" disabled={disabled} {...register('economicActivityCode')} />
          {errors.economicActivityCode && (
            <p className="text-xs text-destructive mt-1">{errors.economicActivityCode.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{labels.address}</Label>
        <Textarea
          id="address"
          rows={3}
          className="resize-none"
          disabled={disabled}
          {...register('address')}
        />
        {errors.address && (
          <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departmentCode">{labels.departmentCode}</Label>
          <Controller
            control={control}
            name="departmentCode"
            render={({ field }) => (
              <ReferenceCombobox
                id="departmentCode"
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
                options={departmentOptions}
                tableLabel={departmentTableLabel}
                placeholder={labels.departmentPlaceholder}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
                disabled={disabled || departmentLoading || departmentOptions.length === 0}
              />
            )}
          />
          {departmentErrorMessage ? (
            <p className="text-xs text-destructive mt-1">{departmentErrorMessage}</p>
          ) : null}
          {errors.departmentCode && (
            <p className="text-xs text-destructive mt-1">{errors.departmentCode.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="municipalityCode">{labels.municipalityCode}</Label>
          <Controller
            control={control}
            name="municipalityCode"
            render={({ field }) => (
              <ReferenceCombobox
                id="municipalityCode"
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
                options={municipalityOptions}
                tableLabel={municipalityTableLabel}
                placeholder={municipalityPlaceholder}
                messages={referenceComboboxMessages}
                maxResults={MAX_REFERENCE_RESULTS}
                disabled={isMunicipalityDisabled}
              />
            )}
          />
          {municipalityErrorMessage ? (
            <p className="text-xs text-destructive mt-1">{municipalityErrorMessage}</p>
          ) : null}
          {errors.municipalityCode && (
            <p className="text-xs text-destructive mt-1">{errors.municipalityCode.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">{labels.phoneNumber}</Label>
          <Input id="phoneNumber" disabled={disabled} {...register('phoneNumber')} />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{labels.email}</Label>
          <Input id="email" type="email" disabled={disabled} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="typeOrganizationId">{labels.typeOrganizationId}</Label>
          <Controller
            control={control}
            name="typeOrganizationId"
            render={({ field }) => (
              <Select 
                value={String(field.value)} 
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={disabled || organizationTypeLoading || organizationTypeRecords.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.typeOrganizationIdPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {organizationTypeRecords.map((record) => (
                    <SelectItem key={record.id} value={String(record.id)}>
                      {record.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.typeOrganizationId && (
            <p className="text-xs text-destructive mt-1">{errors.typeOrganizationId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="typeDocumentIdentificationId">{labels.typeDocumentIdentificationId}</Label>
          <Controller
            control={control}
            name="typeDocumentIdentificationId"
            render={({ field }) => (
              <Select 
                value={String(field.value)} 
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={disabled || documentIdentificationLoading || documentIdentificationRecords.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.typeDocumentIdentificationIdPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {documentIdentificationRecords.map((record) => (
                    <SelectItem key={record.id} value={String(record.id)}>
                      {record.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.typeDocumentIdentificationId && (
            <p className="text-xs text-destructive mt-1">{errors.typeDocumentIdentificationId.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-1">
          <Label htmlFor="isActive" className="font-medium">
            {labels.isActive}
          </Label>
          {labels.statusHint ? (
            <p className="text-xs text-muted-foreground">{labels.statusHint}</p>
          ) : null}
        </div>
        <Switch
          id="isActive"
          disabled={disabled}
          checked={watch('isActive')}
          onCheckedChange={(checked) =>
            setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })
          }
        />
      </div>
    </div>
  )
}
