import {
  TOP_UP_TARGETS_WITH_BOTH,
  Transaction,
  type BillingSection,
  type MembershipPaymentUiState,
  type Subscription,
  type TopUpTarget,
  type TopUpTargetWithBoth,
} from '@/types'

export type {
  TopUpTarget,
  TopUpTargetWithBoth,
  BillingSection,
  MembershipPaymentUiState,
}

type MembershipSubscriptionSnapshot = Pick<
  Subscription,
  'status' | 'lastMembershipPaymentYear' | 'membershipPaidThisYear' | 'startDate' | 'endDate'
>

const MEMBERSHIP_PATTERNS = ['membership', 'cotisation', 'premier paiement']
const MEMBERSHIP_TOPUP_PATTERNS = [
  'renflouement membership',
  'premier paiement',
  'paiement combine membership',
]
const RPN_TOPUP_PATTERNS = ['fonds rpn', 'rpn', 'premier paiement']
export const RPN_PAYMENT_BLOCK_MESSAGE =
  'Le paiement du fonds RPN est disponible uniquement quand la cotisation membership du membre principal et des personnes à charge est a jour.'

const normalize = (value?: string) => (value || '').toLowerCase()

const includesAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern))

export const getTargetFromQuery = (
  value?: string | null
): TopUpTargetWithBoth | null => {
  if (value && TOP_UP_TARGETS_WITH_BOTH.includes(value as TopUpTargetWithBoth)) {
    return value as TopUpTargetWithBoth
  }
  return null
}

export const buildBillingPaymentUrl = (target: TopUpTargetWithBoth) =>
  `/billing?section=payment&target=${target}`

export const getTransactionDate = (transaction: Transaction) =>
  transaction.createdAt ? new Date(transaction.createdAt) : null

export const getMembershipCurrentYearTransactions = (
  transactions: Transaction[] = []
) => {
  const currentYear = new Date().getFullYear()
  return transactions.filter((transaction) => {
    const reason = normalize(transaction.reason)
    const date = getTransactionDate(transaction)
    return (
      !!date &&
      date.getFullYear() === currentYear &&
      includesAny(reason, MEMBERSHIP_PATTERNS)
    )
  })
}

export const getLastRpnTopUpTransactions = (
  transactions: Transaction[] = [],
  limit = 5
) =>
  transactions
    .filter((transaction) => {
      const reason = normalize(transaction.reason)
      return (
        transaction.type === 'credit' &&
        includesAny(reason, RPN_TOPUP_PATTERNS)
      )
    })
    .slice(0, limit)

export const getTransactionStatusLabel = (status: Transaction['status']) => {
  if (status === 'completed') return 'Reussie'
  if (status === 'failed') return 'Echouee'
  if (status === 'awaiting_payment') return 'En attente paiement'
  return 'En approbation'
}

export const buildTopUpReason = (target: TopUpTargetWithBoth) => {
  if (target === 'membership') return 'Renflouement membership via Interac'
  if (target === 'rpn') return 'Renflouement fonds RPN via Interac'
  return 'Paiement combine membership et fonds RPN via Interac'
}

export type TopUpAllocationInput = {
  target: TopUpTargetWithBoth
  amountInterac: number
  membershipDueAmount: number
  rpnDueAmount: number
}

export type TopUpAllocation = {
  membershipAmount: number
  rpnAmount: number
}

type RpnTopUpEligibilityInput = {
  isPrimaryMember?: boolean
  transactions?: Transaction[]
  subscription?: MembershipSubscriptionSnapshot
  year?: number
}

export const computeTopUpAllocation = ({
  target,
  amountInterac,
  membershipDueAmount,
  rpnDueAmount,
}: TopUpAllocationInput): TopUpAllocation => {
  if (target === 'membership') {
    return { membershipAmount: amountInterac, rpnAmount: 0 }
  }

  if (target === 'rpn') {
    return { membershipAmount: 0, rpnAmount: amountInterac }
  }

  const requiredCombined = membershipDueAmount + rpnDueAmount
  const extraAmount = Math.max(0, amountInterac - requiredCombined)

  return {
    membershipAmount: membershipDueAmount,
    rpnAmount: rpnDueAmount + extraAmount,
  }
}

