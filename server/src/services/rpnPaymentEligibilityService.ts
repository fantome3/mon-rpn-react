type MembershipSubscriptionSnapshot = {
  lastMembershipPaymentYear?: number | null
  membershipPaidThisYear?: boolean | null
}

type PrimaryMemberSnapshot = {
  primaryMember?: boolean | null
  subscription?: MembershipSubscriptionSnapshot | null
}

type RpnTopUpEligibilityInput = {
  user?: PrimaryMemberSnapshot | null
  previousMembershipBalance: number
  previousRpnBalance: number
  nextMembershipBalance: number
  nextRpnBalance: number
  isActorAdmin?: boolean
  year?: number
}

const isMembershipPaidForCurrentYear = (
  subscription?: MembershipSubscriptionSnapshot | null,
  year = new Date().getFullYear()
) => {
  if (!subscription) return false
  if (subscription.membershipPaidThisYear !== true) return false

  if (typeof subscription.lastMembershipPaymentYear === 'number') {
    return subscription.lastMembershipPaymentYear === year
  }

  return true
}

export const canIncreaseRpnBalance = ({
  user,
  previousMembershipBalance,
  previousRpnBalance,
  nextMembershipBalance,
  nextRpnBalance,
  isActorAdmin = false,
  year = new Date().getFullYear(),
}: RpnTopUpEligibilityInput) => {
  if (isActorAdmin) return true
  if (!user?.primaryMember) return true

  const hasRpnTopUp = nextRpnBalance > previousRpnBalance
  if (!hasRpnTopUp) return true

  // Allow combined payment (membership + rpn) in a single request.
  const hasMembershipTopUp = nextMembershipBalance > previousMembershipBalance
  if (hasMembershipTopUp) return true

  return isMembershipPaidForCurrentYear(user.subscription, year)
}
