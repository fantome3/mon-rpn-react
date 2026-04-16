import {
  TOP_UP_TARGETS_WITH_BOTH,
  Transaction,
  type BillingSection,
  type MembershipPaymentUiState,
  type RpnStatus,
  type Subscription,
  type TopUpTarget,
  type TopUpTargetWithBoth,
  type TransactionFundType,
} from '@/types'
import {
  getTransactionStatusLabel as getTransactionStatusLabelFromState,
  normalizeTransactionStatus,
} from './transactionStatus'

export type {
  TopUpTarget,
  TopUpTargetWithBoth,
  BillingSection,
  MembershipPaymentUiState,
}

type MembershipSubscriptionSnapshot = Pick<
  Subscription,
  | 'status'
  | 'lastMembershipPaymentYear'
  | 'membershipPaidThisYear'
  | 'startDate'
  | 'endDate'
>

type FundFilter = Exclude<TransactionFundType, 'both'>

export type FundAmountContext = {
  membershipDueAmount: number
  rpnDueAmount: number
}

type RpnTopUpEligibilityInput = {
  isPrimaryMember?: boolean
  transactions?: Transaction[]
  subscription?: MembershipSubscriptionSnapshot
  year?: number
}

const MEMBERSHIP_HISTORY_REASON_PATTERNS = [
  'cotisation annuelle',
  'renflouement membership',
]

const RPN_HISTORY_REASON_PATTERNS = [
  'renflouement fonds rpn',
  'prelevement deces',
]

const BOTH_HISTORY_REASON_PATTERNS = [
  'paiement combine membership et fonds rpn',
  'premier paiement',
  'premier paiement via interac',
  'contribution rpn',
]

export const RPN_PAYMENT_BLOCK_MESSAGE =
  'Le paiement du fonds RPN est disponible uniquement quand la cotisation membership du membre principal et des personnes à charge est à jour.'

const stripDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalize = (value?: string) =>
  stripDiacritics(value || '').toLowerCase().trim()

const includesAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern))

const sortByDateDesc = (a: Transaction, b: Transaction) => {
  const aTime = getTransactionDate(a)?.getTime() ?? 0
  const bTime = getTransactionDate(b)?.getTime() ?? 0
  return bTime - aTime
}

const isFundType = (value: unknown): value is TransactionFundType =>
  value === 'membership' || value === 'rpn' || value === 'both'

const inferFundTypeFromReason = (
  reason?: string
): TransactionFundType | null => {
  const normalizedReason = normalize(reason)
  if (!normalizedReason) return null

  if (includesAny(normalizedReason, BOTH_HISTORY_REASON_PATTERNS)) {
    return 'both'
  }
  if (includesAny(normalizedReason, MEMBERSHIP_HISTORY_REASON_PATTERNS)) {
    return 'membership'
  }
  if (includesAny(normalizedReason, RPN_HISTORY_REASON_PATTERNS)) {
    return 'rpn'
  }

  return null
}

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

export const getTransactionFundType = (
  transaction: Transaction
): TransactionFundType | null => {
  if (isFundType(transaction.fundType)) return transaction.fundType
  return inferFundTypeFromReason(transaction.reason)
}

export const transactionTouchesFund = (
  transaction: Transaction,
  fund: FundFilter
) => {
  const fundType = getTransactionFundType(transaction)
  if (!fundType) return false
  return fundType === fund || fundType === 'both'
}

const toPositiveAmount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0

export const getTransactionAmountByFund = (
  transaction: Transaction,
  fund: FundFilter,
  context: FundAmountContext
) => {
  if (fund === 'membership' && typeof transaction.membershipAmount === 'number') {
    return toPositiveAmount(transaction.membershipAmount)
  }

  if (fund === 'rpn' && typeof transaction.rpnAmount === 'number') {
    return toPositiveAmount(transaction.rpnAmount)
  }

  const fundType = getTransactionFundType(transaction)
  const fullAmount = toPositiveAmount(transaction.amount)
  if (fundType !== 'both') return fullAmount

  const membershipDue = toPositiveAmount(context.membershipDueAmount)
  const rpnDue = toPositiveAmount(context.rpnDueAmount)
  const totalDue = membershipDue + rpnDue

  if (totalDue <= 0) return fullAmount / 2

  const inferredMembership = Math.min(fullAmount, membershipDue)
  const inferredRpn = Math.max(0, fullAmount - inferredMembership)

  return fund === 'membership' ? inferredMembership : inferredRpn
}

const isTransactionInYear = (transaction: Transaction, year: number) => {
  const transactionDate = getTransactionDate(transaction)
  return !!transactionDate && transactionDate.getFullYear() === year
}

export const getFundCurrentYearTransactions = (
  transactions: Transaction[] = [],
  fund: FundFilter,
  year = new Date().getFullYear()
) =>
  transactions
    .filter(
      (transaction) =>
        isTransactionInYear(transaction, year) &&
        transactionTouchesFund(transaction, fund)
    )
    .sort(sortByDateDesc)

export const getMembershipCurrentYearTransactions = (
  transactions: Transaction[] = [],
  year = new Date().getFullYear()
) => getFundCurrentYearTransactions(transactions, 'membership', year)

export const getRpnCurrentYearTransactions = (
  transactions: Transaction[] = [],
  year = new Date().getFullYear()
) => getFundCurrentYearTransactions(transactions, 'rpn', year)

export const getLastRpnTopUpTransactions = (
  transactions: Transaction[] = [],
  limit = 5
) =>
  getRpnCurrentYearTransactions(transactions)
    .filter((transaction) => transaction.type === 'credit')
    .slice(0, limit)

export const getTransactionStatusLabel = (status: Transaction['status']) => {
  return getTransactionStatusLabelFromState(status)
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

const isMembershipTopUp = (transaction: Transaction) =>
  transaction.type === 'credit' &&
  transactionTouchesFund(transaction, 'membership')

export const getLatestMembershipTopUpTransaction = (
  transactions: Transaction[] = [],
  year = new Date().getFullYear()
) =>
  transactions
    .filter(
      (transaction) =>
        isMembershipTopUp(transaction) && isTransactionInYear(transaction, year)
    )
    .sort(sortByDateDesc)[0]

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
  const latestStatus = normalizeTransactionStatus(latestRequest?.status)

  if (latestStatus === 'pending' || latestStatus === 'awaiting_payment') {
    return 'pending'
  }
  if (latestStatus === 'failed' || latestStatus === 'rejected') {
    return 'rejected'
  }

  if (isMembershipPaidForCurrentYear(subscription, year)) return 'success'
  if (latestStatus === 'completed') return 'success'

  return 'initial'
}

export const getMembershipPaymentBadgeLabel = (
  state: MembershipPaymentUiState
) => {
  if (state === 'success') return 'Vous êtes à jour'
  if (state === 'pending') return 'En vérification'
  if (state === 'rejected') return 'Rejeter'
  return 'Auncun dépôt effectuer'
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

/**
 * Dérive le statut RPN effectif d'un membre.
 * Rétrocompatibilité : pour les documents sans rpnStatus persisté,
 * un solde positif indique une inscription antérieure.
 */
export const resolveEffectiveRpnStatus = (
  subscription: Pick<Subscription, 'rpnStatus'> | undefined,
  rpnBalance: number
): RpnStatus => {
  if (subscription?.rpnStatus) return subscription.rpnStatus
  
  return rpnBalance > 0 ? 'enrolled' : 'not_enrolled'
}
