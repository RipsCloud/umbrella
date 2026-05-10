export type ReferenceTableName =
  | 'serviceGroups'
  | 'procedureCodes'
  | 'sexes'
  | 'documentTypes'
  | 'careModalities'
  | 'collectionConcepts'
  | 'diagnosisCodes'
  | 'consultationPurposes'
  | 'serviceCodes'
  | 'entryRoutes'
  | 'externalCauses'
  | 'diagnosisTypes'
  | 'medicationTypes'
  | 'healthContractingPaymentMethods'
  | 'healthCoverages'
  | 'healthTypeOperations'
  | 'healthTypeUsers'
  | 'invoiceDepartments'
  | 'invoiceMunicipalities'
  | 'invoicePaymentForms'
  | 'invoicePaymentMethods'
  | 'invoiceDocumentIdentifications'
  | 'invoiceOrganizationTypes'
  | 'invoiceRegimes'
  | 'invoiceUnitMeasures'
  | 'zonaTerritorial'
  | 'paises'
  | 'municipios'
  | 'multipleCodes'

export interface ReferenceOption {
  value: string
  label: string
  description?: string | null
  searchText?: string
}

export interface ServiceGroupSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ServiceGroupRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ServiceGroupSourceRecord
}

export interface ProcedureCodeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ProcedureCodeRecord {
  id: number
  code: string
  name: string
  section?: string | null
  tags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ProcedureCodeSourceRecord
}

export interface SexSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface SexRecord {
  id: number
  code: string
  name: string
  description?: string | null
  numericCode?: string | null
  categoryCode?: string | null
  letterCode?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: SexSourceRecord
}

export interface DocumentTypeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface DocumentTypeRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: DocumentTypeSourceRecord
}

export interface CareModalitySourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface CareModalityRecord {
  id: number
  code: string
  name: string
  description?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: CareModalitySourceRecord
}

export interface CollectionConceptSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface CollectionConceptRecord {
  id: number
  code: string
  name: string
  description?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: CollectionConceptSourceRecord
}

export interface DiagnosisCodeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface DiagnosisCodeRecord {
  id: number
  code: string
  cieCode: string
  name: string
  description?: string | null
  chapter?: string | null
  parentCode?: string | null
  year?: string | null
  tags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: DiagnosisCodeSourceRecord
}

export interface ConsultationPurposeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ConsultationPurposeRecord {
  id: number
  code: string
  name: string
  description?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ConsultationPurposeSourceRecord
}

export interface ServiceCodeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ServiceCodeRecord {
  id: number
  code: string
  name: string
  category?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ServiceCodeSourceRecord
}

export interface EntryRouteSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface EntryRouteRecord {
  id: number
  code: string
  name: string
  description?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: EntryRouteSourceRecord
}

export interface ExternalCauseSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ExternalCauseRecord {
  id: number
  code: string
  name: string
  description?: string | null
  flags: string[]
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ExternalCauseSourceRecord
}

export interface DiagnosisTypeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface DiagnosisTypeRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: DiagnosisTypeSourceRecord
}

export interface MedicationTypeSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface MedicationTypeRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: MedicationTypeSourceRecord
}

export interface HealthContractingPaymentMethodSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface HealthContractingPaymentMethodRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface HealthCoverageSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface HealthCoverageRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface HealthTypeOperationSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface HealthTypeOperationRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface HealthTypeUserSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface HealthTypeUserRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: HealthTypeUserSourceRecord
}

