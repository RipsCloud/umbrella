import type {
  ReferenceTableDefinition,
  ReferenceTableName,
  ReferenceTableRecordMap,
  ReferenceTableSourceMap,
} from './types'

const SERVICE_GROUPS_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_GrupoServicios.json'
const CUPS_PROCEDURES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_CUPS.json'
const SEXES_URL = 'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_Sexo.json'
const DOCUMENT_TYPES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_TipoDocumento.json'
const CARE_MODALITIES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_ModalidadAtencion.json'
const COLLECTION_CONCEPTS_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_ConceptoRecaudo.json'
const DIAGNOSIS_CODES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_CIE10.json'
const TECHNOLOGY_PURPOSES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_FinalidadTecnologiaSalud.json'
const SERVICE_CODES_URL = 'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_Servicios.json'
const ENTRY_ROUTES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_ViaIngresoServicioSalud.json'
const EXTERNAL_CAUSES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_CausaMotivoAtencion.json'
const DIAGNOSIS_TYPES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_TipoDiagnosticoPrincipal.json'
const MEDICATION_TYPES_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_TipoMedicamento.json'
const HEALTH_CONTRACTING_PAYMENT_METHODS_URL = '/ref/health-contracting-payment-methods.json'
const HEALTH_COVERAGES_URL = '/ref/health-coverages.json'
const HEALTH_TYPE_OPERATIONS_URL = '/ref/health-type-operations.json'
const HEALTH_TYPE_USERS_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_TipoUsuarioVersion2.json'
const INVOICE_DEPARTMENTS_URL = '/ref/invoice_departments.json'
const INVOICE_MUNICIPALITIES_URL = '/ref/invoice_municipalities.json'
const INVOICE_PAYMENT_FORMS_URL = '/ref/invoice_payment-forms.json'
const INVOICE_PAYMENT_METHODS_URL = '/ref/invoice_payment-methods.json'
const INVOICE_DOCUMENT_IDENTIFICATIONS_URL = '/ref/invoice_type-document-identifications.json'
const INVOICE_ORGANIZATION_TYPES_URL = '/ref/invoice_type-organizations.json'
const INVOICE_REGIMES_URL = '/ref/invoice_type-regimes.json'
const INVOICE_UNIT_MEASURES_URL = '/ref/invoice_unit-measures.json'
const INVOICE_CODES_URL = '/ref/invoice_codes.json'
const ZONA_TERRITORIAL_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_ZonaTerritorial.json'
const PAISES_URL = 'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_Pais.json'
const MUNICIPIOS_URL =
  'https://cdn-minsalud.pahventure.com/ref/Rips.REFs_Municipios.json'

type ReferenceTableDefinitionMap = {
  [K in ReferenceTableName]: ReferenceTableDefinition<K>
}

