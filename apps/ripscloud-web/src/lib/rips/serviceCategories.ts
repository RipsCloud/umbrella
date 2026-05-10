import {
  RipsAdminDomainValueObjectsServiceCategory,
} from '@/api'
import type { ReferenceTableName } from '@/lib/reference-data/types'

export type CategorySlug =
  | 'consultas'
  | 'procedimientos'
  | 'urgencias'
  | 'hospitalizacion'
  | 'recien-nacidos'
  | 'medicamentos'
  | 'otros-servicios'

export type ServiceCategoryValue =
  (typeof RipsAdminDomainValueObjectsServiceCategory)[keyof typeof RipsAdminDomainValueObjectsServiceCategory]

export const CATEGORY_CONFIG: Record<
  CategorySlug,
  { value: ServiceCategoryValue; labelKey: string; descriptionKey: string }
> = {
  consultas: {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_1,
    labelKey: 'serviceCategories.consultas',
    descriptionKey: 'servicesManager.descriptions.consultas',
  },
  procedimientos: {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_2,
    labelKey: 'serviceCategories.procedimientos',
    descriptionKey: 'servicesManager.descriptions.procedimientos',
  },
  urgencias: {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_3,
    labelKey: 'serviceCategories.urgencias',
    descriptionKey: 'servicesManager.descriptions.urgencias',
  },
  hospitalizacion: {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_4,
    labelKey: 'serviceCategories.hospitalizacion',
    descriptionKey: 'servicesManager.descriptions.hospitalizacion',
  },
  'recien-nacidos': {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_5,
    labelKey: 'serviceCategories.recienNacidos',
    descriptionKey: 'servicesManager.descriptions.recienNacidos',
  },
  medicamentos: {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_6,
    labelKey: 'serviceCategories.medicamentos',
    descriptionKey: 'servicesManager.descriptions.medicamentos',
  },
  'otros-servicios': {
    value: RipsAdminDomainValueObjectsServiceCategory.NUMBER_7,
    labelKey: 'serviceCategories.otrosServicios',
    descriptionKey: 'servicesManager.descriptions.otrosServicios',
  },
}

export type FieldType = 'text' | 'number' | 'date' | 'datetime'

export interface FieldConfig {
  key: string
  type: FieldType
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  referenceTable?: ReferenceTableName
}