export interface InvoiceDepartmentSourceRecord {
  id: number
  country_id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceDepartmentRecord {
  id: number
  countryId: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoiceMunicipalitySourceRecord {
  id: number
  department_id: number
  name: string
  code: string
  codefacturador?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceMunicipalityRecord {
  id: number
  departmentId: number
  code: string
  name: string
  billingCode?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoicePaymentFormSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoicePaymentFormRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoicePaymentMethodSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoicePaymentMethodRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoiceDocumentIdentificationSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceDocumentIdentificationRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoiceOrganizationTypeSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceOrganizationTypeRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoiceRegimeSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceRegimeRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InvoiceUnitMeasureSourceRecord {
  id: number
  name: string
  code: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvoiceUnitMeasureRecord {
  id: number
  code: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ZonaTerritorialSourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface ZonaTerritorialRecord {
  id: number
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: ZonaTerritorialSourceRecord
}

export interface CountrySourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface CountryRecord {
  id: number
  code: string
  name: string
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  twoLetterCode?: string | null
  threeLetterCode?: string | null
  raw?: CountrySourceRecord
}

export interface MunicipalitySourceRecord {
  ID: number
  Codigo: string
  Nombre: string
  Descripcion?: string | null
  Habilitado: boolean
  CreationDateTime: string
  LastUpdateDateTime?: string | null
  Extra_I?: string | null
  Extra_II?: string | null
  Extra_III?: string | null
  Extra_IV?: string | null
  Extra_V?: string | null
  Extra_VI?: string | null
  Extra_VII?: string | null
  Extra_VIII?: string | null
  Extra_IX?: string | null
  Extra_X?: string | null
  Valor?: string | null
}

export interface MunicipalityRecord {
  id: number
  code: string
  name: string
  departmentCode?: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: MunicipalitySourceRecord
}

export interface MultipleCodeSourceRecord {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}

export interface MultipleCodeRecord {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
  raw?: MultipleCodeSourceRecord
}

export type ReferenceTableRecordMap = {
  serviceGroups: ServiceGroupRecord
  procedureCodes: ProcedureCodeRecord
  sexes: SexRecord
  documentTypes: DocumentTypeRecord
  careModalities: CareModalityRecord
  collectionConcepts: CollectionConceptRecord
  diagnosisCodes: DiagnosisCodeRecord
  consultationPurposes: ConsultationPurposeRecord
  serviceCodes: ServiceCodeRecord
  entryRoutes: EntryRouteRecord
  externalCauses: ExternalCauseRecord
  diagnosisTypes: DiagnosisTypeRecord
  medicationTypes: MedicationTypeRecord
  healthContractingPaymentMethods: HealthContractingPaymentMethodRecord
  healthCoverages: HealthCoverageRecord
  healthTypeOperations: HealthTypeOperationRecord
  healthTypeUsers: HealthTypeUserRecord
  invoiceDepartments: InvoiceDepartmentRecord
  invoiceMunicipalities: InvoiceMunicipalityRecord
  invoicePaymentForms: InvoicePaymentFormRecord
  invoicePaymentMethods: InvoicePaymentMethodRecord
  invoiceDocumentIdentifications: InvoiceDocumentIdentificationRecord
  invoiceOrganizationTypes: InvoiceOrganizationTypeRecord
  invoiceRegimes: InvoiceRegimeRecord
  invoiceUnitMeasures: InvoiceUnitMeasureRecord
  zonaTerritorial: ZonaTerritorialRecord
  paises: CountryRecord
  municipios: MunicipalityRecord
  multipleCodes: MultipleCodeRecord
}

export type ReferenceTableSourceMap = {
  serviceGroups: ServiceGroupSourceRecord
  procedureCodes: ProcedureCodeSourceRecord
  sexes: SexSourceRecord
  documentTypes: DocumentTypeSourceRecord
  careModalities: CareModalitySourceRecord
  collectionConcepts: CollectionConceptSourceRecord
  diagnosisCodes: DiagnosisCodeSourceRecord
  consultationPurposes: ConsultationPurposeSourceRecord
  serviceCodes: ServiceCodeSourceRecord
  entryRoutes: EntryRouteSourceRecord
  externalCauses: ExternalCauseSourceRecord
  diagnosisTypes: DiagnosisTypeSourceRecord
  medicationTypes: MedicationTypeSourceRecord
  healthContractingPaymentMethods: HealthContractingPaymentMethodSourceRecord
  healthCoverages: HealthCoverageSourceRecord
  healthTypeOperations: HealthTypeOperationSourceRecord
  healthTypeUsers: HealthTypeUserSourceRecord
  invoiceDepartments: InvoiceDepartmentSourceRecord
  invoiceMunicipalities: InvoiceMunicipalitySourceRecord
  invoicePaymentForms: InvoicePaymentFormSourceRecord
  invoicePaymentMethods: InvoicePaymentMethodSourceRecord
  invoiceDocumentIdentifications: InvoiceDocumentIdentificationSourceRecord
  invoiceOrganizationTypes: InvoiceOrganizationTypeSourceRecord
  invoiceRegimes: InvoiceRegimeSourceRecord
  invoiceUnitMeasures: InvoiceUnitMeasureSourceRecord
  zonaTerritorial: ZonaTerritorialSourceRecord
  paises: CountrySourceRecord
  municipios: MunicipalitySourceRecord
  multipleCodes: MultipleCodeSourceRecord
}

export interface ReferenceTableDefinition<TTable extends ReferenceTableName> {
  table: TTable
  sourceUrl: string
  labelKey: string
  version: number
  primaryKey: keyof ReferenceTableRecordMap[TTable] & string
  transform: (
    record: ReferenceTableSourceMap[TTable],
  ) => ReferenceTableRecordMap[TTable] | null
  toOption?: (record: ReferenceTableRecordMap[TTable]) => ReferenceOption
}

export interface ReferenceTableMetadata {
  table: ReferenceTableName
  version: number
  checksum: string
  recordCount: number
  lastSyncedAt: number
  /**
   * HTTP ETag returned by the CDN on the last successful fetch. Sent back
   * as `If-None-Match` on subsequent syncs so the CDN can short-circuit
   * with a 304 Not Modified — no body transfer, no parse, no IDB write.
   * Bumped to a fresh value on every 200 response.
   */
  etag?: string | null
}
