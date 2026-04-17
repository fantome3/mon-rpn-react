import type { Occupation, StudentStatus, TopUpTargetWithBoth } from '@/types'
import type { FamilyFeeBreakdownItem } from './familyFees'
import { isBilledAsStudent } from './familyMemberRules'

export const TOP_UP_TARGET_OPTIONS: TopUpTargetWithBoth[] = [
  'both',
  'membership',
  'rpn',
]

export const TARGET_LABELS: Record<TopUpTargetWithBoth, string> = {
  membership: 'Membership',
  rpn: 'Fonds RPN',
  both: 'Membership + Fonds RPN',
}

export const TARGET_DESCRIPTIONS: Record<TopUpTargetWithBoth, string> = {
  membership: 'Vous réglez uniquement la cotisation membership.',
  rpn: 'Vous alimentez uniquement le fonds RPN.',
  both: 'Vous réglez membership et RPN en une seule transaction.',
}

const toPositiveAmount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0

const getMembershipMinimumAmount = (
  occupation?: Occupation,
  studentStatus?: StudentStatus,
  studentAmount = 25,
  workerAmount = 50,
) => (isBilledAsStudent(occupation, studentStatus) ? studentAmount : workerAmount)

export type TargetAmountMap = Record<TopUpTargetWithBoth, number>

export type RecommendedTopUpAmounts = {
  membershipMinAmount: number
  membershipAmount: number
  rpnAmount: number
  targetAmounts: TargetAmountMap
}

export const computeRecommendedTopUpAmounts = ({
  occupation,
  studentStatus,
  membershipDueAmount,
  rpnDueAmount,
  workerAmount,
  studentAmount,
}: {
  occupation?: Occupation
  studentStatus?: StudentStatus
  membershipDueAmount: number
  rpnDueAmount: number
  workerAmount?: number
  studentAmount?: number
}): RecommendedTopUpAmounts => {
  const membershipMinAmount = getMembershipMinimumAmount(
    occupation,
    studentStatus,
    studentAmount,
    workerAmount,
  )
  const membershipAmount = Math.max(
    membershipMinAmount,
    toPositiveAmount(membershipDueAmount)
  )
  const rpnAmount = Math.max(20, toPositiveAmount(rpnDueAmount))

  return {
    membershipMinAmount,
    membershipAmount,
    rpnAmount,
    targetAmounts: {
      membership: membershipAmount,
      rpn: rpnAmount,
      both: membershipAmount + rpnAmount,
    },
  }
}

export type OutstandingTopUpAmounts = {
  membershipAmount: number
  rpnAmount: number
  targetAmounts: TargetAmountMap
}

export const computeOutstandingTopUpAmounts = ({
  recommendedMembershipAmount,
  recommendedRpnAmount,
  currentMembershipBalance,
  currentRpnBalance,
}: {
  recommendedMembershipAmount: number
  recommendedRpnAmount: number
  currentMembershipBalance: number
  currentRpnBalance: number
}): OutstandingTopUpAmounts => {
  const membershipAmount = Math.max(
    0,
    toPositiveAmount(recommendedMembershipAmount) -
      toPositiveAmount(currentMembershipBalance)
  )
  const rpnAmount = Math.max(
    0,
    toPositiveAmount(recommendedRpnAmount) - toPositiveAmount(currentRpnBalance)
  )

  return {
    membershipAmount,
    rpnAmount,
    targetAmounts: {
      membership: membershipAmount,
      rpn: rpnAmount,
      both: membershipAmount + rpnAmount,
    },
  }
}

export const computeMinimumPaymentByTarget = (
  outstandingByTarget: TargetAmountMap
): TargetAmountMap => ({
  membership: Math.max(1, toPositiveAmount(outstandingByTarget.membership)),
  rpn: Math.max(1, toPositiveAmount(outstandingByTarget.rpn)),
  both: Math.max(1, toPositiveAmount(outstandingByTarget.both)),
})

export const computeSuggestedPaymentAmount = ({
  target,
  outstandingByTarget,
  recommendedByTarget,
}: {
  target: TopUpTargetWithBoth
  outstandingByTarget: TargetAmountMap
  recommendedByTarget: TargetAmountMap
}) => {
  const outstanding = toPositiveAmount(outstandingByTarget[target])
  if (outstanding > 0) return outstanding
  return toPositiveAmount(recommendedByTarget[target])
}

export const getRowAmountByTarget = (
  item: FamilyFeeBreakdownItem,
  target: TopUpTargetWithBoth
) => {
  if (target === 'membership') return item.membershipAmount
  if (target === 'rpn') return item.rpnAmount
  return item.totalAmount
}

export const getBreakdownRowsForTarget = (
  rows: FamilyFeeBreakdownItem[],
  target: TopUpTargetWithBoth
) => rows.filter((row) => getRowAmountByTarget(row, target) > 0)
