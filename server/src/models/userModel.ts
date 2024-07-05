import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
  Severity,
} from '@typegoose/typegoose'
import { v4 as uuidv4 } from 'uuid'
class Infos {
  @prop({ required: true })
  public residenceCountry!: string

  @prop({ required: true })
  public postalCode!: string

  @prop({ required: true })
  public address!: string

  @prop({ required: true })
  public tel!: string

  @prop({ required: true })
  public hasInsurance!: boolean
}

class Origines {
  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop({ required: true })
  public birthDate!: Date

  @prop({ required: true })
  public nativeCountry!: string

  @prop({ required: true })
  public sex!: string
}

class Register {
  @prop({ required: true, unique: true })
  public email!: string

  @prop({ required: true })
  public password!: string

  @prop()
  public newPassword?: string

  @prop({ required: true, default: false })
  public conditions!: boolean
}

class FamilyMember {
  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop({ required: true })
  public relationship!: string

  @prop({ required: true, default: 'active' })
  public status!: string //Active, Deleted,
}

class Subscription {
  @prop({ required: true, default: Date.now })
  public startDate!: Date

  @prop({ required: true, default: 'registered' })
  public status!: string //Active, Inactive, Current, Registered
}

@modelOptions({
  schemaOptions: { timestamps: true },
  options: {
    allowMixed: Severity.ALLOW,
    customName: 'users',
  },
})
export class User {
  public _id?: string

  @prop({ required: true })
  public register!: Register

  @prop({ required: true })
  public origines!: Origines

  @prop({ required: true })
  public infos!: Infos

  @prop({ required: true, default: false })
  public rememberMe!: boolean

  @prop({ required: true, default: false })
  public isAdmin!: boolean

  @prop()
  public cpdLng?: string

  @prop({ required: true, default: true })
  public primaryMember!: boolean

  @prop({ required: true, default: [] })
  public familyMembers!: FamilyMember[]

  @prop({ required: true, default: new Subscription() })
  public subscription!: Subscription

  @prop({ default: () => uuidv4() }) // Generate unique UUID
  public referralCode?: string

  @prop({ ref: User, required: false }) // Reference to another User document
  public referredBy?: Ref<User>
}

export const UserModel = getModelForClass(User)
