import { useMemo } from 'react'
import { useCurrentUser } from './useCurrentUser'
import { getMemberFeeConfig, isBilledAsStudent, resolveFamilyMemberRpnStatus } from '@/lib/familyMemberRules'
import { calculateMembershipOnlyTotal, calculateRpnTotal } from '@/lib/fees'
import { isMembershipPaidForCurrentYear } from '@/lib/billing'
import { useGetSettingsQuery } from '@/hooks/settingHooks'
import type { FeeType } from '@/lib/fees'

export type FullBillingMember = {
  memberId: string
  isPrimary: boolean
  name: string
  relationship: string
  needsMembership: boolean
  needsRpn: boolean
  membershipFee: number
  rpnFee: number
  membershipLocked: boolean
  feeType: FeeType
  isMembershipBillable: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

const formatName = (first?: string, last?: string) =>
  [first, last].filter(Boolean).join(' ').trim() || 'Membre'

export const useFullBillingMembers = (): FullBillingMember[] => {
  const { user } = useCurrentUser()
  const { data: settings } = useGetSettingsQuery()

  const workerAmount = settings?.membershipUnitAmount
  const studentAmount = settings?.studentMembershipUnitAmount

  return useMemo(() => {
    if (!user) return []

    const feeOverrides = { workerAmount, studentAmount }
    const primaryRpnEnrolled = user.subscription?.rpnStatus === 'enrolled'
    const members: FullBillingMember[] = []

    // ── Membre principal ─────────────────────────────────────────────────────
    // Toujours affiché : renouvellement annuel ET renflouement RPN.
    const primaryIsStudent = isBilledAsStudent(
      user.register?.occupation,
      user.register?.studentStatus,
    )
    const primaryFeeType: FeeType = primaryIsStudent ? 'student' : 'worker'
    const primaryMembershipFee = calculateMembershipOnlyTotal(
      [{ quantity: 1, type: primaryFeeType, isMembershipActive: true }],
      feeOverrides,
    )
    const primaryRpnFee = calculateRpnTotal([
      { quantity: 1, type: primaryFeeType, isRpnActive: true },
    ])
    const primaryNeedsMembership = !isMembershipPaidForCurrentYear(user.subscription)
    // Inclut enrolled (top-up) ET not_enrolled (inscription) ; exclut pending et unsubscribed
    const primaryNeedsRpn =
      user.subscription?.rpnStatus !== 'unsubscribed' &&
      user.subscription?.rpnStatus !== 'pending'

    members.push({
      memberId: 'primary',
      isPrimary: true,
      name: formatName(user.origines?.firstName, user.origines?.lastName),
      relationship: 'Membre principal',
      needsMembership: primaryNeedsMembership,
      needsRpn: primaryNeedsRpn,
      membershipFee: primaryMembershipFee,
      rpnFee: primaryRpnFee,
      membershipLocked: true,
      feeType: primaryFeeType,
      isMembershipBillable: true,
    })

    // ── Membres de la famille ─────────────────────────────────────────────────
    // Exclut les membres billing-partiel (membershipCoveredThisYear === null).
    // Inclut les membres inscrits au RPN pour leur permettre de renflouer le fonds.
    for (const [realIndex, member] of (user.familyMembers ?? []).entries()) {
      if (member.status !== 'active') continue

      // null = ajouté après paiement annuel → billing-partiel s'en occupe
      if (member.membershipCoveredThisYear === null) continue

      const memberId = (member as any)._id ?? `index-${realIndex}`
      const feeConfig = getMemberFeeConfig(member)

      const needsMembership =
        feeConfig.isMembershipActive &&
        member.membershipCoveredThisYear !== CURRENT_YEAR

      const effectiveRpnStatus = resolveFamilyMemberRpnStatus(member)
      // Inclut enrolled (top-up) ET not_enrolled (inscription via primaryRpnEnrolled)
      const needsRpn =
        primaryRpnEnrolled &&
        effectiveRpnStatus !== 'pending' &&
        effectiveRpnStatus !== 'unsubscribed'

      if (!needsMembership && !needsRpn) continue

      const membershipFee = calculateMembershipOnlyTotal(
        [{ quantity: 1, type: feeConfig.type, isMembershipActive: feeConfig.isMembershipActive }],
        feeOverrides,
      )
      const rpnFee = calculateRpnTotal([
        { quantity: 1, type: feeConfig.type, isRpnActive: true },
      ])

      members.push({
        memberId,
        isPrimary: false,
        name: formatName(member.firstName, member.lastName),
        relationship: member.relationship || 'Personne à charge',
        needsMembership,
        needsRpn,
        membershipFee,
        rpnFee,
        membershipLocked: !feeConfig.isMembershipActive,
        feeType: feeConfig.type,
        isMembershipBillable: feeConfig.isMembershipActive,
      })
    }

    return members
  }, [user, workerAmount, studentAmount])
}
