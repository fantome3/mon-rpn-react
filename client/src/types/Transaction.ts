/* eslint-disable @typescript-eslint/no-explicit-any */
export type Transaction = {
  _id?: string
  userId: string | any
  amount: number
  type: 'debit' | 'credit'
  reason: string
  refInterac?: string
  status: 'completed' | 'failed' | 'pending' | 'awaiting_payment'
  createdAt?: Date
}
