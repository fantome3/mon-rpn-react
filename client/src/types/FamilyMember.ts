import type { FamilyMemberStatus, ResidenceCountryStatus } from './Status'

export type FamilyMember = {
  firstName: string
  lastName: string
  relationship: string
  status: FamilyMemberStatus
  residenceCountryStatus: ResidenceCountryStatus
  birthDate: Date
  tel?: string
}
