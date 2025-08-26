import type { Account } from '../types/Account.ts'
import type { Transaction } from '../types/Transaction.ts'

export const getAccountDisplayStatus = (
  account?: Account,
  lastTransaction?: Transaction,
) => {
  const awaitingPayment = Boolean(account?.isAwaitingFirstPayment)
  const lastTransactionPending =
    !awaitingPayment && lastTransaction?.status === 'pending'

  return { awaitingPayment, lastTransactionPending }
}

