import {
  calculateMembershipOnlyTotal,
  calculateRpnTotal,
  FeeDetail,
  MembershipFeeOverrides,
} from './fees'
import { getMemberFeeConfig, isBilledAsStudent } from './familyMemberRules'
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

  const primaryIsStudent = isBilledAsStudent(
    user.register.occupation,
    user.register.studentStatus,
  )

  const people: FamilyFeePerson[] = [
    {
      id: 'primary-member',
      fullName: formatDisplayName(
        user.origines?.firstName,
        user.origines?.lastName,
      ),
      relationshipLabel: 'Membre principal',
      type: primaryIsStudent ? 'student' : 'worker',
      isMembershipActive: true,
      isRpnActive: true,
    },
  ]

  const activeMembers = (user.familyMembers || []).filter(
    (member) => member?.status === 'active',
  )

  activeMembers.forEach((member, index) => {
    const { type, isMembershipActive } = getMemberFeeConfig(member)

    people.push({
      id: `dependent-${index}`,
      fullName: formatDisplayName(member.firstName, member.lastName),
      relationshipLabel: member.relationship || 'Personne a charge',
      type,
      isMembershipActive,
      isRpnActive: true,
    })
  })

  return people
}

const toMembershipAmount = (
  row: Pick<FeeDetail, 'type' | 'isMembershipActive'>,
  overrides?: MembershipFeeOverrides,
) =>
  calculateMembershipOnlyTotal(
    [{ quantity: 1, type: row.type, isMembershipActive: row.isMembershipActive }],
    overrides,
  )

const toRpnAmount = (row: Pick<FeeDetail, 'type' | 'isRpnActive'>) =>
  calculateRpnTotal([
    { quantity: 1, type: row.type, isRpnActive: row.isRpnActive },
  ])

export const computeFamilyFeesBreakdown = (
  user?: User,
  feeOverrides?: MembershipFeeOverrides,
): FamilyFeeBreakdownItem[] =>
  buildFamilyFeePeople(user).map((person) => {
    const membershipAmount = toMembershipAmount(person, feeOverrides)
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

export const computeFamilyFeesSummary = (
  user?: User,
  feeOverrides?: MembershipFeeOverrides,
): FamilyFeesSummary => {
  const breakdown = computeFamilyFeesBreakdown(user, feeOverrides)

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
