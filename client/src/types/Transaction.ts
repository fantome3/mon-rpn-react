import type {
  TransactionFundType,
  TransactionStatus,
  TransactionType,
} from './Status'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Transaction = {
  _id?: string
  userId: string | any
  amount: number
  type: TransactionType
  fundType?: TransactionFundType
  membershipAmount?: number
  rpnAmount?: number
  reason: string
  refInterac?: string
  status: TransactionStatus
  createdAt?: Date
}
