import {
  calculateMembershipOnlyTotal,
  calculateRpnTotal,
  FeeDetail,
} from './fees'
import { User } from '@/types'

export type FamilyFeeBreakdownItem = {
  id: string
  fullName: string
  relationshipLabel: string
  membershipAmount: number
  rpnAmount: number
  totalAmount: number
}

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

type FamilyFeePerson = {
  id: string
  fullName: string
  relationshipLabel: string
  type: FeeDetail['type']
  isMembershipActive: boolean
  isRpnActive: boolean
}

const formatDisplayName = (firstName?: string, lastName?: string): string => {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || 'Personne a charge'
}

const buildFamilyFeePeople = (user?: User): FamilyFeePerson[] => {
  if (!user?.register) return []

  const people: FamilyFeePerson[] = [
    {
      id: 'primary-member',
      fullName: formatDisplayName(
        user.origines?.firstName,
        user.origines?.lastName,
      ),
      relationshipLabel: 'Membre principal',
      type: user.register.occupation === 'student' ? 'student' : 'worker',
      isMembershipActive: true,
      isRpnActive: true,
    },
  ]

  const activeMembers = (user.familyMembers || []).filter(
    (member) => member?.status === 'active',
  )

  activeMembers.forEach((member, index) => {
    const age = calculateAge(member.birthDate)
    const isMinor = age < ADULT_AGE
    const adultType =
      member.residenceCountryStatus === 'student' ? 'student' : 'worker'

    people.push({
      id: `dependent-${index}`,
      fullName: formatDisplayName(member.firstName, member.lastName),
      relationshipLabel: member.relationship || 'Personne a charge',
      type: isMinor ? 'minor' : adultType,
      isMembershipActive: !isMinor,
      isRpnActive: true,
    })
  })

  return people
}

const toMembershipAmount = (row: Pick<FeeDetail, 'type' | 'isMembershipActive'>) =>
  calculateMembershipOnlyTotal([
    { quantity: 1, type: row.type, isMembershipActive: row.isMembershipActive },
  ])

const toRpnAmount = (row: Pick<FeeDetail, 'type' | 'isRpnActive'>) =>
  calculateRpnTotal([
    { quantity: 1, type: row.type, isRpnActive: row.isRpnActive },
  ])

export const computeFamilyFeesBreakdown = (
  user?: User,
): FamilyFeeBreakdownItem[] =>
  buildFamilyFeePeople(user).map((person) => {
    const membershipAmount = toMembershipAmount(person)
    const rpnAmount = toRpnAmount(person)
    return {
      id: person.id,
      fullName: person.fullName,
      relationshipLabel: person.relationshipLabel,
      membershipAmount,
      rpnAmount,
      totalAmount: membershipAmount + rpnAmount,
    }
  })

const countActiveDependants = (user?: User): number => {
  const activeMembers = (user?.familyMembers || []).filter(
    (member) => member?.status === 'active',
  )

  return activeMembers.length
}

export const computeFamilyFeesSummary = (user?: User): FamilyFeesSummary => {
  const breakdown = computeFamilyFeesBreakdown(user)

  return {
    dependantCount: countActiveDependants(user),
    membershipAmount: breakdown.reduce(
      (total, item) => total + item.membershipAmount,
      0,
    ),
    rpnAmount: breakdown.reduce((total, item) => total + item.rpnAmount, 0),
  }
}

export const buildPaymentMessage = (
  amount: number,
  dependantCount: number,
): string =>
  dependantCount > 0
    ? `Selon vos personnes à charge, vous devez payer : ${amount}$`
    : `Montant à payer : ${amount}$`
