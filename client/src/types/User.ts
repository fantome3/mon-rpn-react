export type Register = {
  email: string
  password: string
  conditions: boolean
  occupation: 'student' | 'worker'
  institution?: string
  otherInstitution?: string
  studentNumber?: string
  studentStatus?: 'part-time' | 'full-time'
  workField?: string
}

export type Origines = {
  firstName: string
  lastName: string
  birthDate: Date
  nativeCountry: string
  sex: string
  id_image: string
}

export type Infos = {
  residenceCountry: string
  residenceCountryStatus:
    | 'student'
    | 'worker'
    | 'canadian_citizen'
    | 'permanent_resident'
    | 'visitor'
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
  residenceCountryStatus:
    | 'student'
    | 'worker'
    | 'canadian_citizen'
    | 'permanent_resident'
    | 'visitor'
  birthDate: Date
  tel?: string
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
