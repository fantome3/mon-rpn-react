/* eslint-disable @typescript-eslint/no-explicit-any */
export type Transaction = {
  _id?: string
  userId: string | any
  amount: number
  type: 'debit' | 'credit'
  reason: string
  status: 'completed' | 'failed' | 'pending'
  createdAt?: Date
}
