import { Transaction } from '@/types/Transaction'

export type TopUpTarget = 'membership' | 'rpn'
export type BillingSection = 'payment' | 'history'

const MEMBERSHIP_PATTERNS = ['membership', 'cotisation', 'premier paiement']
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