export const CATEGORY_FIELDS: Record<ServiceCategoryValue, FieldConfig[]> = {
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_1]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 12, maxLength: 12 },
    { key: 'fechaInicioAtencion', type: 'datetime', required: true },
    { key: 'numAutorizacion', type: 'text', maxLength: 30 },
    {
      key: 'codConsulta',
      type: 'text',
      minLength: 6,
      maxLength: 6,
      referenceTable: 'procedureCodes',
    },
    {
      key: 'modalidadGrupoServicioTecSal',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'careModalities',
    },
    {
      key: 'grupoServicios',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'serviceGroups',
    },
    {
      key: 'codServicio',
      type: 'number',
      required: true,
      min: 100,
      max: 9999,
      referenceTable: 'serviceCodes',
    },
    {
      key: 'finalidadTecnologiaSalud',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'consultationPurposes',
    },
    {
      key: 'causaMotivoAtencion',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'externalCauses',
    },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionado1',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      pattern: /^\S+$/,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionado2',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionado3',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'tipoDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'diagnosisTypes',
    },
    {
      key: 'tipoDocumentoIdentificacion',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'documentTypes',
    },
    { key: 'numDocumentoIdentificacion', type: 'text', required: true, minLength: 4, maxLength: 20 },
    { key: 'vrServicio', type: 'number', required: true, min: 0, max: 999999999999 },
    {
      key: 'conceptoRecaudo',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'collectionConcepts',
    },
    { key: 'valorPagoModerador', type: 'number', required: true, min: 0, max: 999999999999 },
    { key: 'numFEVPagoModerador', type: 'text', maxLength: 30 },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_2]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 12, maxLength: 12 },
    { key: 'fechaInicioAtencion', type: 'datetime', required: true },
    { key: 'idMIPRES', type: 'text', pattern: /^[1-9]{1}[0-9]{0,14}$/ },
    { key: 'numAutorizacion', type: 'text', maxLength: 30 },
    {
      key: 'codProcedimiento',
      type: 'text',
      minLength: 6,
      maxLength: 6,
      referenceTable: 'procedureCodes',
    },
    {
      key: 'viaIngresoServicioSalud',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'entryRoutes',
    },
    {
      key: 'modalidadGrupoServicioTecSal',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'careModalities',
    },
    {
      key: 'grupoServicios',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'serviceGroups',
    },
    {
      key: 'codServicio',
      type: 'number',
      required: true,
      min: 100,
      max: 9999,
      referenceTable: 'serviceCodes',
    },
    {
      key: 'finalidadTecnologiaSalud',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'consultationPurposes',
    },
    {
      key: 'tipoDocumentoIdentificacion',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'documentTypes',
    },
    { key: 'numDocumentoIdentificacion', type: 'text', required: true, minLength: 4, maxLength: 20 },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionado',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codComplicacion',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'vrServicio', type: 'number', required: true, min: 0, max: 999999999999 },
    {
      key: 'conceptoRecaudo',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'collectionConcepts',
    },
    { key: 'valorPagoModerador', type: 'number', required: true, min: 0, max: 999999999999 },
    { key: 'numFEVPagoModerador', type: 'text', maxLength: 30 },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_3]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 3, maxLength: 12 },
    { key: 'fechaInicioAtencion', type: 'datetime', required: true },
    {
      key: 'causaMotivoAtencion',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'externalCauses',
    },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoPrincipalE',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE1',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE2',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE3',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'condicionDestinoUsuarioEgreso', type: 'text', required: true, minLength: 2, maxLength: 2 },
    {
      key: 'codDiagnosticoCausaMuerte',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'fechaEgreso', type: 'datetime', required: true },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_4]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 3, maxLength: 12 },
    {
      key: 'viaIngresoServicioSalud',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'entryRoutes',
    },
    { key: 'fechaInicioAtencion', type: 'datetime', required: true },
    { key: 'numAutorizacion', type: 'text', maxLength: 30 },
    {
      key: 'causaMotivoAtencion',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'externalCauses',
    },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoPrincipalE',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE1',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE2',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionadoE3',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codComplicacion',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'condicionDestinoUsuarioEgreso', type: 'text', required: true, minLength: 2, maxLength: 2 },
    {
      key: 'codDiagnosticoCausaMuerte',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'fechaEgreso', type: 'datetime', required: true },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_5]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 3, maxLength: 12 },
    {
      key: 'tipoDocumentoIdentificacion',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'documentTypes',
    },
    { key: 'numDocumentoIdentificacion', type: 'text', required: true, minLength: 4, maxLength: 20 },
    { key: 'fechaNacimiento', type: 'datetime', required: true },
    { key: 'edadGestacional', type: 'number', min: 20, max: 46 },
    { key: 'numConsultasCPrenatal', type: 'number', min: 0, max: 99 },
    {
      key: 'codSexoBiologico',
      type: 'text',
      required: true,
      minLength: 1,
      maxLength: 2,
      referenceTable: 'sexes',
    },
    { key: 'peso', type: 'number', min: 500, max: 5000 },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'condicionDestinoUsuarioEgreso', type: 'text', required: true, minLength: 2, maxLength: 2 },
    {
      key: 'codDiagnosticoCausaMuerte',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    { key: 'fechaEgreso', type: 'datetime', required: true },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_6]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 3, maxLength: 12 },
    { key: 'numAutorizacion', type: 'text', maxLength: 30 },
    { key: 'idMIPRES', type: 'text', pattern: /^[1-9]{1}[0-9]{0,14}$/ },
    { key: 'fechaDispensAdmon', type: 'datetime', required: true },
    {
      key: 'codDiagnosticoPrincipal',
      type: 'text',
      required: true,
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'codDiagnosticoRelacionado',
      type: 'text',
      minLength: 4,
      maxLength: 6,
      referenceTable: 'diagnosisCodes',
    },
    {
      key: 'tipoMedicamento',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 2,
      referenceTable: 'medicationTypes',
    },
    { key: 'codTecnologiaSalud', type: 'text', required: true, minLength: 1, maxLength: 20 },
    { key: 'nomTecnologiaSalud', type: 'text', maxLength: 128 },
    { key: 'concentracionMedicamento', type: 'number', min: 0, max: 999 },
    { key: 'unidadMedida', type: 'number', min: 0, max: 9999 },
    { key: 'formaFarmaceutica', type: 'text', minLength: 6, maxLength: 8 },
    { key: 'unidadMinDispensa', type: 'number', min: 1, max: 99 },
    { key: 'cantidadMedicamento', type: 'number', min: 0, max: 9999999999 },
    { key: 'diasTratamiento', type: 'number', min: 0, max: 999 },
    {
      key: 'tipoDocumentoIdentificacion',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'documentTypes',
    },
    { key: 'numDocumentoIdentificacion', type: 'text', required: true, minLength: 4, maxLength: 20 },
    { key: 'vrUnitMedicamento', type: 'number', required: true, min: 0, max: 999999999999 },
    { key: 'vrServicio', type: 'number', required: true, min: 0, max: 999999999999 },
    {
      key: 'conceptoRecaudo',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'collectionConcepts',
    },
    { key: 'valorPagoModerador', type: 'number', required: true, min: 0, max: 999999999999 },
    { key: 'numFEVPagoModerador', type: 'text', maxLength: 30 },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
  [RipsAdminDomainValueObjectsServiceCategory.NUMBER_7]: [
    { key: 'codPrestador', type: 'text', required: true, minLength: 3, maxLength: 12 },
    { key: 'numAutorizacion', type: 'text', maxLength: 30 },
    { key: 'idMIPRES', type: 'text', pattern: /^[1-9]{1}[0-9]{0,14}$/ },
    { key: 'fechaSuministroTecnologia', type: 'datetime', required: true },
    { key: 'tipoOS', type: 'text', required: true, minLength: 2, maxLength: 2 },
    { key: 'codTecnologiaSalud', type: 'text', required: true, minLength: 1, maxLength: 20 },
    { key: 'nomTecnologiaSalud', type: 'text', maxLength: 128 },
    { key: 'cantidadOS', type: 'number', required: true, min: 1, max: 99999 },
    {
      key: 'tipoDocumentoIdentificacion',
      type: 'text',
      minLength: 2,
      maxLength: 2,
      referenceTable: 'documentTypes',
    },
    { key: 'numDocumentoIdentificacion', type: 'text', minLength: 4, maxLength: 20 },
    { key: 'vrUnitOS', type: 'number', required: true, min: 0, max: 999999999999999 },
    { key: 'vrServicio', type: 'number', required: true, min: 0, max: 999999999999 },
    {
      key: 'conceptoRecaudo',
      type: 'text',
      required: true,
      minLength: 1,
      referenceTable: 'collectionConcepts',
    },
    { key: 'valorPagoModerador', type: 'number', required: true, min: 0, max: 999999999999 },
    { key: 'numFEVPagoModerador', type: 'text', maxLength: 30 },
    { key: 'consecutivo', type: 'number', required: true, min: 1, max: 999999 },
  ],
}

