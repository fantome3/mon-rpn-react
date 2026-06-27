import { useMemo } from 'react'
import { useCurrentUser } from './useCurrentUser'
import { getMemberFeeConfig } from '@/lib/familyMemberRules'
import type { FamilyMember } from '@/types'

export const useUncoveredMembers = (): FamilyMember[] => {
  const { user } = useCurrentUser()

  return useMemo(() => {
    if (user?.subscription?.membershipPaidThisYear !== true) return []

    return (user.familyMembers ?? []).filter(
      (m) =>
        m.status === 'active' &&
        m.membershipCoveredThisYear === null &&
        getMemberFeeConfig(m).isMembershipActive,
    )
  }, [user])
}
