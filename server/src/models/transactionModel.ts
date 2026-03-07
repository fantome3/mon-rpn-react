import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { User } from './userModel'

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}
export type TransactionTypeValue = `${TransactionType}`

export enum TransactionFundType {
  MEMBERSHIP = 'membership',
  RPN = 'rpn',
  BOTH = 'both',
}
export type TransactionFundTypeValue = `${TransactionFundType}`

export enum TransactionStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  COMPLETED = 'completed',
  SUCCESS = 'success',
  FAILED = 'failed',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}
export type TransactionStatusValue = `${TransactionStatus}`

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Transaction {
  public _id?: string

  @prop({ ref: User, required: true })
  public userId!: Ref<User>

  @prop({ required: true })
  public amount!: number

  @prop({ required: true, enum: Object.values(TransactionType) })
  public type!: TransactionTypeValue

  @prop({ enum: Object.values(TransactionFundType) })
  public fundType?: TransactionFundTypeValue

  @prop()
  public membershipAmount?: number

  @prop()
  public rpnAmount?: number

  @prop({ required: true })
  public reason!: string //e.g "Prélèvement décès"

  @prop()
  public refInterac?: string

  @prop({ required: true, enum: Object.values(TransactionStatus), default: TransactionStatus.COMPLETED })
  public status!: TransactionStatusValue

  @prop({ default: false })
  public balanceApplied?: boolean

  @prop({ default: 0 })
  public refundedAmount?: number

  @prop()
  public appliedAt?: Date

  @prop()
  public processedAt?: Date

  @prop()
  public rejectedAt?: Date

  @prop()
  public failedAt?: Date

  @prop()
  public refundedAt?: Date

  @prop({ ref: User })
  public processedBy?: Ref<User>
}

export const TransactionModel = getModelForClass(Transaction)
