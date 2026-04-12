import type { FamilyMember } from '@/types/FamilyMember'
import type { FeeDetail } from './fees'
import type { Occupation, ResidenceCountryStatus, StudentStatus } from '@/types/Status'

const ADULT_AGE = 18

// Relations constantes — source unique de vérité pour les comparaisons
export const RELATION_CONJOINT = 'Conjoint(e)'
export const RELATION_PERE = 'Père'
export const RELATION_MERE = 'Mère'
export const PARENT_RELATIONS = [RELATION_PERE, RELATION_MERE] as const

/**
 * Calcule l'age en années à partir d'une date de naissance.
 * Retourne ADULT_AGE (18) si la date est absente ou invalide.
 */
export const calculateAge = (birthDate?: Date | string): number => {
  if (!birthDate) return ADULT_AGE
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return ADULT_AGE

  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  const isBirthdayPassed =
    monthDiff > 0 || (monthDiff === 0 && now.getDate() >= date.getDate())

  if (!isBirthdayPassed) age -= 1
  return age
}

/**
 * Détermine si une personne est facturée au tarif étudiant.
 * Règle : étudiant à temps plein seulement.
 * Un étudiant à temps partiel est facturé comme travailleur.
 */
export const isBilledAsStudent = (
  occupation?: Occupation | string,
  studentStatus?: StudentStatus | string,
): boolean =>
  occupation === 'student' &&
  studentStatus !== 'part-time'

/**
 * Vérifie si un statut d'immigration correspond à un résident canadien.
 * Utilisé uniquement comme fallback de rétrocompatibilité pour les parents
 * dont le champ livesInCanada n'est pas encore renseigné.
 */
const isResidentByStatus = (status?: ResidenceCountryStatus | string): boolean =>
  status !== 'visitor' && status !== undefined

export type MemberFeeConfig = {
  type: FeeDetail['type']
  isMembershipActive: boolean
}

/**
 * Calcule la configuration de facturation d'un membre de la famille.
 * Source de vérité unique pour la logique de tarification membership.
 *
 * Règles :
 *  - Conjoint(e) : étudiant full-time → tarif étudiant (25$), sinon travailleur (50$)
 *  - Père / Mère : facturé seulement si vit au Canada
 *  - Enfant mineur (< 18 ans) : exempté du membership
 *  - Enfant adulte : même règle étudiant/travailleur
 */
export const getMemberFeeConfig = (
  member: Pick<
    FamilyMember,
    | 'relationship'
    | 'occupation'
    | 'studentStatus'
    | 'residenceCountryStatus'
    | 'birthDate'
    | 'livesInCanada'
  >,
): MemberFeeConfig => {
  const age = calculateAge(member.birthDate)

  if (age < ADULT_AGE) {
    return { type: 'minor', isMembershipActive: false }
  }

  const rel = member.relationship

  if (rel === RELATION_PERE || rel === RELATION_MERE) {
    // Rétrocompatibilité : si livesInCanada absent, déduire du statut d'immigration
    const isResident =
      member.livesInCanada !== undefined
        ? member.livesInCanada
        : isResidentByStatus(member.residenceCountryStatus)
    return { type: 'worker', isMembershipActive: isResident }
  }

  // Conjoint(e) et Enfant adulte
  const hasOccupationData = member.occupation !== undefined
  const isStudent = hasOccupationData
    ? isBilledAsStudent(member.occupation, member.studentStatus)
    : member.residenceCountryStatus === 'student' // fallback ancienne data

  return {
    type: isStudent ? 'student' : 'worker',
    isMembershipActive: true,
  }
}
