import type { FamilyMember } from '@/types/FamilyMember'
import type { FeeDetail } from './fees'
import type { Occupation, ResidenceCountryStatus, RpnStatus, StudentStatus } from '@/types/Status'

const ADULT_AGE = 18

// Relations constantes — source unique de vérité pour les comparaisons
export const RELATION_CONJOINT = 'Conjoint(e)'
export const RELATION_PERE = 'Père'
export const RELATION_MERE = 'Mère'
export const RELATION_BEAU_PERE = 'Beau-père'
export const RELATION_BELLE_MERE = 'Belle-mère'

// Toutes les relations traitées comme un parent (même logique de facturation)
export const PARENT_RELATIONS = [
  RELATION_PERE,
  RELATION_MERE,
  RELATION_BEAU_PERE,
  RELATION_BELLE_MERE,
] as const

export const isParentRelation = (rel: string): boolean =>
  (PARENT_RELATIONS as readonly string[]).includes(rel)

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
 *  - Père / Mère / Beau-père / Belle-mère : facturé seulement si vit au Canada
 *  - Enfant mineur (< 18 ans) : exempté du membership
 *  - Enfant adulte : même règle étudiant/travailleur
 */
/**
 * Dérive le statut RPN effectif d'un membre de famille.
 * Rétrocompatibilité : les membres créés avant l'ajout du champ rpnStatus
 * ont undefined en base mais possèdent rpnMatricule s'ils ont été inscrits.
 * Le statut membership (active/inactive) détermine si l'inscription est active
 * ou suspendue.
 */
export const resolveFamilyMemberRpnStatus = (
  member: Pick<FamilyMember, 'rpnStatus' | 'rpnMatricule' | 'status'>,
): RpnStatus => {
  if (member.rpnStatus && member.rpnStatus !== 'not_enrolled') return member.rpnStatus
  if (member.rpnMatricule) {
    return member.status === 'active' ? 'enrolled' : 'unsubscribed'
  }
  return member.rpnStatus ?? 'not_enrolled'
}

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

  if (isParentRelation(rel ?? '')) {
    // Rétrocompatibilité : si livesInCanada absent, déduire du statut d'immigration
    const isResident =
      member.livesInCanada !== undefined
        ? member.livesInCanada
        : isResidentByStatus(member.residenceCountryStatus)
    return { type: 'student', isMembershipActive: isResident }
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
