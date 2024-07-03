import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { User } from './userModel'

class Interac {
  @prop({ required: true })
  public amountInterac!: number

  @prop({ required: true })
  public refInterac!: string
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

  @prop({})
  public card?: Card

  @prop({})
  public interac?: Interac

  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public userTel!: string

  @prop({ required: true })
  public userResidenceCountry!: string

  @prop({ ref: User, required: false })
  public userId?: Ref<User>
}

export const AccountModel = getModelForClass(Account)
