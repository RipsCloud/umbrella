import rawUserTypes from './health_type_users.json'

type RawUserType = {
  id: string
  name: string
  code: string
}

export type UserTypeOption = {
  id: string
  code: string
  name: string
  label: string
}

export const userTypeOptions: UserTypeOption[] = (rawUserTypes as RawUserType[]).map((userType) => ({
  id: userType.id,
  code: userType.code,
  name: userType.name,
  label: `${userType.code} - ${userType.name}`,
}))
