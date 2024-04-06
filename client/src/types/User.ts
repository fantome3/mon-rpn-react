export type Register = {
  email: string
  password: string
  confirmPassword: string
  conditions: boolean
}

export type Origines = {
  firstName: string
  lastName: string
  birthDate: Date
  nativeCountry: string
  sex: string
}

export type Infos = {
  residenceCountry: string
  postalCode: string
  address: string
  tel: string
  hasInsurance: boolean
}

export type User = {
  _id?: string
  register: Register
  origines: Origines
  infos: Infos
  rememberMe: boolean
  isAdmin: boolean
  cpdLng: string
}
