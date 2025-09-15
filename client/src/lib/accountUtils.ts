import type { Account } from '../types/Account.ts'
import type { Transaction } from '../types/Transaction.ts'
import { transactionStatus } from './constant.ts'

export const getAccountDisplayStatus = (
  account?: Account,
  lastTransaction?: Transaction,
) => {
  const awaitingPayment = Boolean(account?.isAwaitingFirstPayment)
  const lastTransactionPending =
    !awaitingPayment && lastTransaction?.state.status === 'pending'

  return { awaitingPayment, lastTransactionPending }
}

export const getAccountStatusLabel = (
  account?: Account,
  lastTransactionStatus?: string,
): string | null => {
  if (account?.isAwaitingFirstPayment) return `(${transactionStatus[3].value})`
  const status = transactionStatus.find((s) => s.status === lastTransactionStatus)
  if (status) return `(${status.value})`
  return null
}
