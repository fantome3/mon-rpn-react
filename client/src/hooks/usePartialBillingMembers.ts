import { useMemo } from 'react'
import { useCurrentUser } from './useCurrentUser'
import { getMemberFeeConfig, resolveFamilyMemberRpnStatus } from '@/lib/familyMemberRules'
import { calculateMembershipOnlyTotal, calculateRpnTotal } from '@/lib/fees'
import { useGetSettingsQuery } from '@/hooks/settingHooks'
import type { FamilyMember } from '@/types'
import type { FeeType } from '@/lib/fees'

export type PartialBillingMember = {
  member: FamilyMember
  memberId: string
  realIndex: number
  needsMembership: boolean
  needsRpn: boolean
  membershipFee: number
  rpnFee: number
  feeType: FeeType
  isMembershipBillable: boolean
}

export const usePartialBillingMembers = (): PartialBillingMember[] => {
  const { user } = useCurrentUser()
  const { data: settings } = useGetSettingsQuery()

  const feeOverrides = {
    workerAmount: settings?.membershipUnitAmount,
    studentAmount: settings?.studentMembershipUnitAmount,
  }

  return useMemo(() => {
    if (!user) return []

    const primaryRpnEnrolled = user.subscription?.rpnStatus === 'enrolled'

    return (user.familyMembers ?? [])
      .map((member, realIndex) => {
        const memberId = member._id ?? `index-${realIndex}`
        const feeConfig = getMemberFeeConfig(member)

        const needsMembership =
          member.status === 'active' &&
          member.membershipCoveredThisYear === null &&
          feeConfig.isMembershipActive

        const effectiveRpnStatus = resolveFamilyMemberRpnStatus(member)
        const needsRpn =
          member.status === 'active' &&
          primaryRpnEnrolled &&
          effectiveRpnStatus !== 'enrolled' &&
          effectiveRpnStatus !== 'pending' &&
          effectiveRpnStatus !== 'unsubscribed'

        if (!needsMembership && !needsRpn) return null

        const membershipFee = calculateMembershipOnlyTotal(
          [{ quantity: 1, type: feeConfig.type, isMembershipActive: feeConfig.isMembershipActive }],
          feeOverrides,
        )

        const rpnFee = calculateRpnTotal([
          { quantity: 1, type: feeConfig.type, isRpnActive: true },
        ])

        return {
          member,
          memberId,
          realIndex,
          needsMembership,
          needsRpn,
          membershipFee,
          rpnFee,
          feeType: feeConfig.type,
          isMembershipBillable: feeConfig.isMembershipActive,
        } satisfies PartialBillingMember
      })
      .filter((item): item is PartialBillingMember => item !== null)
  }, [user, settings?.membershipUnitAmount, settings?.studentMembershipUnitAmount])
}
