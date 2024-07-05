export type Register = {
  email: string
  password: string
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

export type FamilyMember = {
  firstName: string
  lastName: string
  relationship: string
  status: string
}

export type Subscription = {
  startDate: Date
  status: string
}

export type User = {
  _id?: string
  register: Register
  origines: Origines
  infos: Infos
  rememberMe: boolean
  isAdmin: boolean
  cpdLng?: string
  primaryMember: boolean
  familyMembers: FamilyMember[] | []
  subscription?: Subscription
  referralCode?: string
  referredBy?: string
}
