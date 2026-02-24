import { Transaction } from '@/types/Transaction'

export type TopUpTarget = 'membership' | 'rpn'
export type BillingSection = 'payment' | 'history'
export type MembershipPaymentUiState =
  | 'initial'
  | 'rejected'
  | 'pending'
  | 'success'

type MembershipSubscriptionSnapshot = {
  status?: string
  lastMembershipPaymentYear?: number
  membershipPaidThisYear?: boolean
  startDate?: Date | string
  endDate?: Date | string
}

const MEMBERSHIP_PATTERNS = ['membership', 'cotisation', 'premier paiement']
const MEMBERSHIP_TOPUP_PATTERNS = ['renflouement membership', 'premier paiement']
const RPN_TOPUP_PATTERNS = ['fonds rpn', 'rpn', 'premier paiement']

const normalize = (value?: string) => (value || '').toLowerCase()

const includesAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern))

export const getTargetFromQuery = (
  value?: string | null
): TopUpTarget | null => {
  if (value === 'membership' || value === 'rpn') return value
  return null
}

export const buildBillingPaymentUrl = (target: TopUpTarget) =>
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

export const buildTopUpReason = (target: TopUpTarget) =>
  target === 'membership'
    ? 'Renflouement membership via Interac'
    : 'Renflouement fonds RPN via Interac'

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
  if (state === 'success') return 'A jour'
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
