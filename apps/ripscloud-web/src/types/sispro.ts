export interface SisproSettingsResponse {
  documentType?: string | null
  documentNumber?: string | null
  password?: string | null
  token?: string | null
  nit?: string | null
}

export interface SisproLoginRequest {
  documentType: string
  documentNumber: string
  password: string
}

export interface SisproLoginResult {
  token?: string | null
  login: boolean
  registrado: boolean
  errors?: string[] | null
}
