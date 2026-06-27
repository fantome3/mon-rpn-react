import type { FamilyMemberStatus, Occupation, ResidenceCountryStatus, RpnStatus, StudentStatus } from './Status'

export type FamilyMember = {
  _id?: string
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
  // null = ajoute apres paiement annuel, non encore couvert ; number = couvert ; undefined = ancien membre
  membershipCoveredThisYear?: number | null
}
