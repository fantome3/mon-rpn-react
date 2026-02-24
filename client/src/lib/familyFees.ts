import {
  calculateMembershipOnlyTotal,
  calculateRpnTotal,
  FeeDetail,
} from './fees'
import { User } from '@/types'

export type FamilyFeesSummary = {
  dependantCount: number
  membershipAmount: number
  rpnAmount: number
}

const ADULT_AGE = 18

const calculateAge = (birthDate?: Date | string): number => {
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

const mapUserToFeeRows = (user?: User): FeeDetail[] => {
  if (!user?.register) return []

  const rows: FeeDetail[] = [
    {
      id: 'primary-member',
      feeDescription: 'Membre principal',
      quantity: 1,
      type: user.register.occupation === 'student' ? 'student' : 'worker',
      isMembershipActive: true,
      isAdhesionActive: true,
      isRpnActive: true,
    },
  ]

  const activeMembers = (user.familyMembers || []).filter(
    (member) => member?.status === 'active',
  )

  activeMembers.forEach((member, index) => {
    const age = calculateAge(member.birthDate)
    const isMinor = age < ADULT_AGE
    const adultType = member.residenceCountryStatus === 'student' ? 'student' : 'worker'

    rows.push({
      id: `dependent-${index}`,
      feeDescription: member.relationship || 'Personne a charge',
      quantity: 1,
      type: isMinor ? 'minor' : adultType,
      isMembershipActive: !isMinor,
      isAdhesionActive: true,
      isRpnActive: true,
    })
  })

  return rows
}

const countActiveDependants = (user?: User): number => {
  const activeMembers = (user?.familyMembers || []).filter(
    (member) => member?.status === 'active',
  )

  return activeMembers.length
}

export const computeFamilyFeesSummary = (user?: User): FamilyFeesSummary => {
  const rows = mapUserToFeeRows(user)

  return {
    dependantCount: countActiveDependants(user),
    membershipAmount: calculateMembershipOnlyTotal(rows),
    rpnAmount: calculateRpnTotal(rows),
  }
}

export const buildPaymentMessage = (
  amount: number,
  dependantCount: number,
): string =>
  dependantCount > 0
    ? `Selon vos personnes à charge, vous devez payer : ${amount}$`
    : `Montant à payer : ${amount}$`
