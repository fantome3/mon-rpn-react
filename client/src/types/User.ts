import type {
  Occupation,
  ResidenceCountryStatus,
  StudentStatus,
  SubscriptionStatus,
} from './Status'
import type { FamilyMember } from './FamilyMember'

export type EmergencyContact = {
  name?: string
  phone?: string
}

export type Register = {
  email: string
  password: string
  conditions: boolean
  occupation: Occupation
  institution?: string
  otherInstitution?: string
  studentNumber?: string
  studentStatus?: StudentStatus
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
  residenceCountryStatus: ResidenceCountryStatus
  postalCode: string
  address: string
  tel: string
  hasInsurance: boolean
  emergencyContacts?: EmergencyContact[]
}

export type RpnStatus = 'not_enrolled' | 'pending' | 'enrolled' | 'unsubscribed'

export type Subscription = {
  startDate: Date
  status: SubscriptionStatus
  endDate?: Date
  lastMembershipPaymentYear?: number
  membershipPaidThisYear?: boolean
  rpnStatus?: RpnStatus
  rpnEnrollmentDate?: Date
  missedRpnRemindersCount?: number
}

export type User = {
  _id?: string
  token?: string
  register: Register
  origines: Origines
  infos: Infos
  rememberMe: boolean
  isAdmin: boolean
  cpdLng?: string
  primaryMember: boolean
  familyMembers: FamilyMember[]
  subscription?: Subscription
  referralCode?: string
  referredBy?: string
  registerTime?: Date
  originesTime?: Date
  infosTime?: Date
  deletedAt?: Date
  deletedBy?: string
}
