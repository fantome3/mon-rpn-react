import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { User } from './userModel'

class Interac {
  @prop({ required: true })
  public amountInterac!: number

  @prop({ required: true })
  public refInterac!: string

  @prop({ default: Date.now })
  public dateInterac!: Date
}

class Card {
  @prop({ required: true })
  public network!: string

  @prop({ required: true })
  public cvv!: string

  @prop({ required: true })
  public expiry_date!: string

  @prop({})
  public card_holder_name?: string

  @prop({ required: true })
  public credit_card_number!: string

  @prop({ default: Date.now })
  public dateCard!: Date
}

@modelOptions({
  schemaOptions: { timestamps: true },
})

export class Account {
  public _id?: string

  @prop({ required: true })
  public solde!: number

  @prop({ required: true })
  public paymentMethod!: string

  @prop({ type: () => [Card], default: [] })
  public card?: Card[]

  @prop({ type: () => Interac, default: [] })
  public interac?: Interac[]

  @prop({ default: false })
  public isAwaitingFirstPayment?: boolean

  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop({ required: true })
  public userTel!: string

  @prop({ required: true })
  public userResidenceCountry!: string

  @prop({ ref: User, required: false })
  public userId?: Ref<User>
}

// AccountModel defini les principaux membres actifs de l'application (excluant les personnes à charge)
export const AccountModel = getModelForClass(Account)
