import type { FamilyMemberStatus, Occupation, ResidenceCountryStatus, StudentStatus } from './Status'

export type FamilyMember = {
  firstName: string
  lastName: string
  relationship: string
  status: FamilyMemberStatus
  residenceCountryStatus: ResidenceCountryStatus
  birthDate: Date
  tel?: string
  // Champs pour la facturation correcte
  occupation?: Occupation          // 'student' | 'worker' — conjoint et enfant adulte
  studentStatus?: StudentStatus    // 'full-time' | 'part-time' — si occupation = student
  institution?: string             // etablissement scolaire
  studentNumber?: string           // numero etudiant (optionnel)
  livesInCanada?: boolean          // pour Pere / Mere : vit au Canada ?
}