export const CALCULATED_FIELD_KEYS = new Set([
  'codPrestador',
  'fechaInicioAtencion',
  'consecutivo',
  'numFEVPagoModerador',
])

export const getDefaultPayload = (category: ServiceCategoryValue): Record<string, unknown> => {
  switch (category) {
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_1:
      return {
        codPrestador: '',
        fechaInicioAtencion: '',
        numAutorizacion: '',
        codConsulta: '',
        modalidadGrupoServicioTecSal: '',
        grupoServicios: '',
        codServicio: 100,
        finalidadTecnologiaSalud: '',
        causaMotivoAtencion: '',
        codDiagnosticoPrincipal: '',
        codDiagnosticoRelacionado1: '',
        codDiagnosticoRelacionado2: '',
        codDiagnosticoRelacionado3: '',
        tipoDiagnosticoPrincipal: '',
        tipoDocumentoIdentificacion: '',
        numDocumentoIdentificacion: '',
        vrServicio: 0,
        conceptoRecaudo: '',
        valorPagoModerador: 0,
        numFEVPagoModerador: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_2:
      return {
        codPrestador: '',
        fechaInicioAtencion: '',
        idMIPRES: '',
        numAutorizacion: '',
        codProcedimiento: '',
        viaIngresoServicioSalud: '',
        modalidadGrupoServicioTecSal: '',
        grupoServicios: '',
        codServicio: 100,
        finalidadTecnologiaSalud: '',
        tipoDocumentoIdentificacion: '',
        numDocumentoIdentificacion: '',
        codDiagnosticoPrincipal: '',
        codDiagnosticoRelacionado: '',
        codComplicacion: '',
        vrServicio: 0,
        conceptoRecaudo: '',
        valorPagoModerador: 0,
        numFEVPagoModerador: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_3:
      return {
        codPrestador: '',
        fechaInicioAtencion: '',
        causaMotivoAtencion: '',
        codDiagnosticoPrincipal: '',
        codDiagnosticoPrincipalE: '',
        codDiagnosticoRelacionadoE1: '',
        codDiagnosticoRelacionadoE2: '',
        codDiagnosticoRelacionadoE3: '',
        condicionDestinoUsuarioEgreso: '',
        codDiagnosticoCausaMuerte: '',
        fechaEgreso: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_4:
      return {
        codPrestador: '',
        viaIngresoServicioSalud: '',
        fechaInicioAtencion: '',
        numAutorizacion: '',
        causaMotivoAtencion: '',
        codDiagnosticoPrincipal: '',
        codDiagnosticoPrincipalE: '',
        codDiagnosticoRelacionadoE1: '',
        codDiagnosticoRelacionadoE2: '',
        codDiagnosticoRelacionadoE3: '',
        codComplicacion: '',
        condicionDestinoUsuarioEgreso: '',
        codDiagnosticoCausaMuerte: '',
        fechaEgreso: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_5:
      return {
        codPrestador: '',
        tipoDocumentoIdentificacion: '',
        numDocumentoIdentificacion: '',
        fechaNacimiento: '',
        edadGestacional: 20,
        numConsultasCPrenatal: 0,
        codSexoBiologico: '',
        peso: 500,
        codDiagnosticoPrincipal: '',
        condicionDestinoUsuarioEgreso: '',
        codDiagnosticoCausaMuerte: '',
        fechaEgreso: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_6:
      return {
        codPrestador: '',
        numAutorizacion: '',
        idMIPRES: '',
        fechaDispensAdmon: '',
        codDiagnosticoPrincipal: '',
        codDiagnosticoRelacionado: '',
        tipoMedicamento: '',
        codTecnologiaSalud: '',
        nomTecnologiaSalud: '',
        concentracionMedicamento: 0,
        unidadMedida: 0,
        formaFarmaceutica: '',
        unidadMinDispensa: 1,
        cantidadMedicamento: 0,
        diasTratamiento: 0,
        tipoDocumentoIdentificacion: '',
        numDocumentoIdentificacion: '',
        vrUnitMedicamento: 0,
        vrServicio: 0,
        conceptoRecaudo: '',
        valorPagoModerador: 0,
        numFEVPagoModerador: '',
        consecutivo: 1,
      }
    case RipsAdminDomainValueObjectsServiceCategory.NUMBER_7:
    default:
      return {
        codPrestador: '',
        numAutorizacion: '',
        idMIPRES: '',
        fechaSuministroTecnologia: '',
        tipoOS: '',
        codTecnologiaSalud: '',
        nomTecnologiaSalud: '',
        cantidadOS: 1,
        tipoDocumentoIdentificacion: '',
        numDocumentoIdentificacion: '',
        vrUnitOS: 0,
        vrServicio: 0,
        conceptoRecaudo: '',
        valorPagoModerador: 0,
        numFEVPagoModerador: '',
        consecutivo: 1,
      }
  }
}

export const normalizePayload = (
  category: ServiceCategoryValue,
  incoming: unknown,
): Record<string, unknown> => {
  const defaults = getDefaultPayload(category)
  const source = (incoming as Record<string, unknown>) ?? {}
  const result: Record<string, unknown> = {}

  Object.entries(defaults).forEach(([key, defaultValue]) => {
    const rawValue = source[key]
    const fieldType = CATEGORY_FIELDS[category].find((field) => field.key === key)?.type

    if (rawValue === undefined) {
      result[key] = defaultValue
      return
    }

    if (rawValue === null) {
      result[key] = null
      return
    }

    if (fieldType === 'number' || typeof defaultValue === 'number') {
      const numericValue = Number(rawValue)
      result[key] = Number.isNaN(numericValue) ? defaultValue : numericValue
      return
    }

    if (fieldType === 'datetime' && typeof rawValue === 'string') {
      if (!rawValue) {
        result[key] = ''
        return
      }
      const formatted = rawValue.includes('T') ? rawValue : rawValue.replace(' ', 'T')
      result[key] = formatted
      return
    }

    if (fieldType === 'date' && typeof rawValue === 'string') {
      result[key] = rawValue.length > 10 ? rawValue.slice(0, 10) : rawValue
      return
    }

    result[key] = rawValue
  })

  return result
}

export const serializePayload = (
  category: ServiceCategoryValue,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...payload }
  const fieldConfigs = CATEGORY_FIELDS[category]

  fieldConfigs.forEach((field) => {
    const value = result[field.key]
    
    // Convert datetime fields from T format to space format
    if (field.type === 'datetime') {
      if (typeof value === 'string' && value.includes('T')) {
        result[field.key] = value.replace('T', ' ')
      }
    }
    
    // Convert empty strings to null for nullable fields (fields without required: true)
    if (!field.required && typeof value === 'string' && value === '') {
      result[field.key] = null
    }
  })

  return result
}

export const isCategorySlug = (value: string): value is CategorySlug => value in CATEGORY_CONFIG