export const referenceTableDefinitions: ReferenceTableDefinitionMap = {
  serviceGroups: {
    table: 'serviceGroups',
    labelKey: 'referenceData.tables.serviceGroups',
    sourceUrl: SERVICE_GROUPS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['serviceGroups']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo,
        name: record.Nombre,
        description: record.Descripcion ?? null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: `${record.code} ${record.name} ${record.description ?? ''}`.toLowerCase(),
    }),
  },
  procedureCodes: {
    table: 'procedureCodes',
    labelKey: 'referenceData.tables.procedureCodes',
    sourceUrl: CUPS_PROCEDURES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['procedureCodes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const section = record.Descripcion?.trim() || null
      const tagValues = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
      const tags = tagValues
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        section,
        tags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => {
      const label = `${record.code} · ${record.name}`
      const searchComponents = [record.code, record.name, record.section ?? '', ...record.tags]
      const searchText = searchComponents
        .map((component) => component?.toString().toLowerCase().trim())
        .filter((component) => Boolean(component && component.length > 0))
        .join(' ')

      return {
        value: record.code,
        label,
        description: record.section ?? null,
        searchText,
      }
    },
  },
  sexes: {
    table: 'sexes',
    labelKey: 'referenceData.tables.sexes',
    sourceUrl: SEXES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['sexes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        numericCode: record.Extra_I?.trim() || null,
        categoryCode: record.Extra_II?.trim() || null,
        letterCode: record.Extra_III?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => {
      const label = `${record.code} · ${record.name}`
      const searchParts = [
        record.code,
        record.name,
        record.description ?? '',
        record.numericCode ?? '',
        record.categoryCode ?? '',
        record.letterCode ?? '',
      ]
      return {
        value: record.code,
        label,
        description: record.description ?? null,
        searchText: searchParts
          .map((part) => part.toString().toLowerCase().trim())
          .filter((part) => part.length > 0)
          .join(' '),
      }
    },
  },
  documentTypes: {
    table: 'documentTypes',
    labelKey: 'referenceData.tables.documentTypes',
    sourceUrl: DOCUMENT_TYPES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['documentTypes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => {
      const label = `${record.code} · ${record.name}`
      const searchText = [record.code, record.name, record.description ?? '']
        .map((value) => value?.toString().toLowerCase().trim())
        .filter((value) => value && value.length > 0)
        .join(' ')

      return {
        value: record.code,
        label,
        description: record.description ?? null,
        searchText,
      }
    },
  },
  careModalities: {
    table: 'careModalities',
    labelKey: 'referenceData.tables.careModalities',
    sourceUrl: CARE_MODALITIES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['careModalities']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const flags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '', record.flags.join(' ')]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  collectionConcepts: {
    table: 'collectionConcepts',
    labelKey: 'referenceData.tables.collectionConcepts',
    sourceUrl: COLLECTION_CONCEPTS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['collectionConcepts']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const extraValues = [
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
      const flags = extraValues
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => {
      const label = `${record.code} · ${record.name}`
      const searchParts = [record.code, record.name, record.description ?? '', ...record.flags]
      return {
        value: record.code,
        label,
        description: record.description ?? null,
        searchText: searchParts
          .map((part) => part.toString().toLowerCase().trim())
          .filter((part) => part.length > 0)
          .join(' '),
      }
    },
  },
  diagnosisCodes: {
    table: 'diagnosisCodes',
    labelKey: 'referenceData.tables.diagnosisCodes',
    sourceUrl: DIAGNOSIS_CODES_URL,
    version: 2,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['diagnosisCodes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const tags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        cieCode: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        chapter: record.Extra_V?.trim() || null,
        parentCode: record.Extra_VI?.trim() || null,
        year: null,
        tags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => {
      const label = `${record.code} · ${record.name}`
      const description = record.description ?? record.chapter
      return {
        value: record.code,
        label,
        description,
        searchText: [record.code, record.name, description ?? '', record.parentCode ?? '', ...record.tags]
          .map((part) => part?.toString().toLowerCase().trim())
          .filter((part) => part && part.length > 0)
          .join(' '),
      }
    },
  },
  consultationPurposes: {
    table: 'consultationPurposes',
    labelKey: 'referenceData.tables.consultationPurposes',
    sourceUrl: TECHNOLOGY_PURPOSES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['consultationPurposes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const flags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '', record.flags.join(' ')]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  serviceCodes: {
    table: 'serviceCodes',
    labelKey: 'referenceData.tables.serviceCodes',
    sourceUrl: SERVICE_CODES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['serviceCodes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const flags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        category: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.category ?? null,
      searchText: [record.code, record.name, record.category ?? '', record.flags.join(' ')]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  entryRoutes: {
    table: 'entryRoutes',
    labelKey: 'referenceData.tables.entryRoutes',
    sourceUrl: ENTRY_ROUTES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['entryRoutes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const flags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '', record.flags.join(' ')]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  externalCauses: {
    table: 'externalCauses',
    labelKey: 'referenceData.tables.externalCauses',
    sourceUrl: EXTERNAL_CAUSES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['externalCauses']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const flags = [
        record.Descripcion,
        record.Extra_I,
        record.Extra_II,
        record.Extra_III,
        record.Extra_IV,
        record.Extra_V,
        record.Extra_VI,
        record.Extra_VII,
        record.Extra_VIII,
        record.Extra_IX,
        record.Extra_X,
        record.Valor,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        flags,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '', record.flags.join(' ')]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  diagnosisTypes: {
    table: 'diagnosisTypes',
    labelKey: 'referenceData.tables.diagnosisTypes',
    sourceUrl: DIAGNOSIS_TYPES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['diagnosisTypes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '']
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  medicationTypes: {
    table: 'medicationTypes',
    labelKey: 'referenceData.tables.medicationTypes',
    sourceUrl: MEDICATION_TYPES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['medicationTypes']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      const description = record.Descripcion?.trim() || null

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '']
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  healthContractingPaymentMethods: {
    table: 'healthContractingPaymentMethods',
    labelKey: 'referenceData.tables.healthContractingPaymentMethods',
    sourceUrl: HEALTH_CONTRACTING_PAYMENT_METHODS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['healthContractingPaymentMethods']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  healthCoverages: {
    table: 'healthCoverages',
    labelKey: 'referenceData.tables.healthCoverages',
    sourceUrl: HEALTH_COVERAGES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['healthCoverages']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  healthTypeOperations: {
    table: 'healthTypeOperations',
    labelKey: 'referenceData.tables.healthTypeOperations',
    sourceUrl: HEALTH_TYPE_OPERATIONS_URL,
    version: 2,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['healthTypeOperations']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.id.toString().padStart(2, '0'),
      label: record.name,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  healthTypeUsers: {
    table: 'healthTypeUsers',
    labelKey: 'referenceData.tables.healthTypeUsers',
    sourceUrl: HEALTH_TYPE_USERS_URL,
    version: 2,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['healthTypeUsers']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '']
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  invoiceDepartments: {
    table: 'invoiceDepartments',
    labelKey: 'referenceData.tables.invoiceDepartments',
    sourceUrl: INVOICE_DEPARTMENTS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceDepartments']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        countryId: record.country_id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name, record.countryId?.toString() ?? '']
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  invoiceMunicipalities: {
    table: 'invoiceMunicipalities',
    labelKey: 'referenceData.tables.invoiceMunicipalities',
    sourceUrl: INVOICE_MUNICIPALITIES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceMunicipalities']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        departmentId: record.department_id,
        code: record.code.trim(),
        name: record.name.trim(),
        billingCode: record.codefacturador ?? null,
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [
        record.code,
        record.name,
        record.departmentId?.toString() ?? '',
        record.billingCode?.toString() ?? '',
      ]
        .join(' ')
        .trim()
        .toLowerCase(),
    }),
  },
  invoicePaymentForms: {
    table: 'invoicePaymentForms',
    labelKey: 'referenceData.tables.invoicePaymentForms',
    sourceUrl: INVOICE_PAYMENT_FORMS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoicePaymentForms']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  invoicePaymentMethods: {
    table: 'invoicePaymentMethods',
    labelKey: 'referenceData.tables.invoicePaymentMethods',
    sourceUrl: INVOICE_PAYMENT_METHODS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoicePaymentMethods']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  invoiceDocumentIdentifications: {
    table: 'invoiceDocumentIdentifications',
    labelKey: 'referenceData.tables.invoiceDocumentIdentifications',
    sourceUrl: INVOICE_DOCUMENT_IDENTIFICATIONS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceDocumentIdentifications']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  invoiceOrganizationTypes: {
    table: 'invoiceOrganizationTypes',
    labelKey: 'referenceData.tables.invoiceOrganizationTypes',
    sourceUrl: INVOICE_ORGANIZATION_TYPES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceOrganizationTypes']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  invoiceRegimes: {
    table: 'invoiceRegimes',
    labelKey: 'referenceData.tables.invoiceRegimes',
    sourceUrl: INVOICE_REGIMES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceRegimes']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  invoiceUnitMeasures: {
    table: 'invoiceUnitMeasures',
    labelKey: 'referenceData.tables.invoiceUnitMeasures',
    sourceUrl: INVOICE_UNIT_MEASURES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['invoiceUnitMeasures']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        createdAt: record.created_at ?? null,
        updatedAt: record.updated_at ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      searchText: [record.code, record.name].join(' ').toLowerCase(),
    }),
  },
  zonaTerritorial: {
    table: 'zonaTerritorial',
    labelKey: 'referenceData.tables.zonaTerritorial',
    sourceUrl: ZONA_TERRITORIAL_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['zonaTerritorial']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        description: record.Descripcion?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? null,
      searchText: [record.code, record.name, record.description ?? '']
        .map((part) => part?.toString().toLowerCase().trim())
        .filter((part) => part && part.length > 0)
        .join(' '),
    }),
  },
  paises: {
    table: 'paises',
    labelKey: 'referenceData.tables.paises',
    sourceUrl: PAISES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['paises']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        twoLetterCode: record.Extra_II?.trim() || null,
        threeLetterCode: record.Extra_III?.trim() || null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: record.name,
      description: record.twoLetterCode ?? undefined,
      searchText: [record.code, record.name, record.twoLetterCode ?? '', record.threeLetterCode ?? '']
        .join(' ')
        .toLowerCase(),
    }),
  },
  municipios: {
    table: 'municipios',
    labelKey: 'referenceData.tables.municipios',
    sourceUrl: MUNICIPIOS_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['municipios']) => {
      if (!record?.Codigo || !record.Nombre) {
        return null
      }

      return {
        id: record.ID,
        code: record.Codigo.trim(),
        name: record.Nombre.trim(),
        departmentCode: record.Extra_I?.trim() || null,
        isEnabled: record.Habilitado,
        createdAt: record.CreationDateTime,
        updatedAt: record.LastUpdateDateTime ?? null,
        raw: record,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: record.name,
      description: record.departmentCode ?? undefined,
      searchText: [record.code, record.name, record.departmentCode ?? '']
        .join(' ')
        .toLowerCase(),
    }),
  },
  multipleCodes: {
    table: 'multipleCodes',
    labelKey: 'referenceData.tables.multipleCodes',
    sourceUrl: INVOICE_CODES_URL,
    version: 1,
    primaryKey: 'code',
    transform: (record: ReferenceTableSourceMap['multipleCodes']) => {
      if (!record?.code || !record.name) {
        return null
      }

      return {
        id: record.id,
        code: record.code.trim(),
        name: record.name.trim(),
        description: record.description?.trim() || null,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt ?? null,
      }
    },
    toOption: (record) => ({
      value: record.code,
      label: `${record.code} · ${record.name}`,
      description: record.description ?? undefined,
      searchText: [record.code, record.name, record.description ?? '']
        .join(' ')
        .toLowerCase(),
    }),
  },
}

export const referenceTableList = Object.values(referenceTableDefinitions)

export const getReferenceTableDefinition = <TTable extends ReferenceTableName>(
  table: TTable,
): ReferenceTableDefinitionMap[TTable] => referenceTableDefinitions[table]

export type ReferenceTableRecord<T extends ReferenceTableName> = ReferenceTableRecordMap[T]
