//Modèle pour la gestion des transactions

import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { User } from './userModel'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Transaction {
  public _id?: string

  @prop({ ref: User, required: true })
  public userId!: Ref<User>

  @prop({ required: true })
  public amount!: number

  @prop({ required: true })
  public type!: 'debit' | 'credit'

  @prop({ required: true })
  public reason!: string //e.g "Prélèvement décès"

  @prop()
  public refInterac?: string

  @prop({ required: true, default: 'completed' })
  public status!: 'completed' | 'failed' | 'pending' | 'awaiting_payment'
}

export const TransactionModel = getModelForClass(Transaction)
