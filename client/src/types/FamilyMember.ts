import type { FamilyMemberStatus, Occupation, ResidenceCountryStatus, RpnStatus, StudentStatus } from './Status'

export type FamilyMember = {
  firstName: string
  lastName: string
  relationship: string
  status: FamilyMemberStatus
  residenceCountryStatus: ResidenceCountryStatus
  birthDate: Date
  tel?: string
  occupation?: Occupation
  studentStatus?: StudentStatus
  institution?: string
  studentNumber?: string
  livesInCanada?: boolean
  sex?: string
  rpnStatus?: RpnStatus
  rpnMatricule?: string
}
