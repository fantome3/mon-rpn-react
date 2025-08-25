import { transactionStatus } from '@/lib/constant'

export const isAccountPendingPayment = (
  account?: { isAwaitingFirstPayment: boolean; solde: number } | null,
) => {
  console.log('Account:', account)
  return !!account && account.isAwaitingFirstPayment && account.solde === 0
}

export const getAccountStatusLabel = (
  account?: { isAwaitingFirstPayment: boolean; solde: number } | null,
  lastTransactionStatus?: string,
): string | null => {
  if (isAccountPendingPayment(account)) return `(${transactionStatus[3].value})`
  const status = transactionStatus.find((s) => s.status === lastTransactionStatus)
  if (status) return `(${status.value})`
  return null
}
