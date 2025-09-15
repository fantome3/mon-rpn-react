//Modèle pour la gestion des transactions

import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { User } from './userModel'
import { TransactionState } from '../domain/transaction/TransactionState'
import { CompletedState } from '../domain/transaction/states'

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

  @prop({ type: () => Object, required: true, default: () => new CompletedState() })
  public state!: TransactionState
}

export const TransactionModel = getModelForClass(Transaction)
