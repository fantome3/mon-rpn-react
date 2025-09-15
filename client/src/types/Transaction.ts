/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransactionState } from '@/domain/transaction/TransactionState'

export type Transaction = {
  _id?: string
  userId: string | any
  amount: number
  type: 'debit' | 'credit'
  reason: string
  refInterac?: string
  state: TransactionState
  createdAt?: Date
}