const isMembershipTopUp = (transaction: Transaction) => {
  const reason = normalize(transaction.reason)
  return transaction.type === 'credit' && includesAny(reason, MEMBERSHIP_TOPUP_PATTERNS)
}

const isTransactionInYear = (transaction: Transaction, year: number) => {
  const transactionDate = getTransactionDate(transaction)
  return !!transactionDate && transactionDate.getFullYear() === year
}

export const getLatestMembershipTopUpTransaction = (
  transactions: Transaction[] = [],
  year = new Date().getFullYear()
) =>
  transactions
    .filter(
      (transaction) =>
        isMembershipTopUp(transaction) && isTransactionInYear(transaction, year)
    )
    .sort((a, b) => {
      const aTime = getTransactionDate(a)?.getTime() ?? 0
      const bTime = getTransactionDate(b)?.getTime() ?? 0
      return bTime - aTime
    })[0]

export const isMembershipPaidForCurrentYear = (
  subscription?: MembershipSubscriptionSnapshot,
  year = new Date().getFullYear()
) => {
  if (!subscription) return false

  if (typeof subscription.membershipPaidThisYear === 'boolean') {
    if (!subscription.membershipPaidThisYear) return false

    if (typeof subscription.lastMembershipPaymentYear === 'number') {
      return subscription.lastMembershipPaymentYear === year
    }
    
    return true
  }

  if (typeof subscription.lastMembershipPaymentYear === 'number') {
    return subscription.lastMembershipPaymentYear === year
  }

  // Legacy fallback for old accounts not yet migrated:
  // infer payment year from startDate when annual fields are missing.
  if (subscription.startDate) {
    const start = new Date(subscription.startDate)
    if (!Number.isNaN(start.getTime())) {
      return start.getFullYear() === year
    }
  }

  return false
}

export const getMembershipPaymentUiState = (
  transactions: Transaction[] = [],
  year = new Date().getFullYear(),
  subscription?: MembershipSubscriptionSnapshot
): MembershipPaymentUiState => {
  const latestRequest = getLatestMembershipTopUpTransaction(transactions, year)

  if (
    latestRequest?.status === 'pending' ||
    latestRequest?.status === 'awaiting_payment'
  ) {
    return 'pending'
  }
  if (latestRequest?.status === 'failed') return 'rejected'

  if (isMembershipPaidForCurrentYear(subscription, year)) return 'success'
  if (latestRequest?.status === 'completed') return 'success'

  return 'initial'
}

export const getMembershipPaymentBadgeLabel = (
  state: MembershipPaymentUiState
) => {
  if (state === 'success') return 'Vous êtes à jour'
  if (state === 'pending') return 'En verification'
  if (state === 'rejected') return 'Rejeter'
  return 'Initial'
}

export const getMembershipPaymentBadgeClass = (
  state: MembershipPaymentUiState
) => {
  if (state === 'success') return 'bg-green-600 text-white'
  if (state === 'pending') return 'bg-yellow-500 text-yellow-950'
  if (state === 'rejected') return 'bg-red-600 text-white'
  return 'bg-slate-500 text-white'
}

export const formatNextMembershipDueDate = (endDate?: Date | string) => {
  const fallback = '01 Janvier 2025'
  if (!endDate) return fallback

  const parsedDate = new Date(endDate)
  if (Number.isNaN(parsedDate.getTime())) return fallback

  const formatted = new Intl.DateTimeFormat('fr-CA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)

  const [day = '01', month = 'janvier', year = '2025'] = formatted.split(' ')
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`
}

export const shouldResetMembershipDisplayForCurrentYear = (
  subscription?: MembershipSubscriptionSnapshot,
  year = new Date().getFullYear()
) => {
  if (!subscription || subscription.status !== 'active') return false
  return !isMembershipPaidForCurrentYear(subscription, year)
}

export const isRpnTopUpTarget = (target: TopUpTargetWithBoth) =>
  target === 'rpn'

export const canPrimaryMemberTopUpRpn = ({
  isPrimaryMember = true,
  transactions = [],
  subscription,
  year = new Date().getFullYear(),
}: RpnTopUpEligibilityInput) => {
  if (!isPrimaryMember) return true

  return getMembershipPaymentUiState(transactions, year, subscription) === 'success'
}
